// @ts-nocheck FIXME: delete file

import type { Node } from "@/eval2/node"
import {
  listItems,
  nameIdent,
  ScriptBlock,
  ScriptDecls,
  ScriptDeps,
  type NameIdent,
  type ReadonlyScriptDeps,
} from "@/eval2/tx"
import { issue } from "../emit/error"
import type { ScriptEnvironment } from "./loader"

export const enum Kind {
  /** An empty item. */
  Skip,

  /** A plain expression. */
  Expr,

  /**
   * A variable declaration. A user might type `a=3` to get this, and it would
   * be represented as { source: "3" }.
   */
  Var,

  /**
   * A function declaration. A user might type `a(b)=b^2` to get this, and it
   * would be represented as { source: "_u_12^2", args: ["_u_12"] }.
   */
  Fn,
}

export class ScriptGroup {
  constructor(readonly env: ScriptEnvironment) {}

  readonly items = new Set<Item>()
}

interface State {
  readonly args: NameIdent[]
  readonly deps: ReadonlyScriptDeps
  readonly error: unknown | null
  readonly kind: Kind
  readonly name: NameIdent | null
  readonly source: string | null
}

const STATE_EMPTY: State = {
  args: [],
  deps: new ScriptDeps(),
  error: null,
  kind: Kind.Skip,
  name: null,
  source: null,
}

export class Item {
  state: State = STATE_EMPTY

  constructor(readonly group: ScriptGroup) {
    group.items.add(this)
  }

  remove() {
    this.group.items.delete(this)
  }

  private setError(
    kind: Kind,
    name: NameIdent | null,
    args: NameIdent[],
    error: unknown,
  ) {
    this.state = {
      args,
      deps: new ScriptDeps(),
      error: error ?? new Error("<null error>"),
      kind,
      name,
      source: null,
    }
  }

  private setPlain(value: Node) {
    try {
      const deps = new ScriptDeps()
      deps.check(value)

      const decls = new ScriptDecls()
      const block = new ScriptBlock(decls)
      const expr = block.eval(value)

      this.state = {
        args: [],
        deps,
        error: null,
        kind: Kind.Expr,
        name: null,
        source: expr,
      }
    } catch (e) {
      this.setError(Kind.Expr, null, [], e)
    }
  }

  private setBindingVar(name: NameIdent, value: Node) {
    try {
    } catch (e) {
      this.setError(Kind.Var, name, [], e)
    }
  }

  private setBindingFn(name: NameIdent, args: NameIdent[], value: Node) {
    try {
    } catch (e) {
      this.setError(Kind.Fn, name, args, e)
    }
  }

  /** Sets what this script item evaluates to. */
  set(node: Node, allowBinding: boolean) {
    // Empty expression
    if (node.data.type == "list" && !node.args?.length) {
      this.state = STATE_EMPTY
      return
    }

    // Plain expression
    if (node.data.type != "binding") {
      this.setPlain(node)
      return
    }

    // Binding, but it's not allowed
    if (!allowBinding) {
      this.setError(
        Kind.Expr,
        null,
        [],
        new Error("Use a plain expression here."),
      )
      return
    }

    const { name, args } = node.data.data

    // Get the name of the binding; fail early if invalid subscript
    let ident
    try {
      ident = nameIdent(name)
    } catch (e) {
      this.setError(Kind.Expr, null, [], e)
      return
    }

    const contents = node.args![0]!

    // Plain variable
    if (!args) {
      this.setBindingVar(ident, contents)
      return
    }

    // Function definition
    let idents
    try {
      idents = listItems(args).map((arg) =>
        arg.data.type != "uvar" ?
          issue(`Function parameters must be variable names.`)
        : nameIdent(arg.data.data),
      )
    } catch (e) {
      this.setError(
        Kind.Fn,
        ident,
        listItems(args).map((_, i) => nameIdent({ name: "" + i, sub: null })),
        e,
      )
      return
    }
    this.setBindingFn(ident, idents, contents)
  }
}
