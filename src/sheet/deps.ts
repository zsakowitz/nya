import type { Node } from "../eval/ast/token"
import { Deps } from "../eval/deps"
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

  /**
   * A map from binding IDs to the fields which depend on them.
   *
   * Does not include recursive dependencies.
   */
  private readonly deps: Record<string, FieldComputed[]> = Object.create(null)

  flush() {}

  //   flush() {
  //     for (const field of this.fields) {
  //       if (!field.dirtyAst) continue
  //       field.error = undefined
  //
  //       const prevAst = field.ast
  //       try {
  //         var nextAst = field.block.ast()
  //       } catch (e) {
  //         field.error = toError(e)
  //         continue
  //       }
  //
  //       const prevBinding =
  //         prevAst.type == "binding" ? tryId(prevAst.name) : undefined
  //       try {
  //         var nextBinding =
  //           nextAst.type == "binding" ? id(nextAst.name) : undefined
  //       } catch (e) {
  //         field.error = toError(e)
  //         continue
  //       }
  //
  //       if (prevBinding!=next)
  //     }
  //   }

  //   flush() {
  //     // recomputing the graph is probably expensive, and most changes are just
  //     // updating expression values, so defer updates unless actually needed
  //     let recomputeGraph = false
  //
  //     for (const field of this.changes) {
  //       field.error = undefined
  //
  //       try {
  //         // scoped try-catch blocks prevent erroring on previously malformed input
  //         const prevId =
  //           field.ast.type == "binding" ? tryId(field.ast.name) : undefined
  //         const prevDeps = field.deps
  //         field.ast = field.block.expr()
  //         const nextId =
  //           field.ast.type == "binding" ? id(field.ast.name) : undefined
  //         const nextDeps = new DepTracker()
  //         deps(field.ast, nextDeps)
  //         field.ast = field.block.expr()
  //
  //         if (prevId !== nextId) {
  //           recomputeGraph = true
  //           if (prevId) {
  //             const p = this.bound[prevId]!
  //             p.splice(p.indexOf(field), 1)
  //           }
  //           if (nextId) {
  //             ;(this.bound[nextId] ??= []).push(field)
  //           }
  //         }
  //       } catch (e) {
  //         field.error = toError(e)
  //       }
  //     }
  //     this.changes = []
  //   }
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

  /**
   * If not null, the error message encountered during parsing or evaluation of
   * this field.
   */
  error: string | undefined

  /** Any fields which depend on the value of this one. */
  dependents: FieldComputed[] = []

  /** Whether the AST needs to be recomputed. */
  dirtyAst = false

  /** Whether the value needs to be recomputed. */
  dirtyValue = false

  onAfterChange(wasChangeCanceled: boolean): void {
    super.onAfterChange(wasChangeCanceled)
    if (wasChangeCanceled) return
    this.dirtyAst = true
    this.dirtyValue = true
    for (const x of this.dependents) {
      x.dirtyValue = true
    }
    this.scope.queueUpdate()
  }
}

function toError(err: unknown) {
  if (err instanceof Error) {
    return err.message
  } else {
    return String(err)
  }
}
