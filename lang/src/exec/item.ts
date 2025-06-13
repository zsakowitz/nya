import type { Node } from "@/eval2/node"
import {
  nameIdent,
  ScriptBlock,
  ScriptDeps,
  type NameIdent,
  type ReadonlyScriptDeps,
} from "@/eval2/tx"
import { IdMap } from "../emit/decl"
import { bug, issue, issueError } from "../emit/error"
import { err, Kind, ok, SKIP, type Executable, type State } from "./state"
import type { UnitKind } from "#/list/unit/util/kind"

export class EntrySet {
  readonly entries = new Set<Entry>()
  readonly defs = new Map<NameIdent, Entry[]>()
  // TODO: add dependency order optimization

  /**
   * If `true`, updates have been queued, and nothing in the `EntrySet` should
   * be executed.
   */
  private limbo = false
  // @ts-expect-error
  private limboChangedDefs = false
  /** A timestamp which increases each time an update is performed. */
  ts = 0

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
    this.ts++
    // @ts-expect-error
    this.entries.forEach((x) => x._checkExe())
  }

  global(name: NameIdent): Node | null {
    const defs = this.defs.get(name)
    if (defs?.length == 1) {
      const d = defs[0]!
      if (d.state.error) {
        switch (d.state.type) {
          case Kind.Expr:
            throw d.state.data
          case Kind.Var:
            throw d.state.data.of
        }
      }
      switch (d.state.type) {
        case Kind.Skip:
        case Kind.Expr:
          bug(`A plain expression was used as a global variable.`)
        case Kind.Var:
          if (d.state.data.args) {
            issue(`'${name}' is a function. Try using parentheses.`)
          }
          return d.state.data.of
      }
    } else if (!defs?.length) {
      return null
    } else {
      issue(`Variable '${name}' is defined in multiple places.`)
    }
  }

  globalOrFn(name: NameIdent): { args: NameIdent[] | null; of: Node } | null {
    const defs = this.defs.get(name)
    if (defs?.length == 1) {
      const d = defs[0]!
      if (d.state.error) {
        switch (d.state.type) {
          case Kind.Expr:
            throw d.state.data
          case Kind.Var:
            throw d.state.data.of
        }
      }
      switch (d.state.type) {
        case Kind.Skip:
        case Kind.Expr:
          bug(`A plain expression was used as a global variable.`)
        case Kind.Var:
          return d.state.data
      }
    } else if (!defs?.length) {
      return null
    } else {
      issue(`Variable '${name}' is defined in multiple places.`)
    }
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

  get exe() {
    return this._exe
  }

  get deps() {
    return this._deps
  }

  get state() {
    return this._state
  }

  set state(v) {
    const current = this._state
    if (current == v) return

    const skipChangingDef =
      current.type == Kind.Var ?
        v.type == Kind.Var && current.data.name == v.data.name
      : v.type != Kind.Var

    if (!skipChangingDef) {
      this._unsetDef()
    }
    this._state = v
    if (!skipChangingDef) {
      this._resetDef()
    }
  }

  hasError() {
    return this.state.error
  }

  get error() {
    if (this.state.error) {
      return this.state.type == Kind.Var ? this.state.data.of : this.state.data
    }
  }

  get errorMessage() {
    const err = this.error
    return err instanceof Error ? err.message : String(err)
  }

  private _unsetDef() {
    if (this._state.type == Kind.Var) {
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
    if (this._state.type == Kind.Var) {
      const defs = this.set.defs.get(this._state.data.name)
      if (!defs) {
        this.set.defs.set(this._state.data.name, [this])
        // @ts-expect-error
        this.set.limboChangedDefs = true
        return
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
      s.type == Kind.Expr ? { args: null, expr: block.eval(s.data) }
      : s.type == Kind.Var ? { args: s.data.args, expr: block.eval(s.data.of) }
      : null
  }

  setTo(node: Node, allowBinding: boolean) {
    if (node.data.type == "list" && !node.args?.length) {
      this.state = SKIP
    }

    if (node.data.type != "binding") {
      this.state = ok(Kind.Expr, node)
      return
    }

    if (!allowBinding) {
      this.state = err(Kind.Expr, issueError(`Try using a plain expression.`))
      return
    }

    const data = node.data.data
    const args = data.args
    this.state = ok(Kind.Var, {
      name: nameIdent(data.name),
      args: args == null ? null : args.map(nameIdent),
      of: node.args![0]!,
    })
  }

  setToError(reason: unknown) {
    this.state = err(Kind.Expr, reason)
  }
}
