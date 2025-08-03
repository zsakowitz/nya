import { nameIdent, ScriptDeps, type NameIdent } from "@/eval/tx"
import { Field } from "@/field/field"
import type { Options } from "@/field/options"
import { errorText } from "@/lib/error"

export class Scope {
  constructor(readonly options: Options) {}

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
  private readonly defs = new Map<string, FieldComputed[]>()

  /** A map from binding IDs to the fields which mention them. */
  private readonly deps = new Map<string, FieldComputed[]>()

  addNestedDeps(set: Set<string>) {
    const todo = new Set<string>(set)
    while (todo.size) {
      const current = [...todo]
      todo.clear()
      for (const id of current) {
        const definers = this.defs.get(id)
        if (!definers) continue
        for (const src of definers) {
          for (const id of src.deps.deps) {
            if (!set.has(id)) {
              set.add(id)
              todo.add(id)
            }
          }
        }
      }
    }
  }

  readonly hooks: (() => void)[] = []

  flush() {
    for (const field of this.fields) {
      if (!field.dirtyAst) continue
      field.error = undefined

      this.untrack(field)
      try {
        const ast = field.block.parseTopLevel()
        field.id = undefined
        if (ast.data.type == "binding") {
          const id = nameIdent(ast.data.data.name)
          if (id) {
            field.id = id
          }
        }
        const myDeps = new ScriptDeps()
        myDeps.check(ast)
        field.deps = myDeps
        field.dirtyAst = false
      } catch (e) {
        const msg = errorText(e)
        console.warn("[deps]", msg)
        field.error = msg
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
        for (const dependent of this.deps.get(field.id) ?? []) {
          if (dependent.dirtyValue) continue
          dependent.dirtyValue = true
          dirty++
        }
      }
    }

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
      const def = this.defs.get(field.id)
      if (def) {
        const idx = def.indexOf(field)
        if (idx != -1) {
          def.splice(idx, 1)
        }
      }
    }

    for (const id of field.deps.deps) {
      const dep = this.deps.get(id)
      if (!dep) continue
      const idx = dep.indexOf(field)
      if (idx == -1) continue
      dep.splice(idx, 1)
    }
  }

  retrack(field: FieldComputed) {
    if (field.id) {
      const def = this.defs.upsert(field.id, [])
      const idx = def.indexOf(field)
      if (idx == -1) {
        def.push(field)
      }
    }

    for (const id of field.deps.deps) {
      const dep = this.deps.upsert(id, [])
      const idx = dep.indexOf(field)
      if (idx != -1) continue
      dep.push(field)
    }
  }

  trackNameNow(field: FieldComputed) {
    if (field.leaf) return
    if (!field.dirtyAst) return

    const ast = field.block.parseTopLevel()
    if (ast.data.type == "binding") {
      const id = nameIdent(ast.data.data.name)
      const def = this.defs.upsert(id, [])
      const idx = def.indexOf(field)
      if (idx == -1) {
        def.push(field)
      }
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
  deps = new ScriptDeps()

  /** The last LaTeX of this field. */
  private _latex = ""

  /** The cached binding ID defined by this field. */
  id: NameIdent | undefined

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
