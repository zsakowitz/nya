import type { Node } from "../eval/ast/token"
import { deps, Deps } from "../eval/deps"
import { tryId } from "../eval/lib/binding"
import { Field } from "../field/field"
import type { Exts, Options } from "../field/options"

export class Scope {
  constructor(
    readonly exts: Exts,
    readonly options: Options,
  ) {}

  /** All fields controlled by this evaluation scope. */
  private readonly fields: FieldComputed[] = []

  adopt(field: FieldComputed) {
    this.fields.push(field)
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

  flush() {
    for (const field of this.fields) {
      if (!field.dirtyAst) continue
      field.error = undefined

      this.untrack(field)
      try {
        field.ast = field.block.expr()
        field.id = undefined
        if (field.ast.type == "binding") {
          const id = tryId(field.ast.name)
          if (id) {
            field.id = id
          }
        }
        const myDeps = new Deps()
        deps(field.ast, myDeps)
        field.deps = myDeps
      } catch (e) {
        field.error = toError(e)
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

    for (const field of this.fields) {
      field.dirtyAst = false
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
}

export class FieldComputed extends Field {
  constructor(readonly scope: Scope) {
    super(scope.exts, scope.options)
    scope.adopt(this)
  }

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
    this._latex = this.block.latex()
  }

  onAfterChange(wasChangeCanceled: boolean): void {
    super.onAfterChange(wasChangeCanceled)
    if (wasChangeCanceled || this.block.latex() == this._latex) return
    this.dirtyAst = this.dirtyValue = true
    if (this.scope) {
      this.scope.queueUpdate()
    }
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
