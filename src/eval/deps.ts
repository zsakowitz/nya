import type { Node } from "./ast/token"
import { TXR_AST } from "./ast/tx"
import { id, type Bound } from "./lib/binding"

export class Deps {
  readonly ids: Record<string, true> = Object.create(null)
  private readonly bound: Record<string, true | undefined> = Object.create(null)

  private trackByLabel(name: string) {
    if (this.bound[name]) return
    this.ids[name] = true
  }

  track(ast: Bound) {
    const myId = id(ast)
    this.trackByLabel(myId)
  }

  withBound<T>(ast: Bound, f: () => T): T {
    const myId = id(ast)
    const prev = this.bound[myId]
    try {
      this.bound[myId] = true
      return f()
    } finally {
      this.bound[myId] = prev
    }
  }

  withBoundIds<T>(ids: string[], f: () => T): T {
    const prev: typeof this.bound = Object.create(null)
    try {
      for (const key of ids) {
        if (!(key in prev)) {
          prev[key] = this.bound[key]
          this.bound[key] = true
        }
      }
      return f()
    } finally {
      for (const key in prev) {
        this.bound[key] = prev[key]
      }
    }
  }

  add(node: Node) {
    TXR_AST[node.type]?.deps(node as never, this)
  }

  isBound(id: string) {
    return !!this.bound[id]
  }
}
