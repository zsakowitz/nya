import type { Node, Var } from "@/eval/ast/token"
import { glsl, js, sym, type PropsDrag } from "@/eval/ast/tx"
import { Deps } from "@/eval/deps"
import type { PropsGlsl, PropsSym } from "@/eval/glsl"
import type { PropsJs } from "@/eval/js"
import {
  BindingFn,
  BindingGlslValue,
  Bindings,
  id,
  name,
  tryId,
  tryName,
} from "@/eval/lib/binding"
import { GlslContext, GlslHelpers } from "@/eval/lib/fn"
import { JsContext } from "@/eval/lib/jsctx"
import type { Sym } from "@/eval/sym"
import type { GlslValue, JsValue } from "@/eval/ty"
import { frac } from "@/eval/ty/create"
import { Field } from "@/field/field"
import type { Options } from "@/field/options"

export class Scope {
  constructor(
    readonly options: Options,
    readonly ctxJs: JsContext,
  ) {
    this.helpers = new GlslHelpers(this.ctxJs)
    const self = this

    this.propsJs = this.propsSym = {
      base: frac(10, 1),
      get bindingsJs() {
        return self.bindingsJs
      },
      get bindingsSym() {
        return self.bindingsSym
      },
      ctxJs: this.ctxJs,
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

  queueGlobalRecompute() {
    for (const field of this.fields) {
      field.dirtyValue = true
    }
    this.queueUpdate()
  }

  /** A map from binding IDs to the fields which define them. */
  private readonly defs: Record<string, FieldComputed[]> = Object.create(null)

  /** A map from binding IDs to the fields which mention them. */
  private readonly deps: Record<string, FieldComputed[]> = Object.create(null)

  bindingsJs!: Bindings<JsValue | BindingFn>
  bindingsDrag!: Bindings<[FieldComputed, Node]>
  bindingsGlsl!: Bindings<GlslValue | BindingGlslValue | BindingFn>
  bindingsSym!: Bindings<Sym | BindingFn>
  readonly helpers
  readonly propsJs: PropsJs
  readonly propsSym: PropsSym

  addNestedDeps(set: Set<string>) {
    const todo = new Set<string>(set)
    while (todo.size) {
      const current = [...todo]
      todo.clear()
      for (const id of current) {
        const definers = this.defs[id]
        if (!definers) continue
        for (const src of definers) {
          for (const id in src.deps.ids) {
            if (!set.has(id)) {
              set.add(id)
              todo.add(id)
            }
          }
        }
      }
    }
  }

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
      get bindingsSym() {
        return self.bindingsSym
      },
      ctx: new GlslContext(this.helpers),
      ctxJs: this.ctxJs,
    }
  }

  readonly hooks: (() => void)[] = []

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
    const bindingMapSym: Record<string, Sym | BindingFn> = Object.create(null)
    const bindingMapGlsl: Record<
      string,
      GlslValue | BindingGlslValue | BindingFn
    > = Object.create(null)
    const bindingMapDrag: Record<string, [FieldComputed, Node]> =
      Object.create(null)
    const bindingsJs = new Bindings(bindingMapJs)
    const bindingsSym = new Bindings(bindingMapSym)
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
          (_ctx, values) => {
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
          (_ctx, values): Sym => {
            if (values.length != params.length) {
              throw new Error(
                `Function '${tryName(first.name)}' expects ${params.length} arguments.`,
              )
            }

            const args: Record<string, Sym> = Object.create(null)
            for (let i = 0; i < params.length; i++) {
              args[params[i]![0]] = values[i]!
            }

            return bindingsSym.withArgs(args, () => ({
              type: "dep",
              id: def,
              value: sym(value, this.propsJs),
            }))
          },
        )

        bindingMapJs[def] = fn
        bindingMapSym[def] = fn
        bindingMapGlsl[def] = fn
      } else if (field.length == 1) {
        const { value: node } = first!

        Object.defineProperty(bindingMapJs, def, {
          configurable: true,
          enumerable: true,
          get: () =>
            this.propsJs.bindingsJs.withoutArgs(() => js(node, this.propsJs)),
        })

        // intentionally not defined on bindingMapSym

        Object.defineProperty(bindingMapGlsl, def, {
          configurable: true,
          enumerable: true,
          value: new BindingGlslValue((ctx) => {
            const props = this.propsGlsl()
            props.ctx = ctx
            return glsl(node, props)
          }),
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
    this.bindingsSym = bindingsSym
    this.bindingsDrag = bindingsDrag
    this.bindingsGlsl = bindingsGlsl

    for (const field of this.fields) {
      if (field.dirtyValue) {
        field.dirtyValue = false
        field.recompute?.()
      }
    }

    for (const hook of this.hooks) {
      hook()
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
    super(scope.options, scope, className)
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

  allDeps() {
    const deps = new Set(Object.keys(this.deps.ids))
    this.scope.addNestedDeps(deps)
    return deps
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
