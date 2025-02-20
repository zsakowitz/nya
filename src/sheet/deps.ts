import type { Node, Var } from "../eval/ast/token"
import type { PropsDrag } from "../eval/ast/tx"
import { Deps } from "../eval/deps"
import { glsl, type PropsGlsl } from "../eval/glsl"
import { js, type PropsJs } from "../eval/js"
import {
  BindingFn,
  Bindings,
  id,
  name,
  tryId,
  tryName,
} from "../eval/lib/binding"
import { GlslContext, GlslHelpers } from "../eval/lib/fn"
import type { GlslValue, JsValue } from "../eval/ty"
import { frac } from "../eval/ty/create"
import { TY_INFO } from "../eval/ty/info"
import { Field } from "../field/field"
import type { Options } from "../field/options"

export class Scope {
  constructor(readonly options: Options) {
    const self = this

    this.propsJs = {
      base: frac(10, 1),
      get bindingsJs() {
        return self.bindingsJs
      },
    }

    this.flush()
  }

  /** All fields controlled by this evaluation scope. */
  private readonly fields: FieldComputed[] = []

  adopt(field: FieldComputed) {
    if (this.fields.includes(field)) return
    this.fields.push(field)
    this.queueUpdate()
  }

  disown(field: FieldComputed) {
    const idx = this.fields.indexOf(field)
    if (idx == -1) return
    this.fields.splice(idx, 1)
    this.untrack(field)
    this.queueUpdate()
  }

  private _queued = false
  queueUpdate() {
    if (this._queued) {
      return
    }
    queueMicrotask(() => {
      this._queued = false
      this.flush()
    })
    this._queued = true
  }

  /** A map from binding IDs to the fields which define them. */
  private readonly defs: Record<string, FieldComputed[]> = Object.create(null)

  /** A map from binding IDs to the fields which mention them. */
  private readonly deps: Record<string, FieldComputed[]> = Object.create(null)

  bindingsJs!: Bindings<JsValue | BindingFn>
  bindingsDrag!: Bindings<[FieldComputed, Node]>
  bindingsGlsl!: Bindings<GlslValue | BindingFn>
  readonly helpers = new GlslHelpers()
  readonly propsJs: PropsJs

  propsDrag(field: FieldComputed): PropsDrag {
    return {
      field,
      bindingsDrag: this.bindingsDrag,
      js: this.propsJs,
    }
  }

  propsGlsl(): PropsGlsl {
    const self = this
    return {
      base: frac(10, 1),
      get bindings() {
        return self.bindingsGlsl
      },
      get bindingsJs() {
        return self.bindingsJs
      },
      ctx: new GlslContext(this.helpers),
    }
  }

  flush() {
    for (const field of this.fields) {
      if (!field.dirtyAst) continue
      field.error = undefined

      this.untrack(field)
      try {
        field.ast = field.block.expr(!field.leaf)
        field.id = undefined
        if (field.ast.type == "binding") {
          const id = tryId(field.ast.name)
          if (id) {
            field.id = id
          }
        }
        const myDeps = new Deps()
        myDeps.add(field.ast)
        field.deps = myDeps
        field.dirtyAst = false
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn("[deps]", msg)
        field.error = toError(e)
        field.recompute?.()
        continue
      }
      this.retrack(field)
    }

    let prev = 0
    let dirty = 0
    for (const field of this.fields) {
      if (field.dirtyValue) dirty++
    }
    while (prev != dirty) {
      prev = dirty
      for (const field of this.fields) {
        if (!(field.dirtyValue && field.id)) continue
        for (const dependent of this.deps[field.id] || []) {
          if (dependent.dirtyValue) continue
          dependent.dirtyValue = true
          dirty++
        }
      }
    }

    const bindingMapJs: Record<string, JsValue | BindingFn> =
      Object.create(null)
    const bindingMapGlsl: Record<string, GlslValue | BindingFn> =
      Object.create(null)
    const bindingMapDrag: Record<string, [FieldComputed, Node]> =
      Object.create(null)
    const bindingsJs = new Bindings(bindingMapJs)
    const bindingsDrag = new Bindings(bindingMapDrag)
    const bindingsGlsl = new Bindings(bindingMapGlsl)
    for (const def in this.defs) {
      const fields = this.defs[def]!
      const field = this.defs[def]!.map(
        (x) => x.ast as Node & { type: "binding" },
      )

      const first = field[0]
      if (field.length == 1 && first?.params != null) {
        const { value, params } = first

        const fn = new BindingFn(
          (values) => {
            if (values.length != params.length) {
              throw new Error(
                `Function '${tryName(first.name)}' expects ${params.length} arguments.`,
              )
            }

            const args: Record<string, JsValue> = Object.create(null)
            for (let i = 0; i < params.length; i++) {
              args[params[i]![0]] = values[i]!
            }

            return bindingsJs.withArgs(args, () => js(value, this.propsJs))
          },
          (ctx, values) => {
            if (values.length != params.length) {
              throw new Error(
                `Function '${tryName(first.name)}' expects ${params.length} arguments.`,
              )
            }

            const args: Record<string, GlslValue> = Object.create(null)
            for (let i = 0; i < params.length; i++) {
              args[params[i]![0]] = values[i]!
            }

            return bindingsGlsl.withArgs(args, () =>
              glsl(value, { ...this.propsGlsl(), ctx }),
            )
          },
        )

        bindingMapJs[def] = fn
        bindingMapGlsl[def] = fn
      } else if (field.length == 1) {
        const { value: node } = first!

        let valueJs: JsValue | undefined
        Object.defineProperty(bindingMapJs, def, {
          configurable: true,
          enumerable: true,
          get: () =>
            (valueJs ??= this.propsJs.bindingsJs.withoutArgs(() =>
              js(node, this.propsJs),
            )),
        })

        let valueGlsl: GlslValue | undefined
        Object.defineProperty(bindingMapGlsl, def, {
          configurable: true,
          enumerable: true,
          get: () => {
            if (valueGlsl) return valueGlsl

            const props = this.propsGlsl()
            const ctx = (props.ctx = new GlslContext(this.helpers))
            const rawValue = glsl(node, props)
            const name = ctx.name()
            ctx.helpers.helpers += `${TY_INFO[rawValue.type].glsl}${rawValue.list !== false ? `[${rawValue.list}]` : ""} ${name}() {
  ${ctx.block}
  return ${rawValue.expr};
}`
            return (valueGlsl = { ...rawValue, expr: `${name}()` })
          },
        })

        bindingMapDrag[def] = [fields[0]!, node]
      } else if (field.length) {
        let myName = def
        try {
          if (field[0]) {
            myName = name(field[0].name)
          }
        } catch {}
        const err = `Multiple definitions for ${myName}.`

        Object.defineProperty(bindingMapJs, def, {
          configurable: true,
          enumerable: true,
          get() {
            throw new Error(err)
          },
        })

        Object.defineProperty(bindingMapGlsl, def, {
          configurable: true,
          enumerable: true,
          get() {
            throw new Error(err)
          },
        })

        Object.defineProperty(bindingMapDrag, def, {
          configurable: true,
          enumerable: true,
          get() {
            throw new Error(err)
          },
        })
      }
    }
    this.bindingsJs = bindingsJs
    this.bindingsDrag = bindingsDrag
    this.bindingsGlsl = bindingsGlsl

    for (const field of this.fields) {
      if (field.dirtyValue) {
        field.dirtyValue = false
        field.recompute?.()
      }
    }
  }

