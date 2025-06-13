import type { Node } from "@/eval2/node"
import {
  ScriptBlock,
  ScriptDeps,
  type NameIdent,
  type ReadonlyScriptDeps,
} from "@/eval2/tx"
import { IdMap } from "../emit/decl"
import { Kind, SKIP, type Executable, type State } from "./state"

export class EntrySet {
  readonly entries = new Set<Entry>()
  readonly defs = new Map<NameIdent, Entry[]>()
  // TODO: add dependency optimization

  /**
   * If `true`, updates have been queued, and nothing in the `EntrySet` should
   * be executed.
   */
  private limbo = false
  private limboChangedDefs = false

  async update() {
    if (this.limbo) return Promise.resolve()
    const p = Promise.resolve().then(() => {
      if (this.limbo) {
        this.limbo = false
        this.performUpdate()
      }
    })
    this.limbo = true
    return p
  }

  queueUpdate() {
    if (this.limbo) return
    queueMicrotask(() => {
      if (this.limbo) {
        this.limbo = false
        this.performUpdate()
      }
    })
    this.limbo = true
  }

  private performUpdate() {
    // @ts-expect-error
    this.entries.forEach((x) => x._checkExe())
  }

  global(name: NameIdent): Node | null {
    return null
  }

  globalOrFn(
    name: NameIdent,
  ): { args: NameIdent[] | null; value: Node } | null {
    return null
  }
}

export class Entry {
  constructor(private readonly set: EntrySet) {
    set.entries.add(this)
  }

  remove() {
    this.set.entries.delete(this)
  }

  private _state: State = SKIP
  private _deps: ReadonlyScriptDeps = new ScriptDeps()
  private _exe: Executable | null = null

  get deps() {
    return this._deps
  }

  get state() {
    return this._state
  }

  set state(v) {
    const current = this._state
    if (current == v) return

    const hasSameNameAndBindingKind =
      current.type == Kind.Var ||
      (current.type == Kind.Fn &&
        v.type == current.type &&
        current.data.name == v.data.name)

    if (!hasSameNameAndBindingKind) {
      this._unsetDef()
    }
    this._state = v
    if (!hasSameNameAndBindingKind) {
      this._resetDef()
    }
  }

  private _unsetDef() {
    switch (this._state.type) {
      case Kind.Var:
      case Kind.Fn:
        const defs = this.set.defs.get(this._state.data.name)!
        const idx = defs.indexOf(this)
        if (idx != -1) {
          defs.splice(idx, 1)
          // @ts-expect-error
          this.set.limboChangedDefs = true
        }
    }
  }

  private _resetDef() {
    switch (this._state.type) {
      case Kind.Var:
      case Kind.Fn:
        const defs = this.set.defs.get(this._state.data.name)
        if (!defs) {
          this.set.defs.set(this._state.data.name, [this])
          // @ts-expect-error
          this.set.limboChangedDefs = true
          break
        }
        const idx = defs.indexOf(this)
        if (idx == -1) {
          defs.push(this)
          // @ts-expect-error
          this.set.limboChangedDefs = true
        }
    }
  }

  private _checkExe() {
    this._exe = null
    const s = this._state
    if (s.error) return

    const block = new ScriptBlock(this.set, new IdMap(null), new IdMap(null))

    this._exe =
      s.type == Kind.Expr ? { args: [], expr: block.eval(s.data) }
      : s.type == Kind.Var ? { args: [], expr: block.eval(s.data.of) }
      : s.type == Kind.Fn ? { args: s.data.args, expr: block.eval(s.data.of) }
      : null
  }
}