  untrack(field: FieldComputed) {
    if (field.id) {
      const def = this.defs[field.id]
      if (def) {
        const idx = def.indexOf(field)
        if (idx != -1) {
          def.splice(idx, 1)
        }
      }
    }

    for (const id in field.deps.ids) {
      const dep = this.deps[id]
      if (!dep) continue
      const idx = dep.indexOf(field)
      if (idx == -1) continue
      dep.splice(idx, 1)
    }
  }

  retrack(field: FieldComputed) {
    if (field.id) {
      const def = (this.defs[field.id] ??= [])
      const idx = def.indexOf(field)
      if (idx == -1) {
        def.push(field)
      }
    }

    for (const id in field.deps.ids) {
      const dep = (this.deps[id] ??= [])
      const idx = dep.indexOf(field)
      if (idx != -1) continue
      dep.push(field)
    }
  }

  trackNameNow(field: FieldComputed) {
    if (field.leaf) return
    if (!field.dirtyAst) return

    field.ast = field.block.expr(!field.leaf)
    if (field.ast.type == "binding") {
      var id = tryId(field.ast.name)
    }

    if (id) {
      const def = (this.defs[id] ??= [])
      const idx = def.indexOf(field)
      if (idx == -1) {
        def.push(field)
      }
    }
  }

  name(prefix: string) {
    const existing = Object.entries(this.defs)
      .filter((x) => x[1].length)
      .map((x) => x[0])

    for (let i = 1n; ; i++) {
      const name: Var & { sup?: undefined } = {
        type: "var",
        kind: "var",
        value: prefix,
        sub: { type: "num", span: null, value: i.toString() },
        span: null,
      }
      const myId = id(name)
      if (existing.includes(myId)) continue
      return name
    }
  }
}

export class FieldComputed extends Field {
  constructor(
    readonly scope: Scope,
    className?: string,
    unlinked?: boolean,
  ) {
    super(scope.options, className)
    if (unlinked) {
      this.linked = false
    } else {
      scope.adopt(this)
    }
  }

  /** If `true`, this field is not allowed to define bindings. */
  leaf = false

  /** The cached dependencies of this field. */
  deps = new Deps()

  /** The cached AST of this field. */
  ast: Node = { type: "void" }

  /** The last LaTeX of this field. */
  private _latex = ""

  /** The cached binding ID defined by this field. */
  id: string | undefined

  /**
   * If not null, the error message encountered during parsing or evaluation of
   * this field.
   */
  error: string | undefined

  /** Whether the AST needs to be recomputed. */
  dirtyAst = false

  /** Whether the value needs to be recomputed. */
  dirtyValue = false

  onBeforeChange(): void {
    super.onBeforeChange()
    if (!this.linked) return
    this._latex = this.block.latex()
  }

  onAfterChange(wasChangeCanceled: boolean): void {
    super.onAfterChange(wasChangeCanceled)
    if (!wasChangeCanceled) {
      this.queueAstUpdate()
    }
  }

  queueAstUpdate() {
    if (!this.linked) return
    if (this.block.latex() == this._latex) return
    this.dirtyAst = this.dirtyValue = true
    if (this.scope) {
      this.scope.queueUpdate()
    }
  }

  trackNameNow() {
    this.scope.trackNameNow(this)
  }

  linked = true

  /**
   * Removes this field from its containing scope, so that it will stop
   * receiving and triggering updates.
   */
  unlink() {
    if (!this.linked) return
    this.scope.disown(this)
    this.linked = false
    this.scope.queueUpdate()
  }

  /**
   * Removes this field from its containing scope, so that it will stop
   * receiving and triggering updates.
   */
  relink() {
    if (this.linked) return
    this.dirtyAst = this.dirtyValue = true
    this.scope.adopt(this)
    this.linked = true
    this.scope.queueUpdate()
  }

  recompute?(): void
}

function toError(err: unknown) {
  if (err instanceof Error) {
    return err.message
  } else {
    return String(err)
  }
}
