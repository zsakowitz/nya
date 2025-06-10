import { issue } from "@/eval/ops/issue"
import type { Node, OpKind } from "@/eval2/node"
import { ScriptBlock, ScriptDecls, ScriptDeps } from "@/eval2/tx"
import type { IdGlobal } from "../emit/id"
import type { ScriptEnvironment } from "./loader"

export const enum Kind {
  Skip,
  Expr,
  Var,
  Fn,
}

export class ScriptGroup {
  constructor(readonly env: ScriptEnvironment) {}

  readonly items = new Set<Item>()
}

export class Item {
  // Pre-evaluation state should not be changed by externals, but TypeScript
  // does not have a privacy setting which acts like `readonly` externally and
  // `mut` internally. These properties should always be updated in a unified
  // batch.
  public kind: Kind = Kind.Skip
  public source: string | null = null
  public deps = new ScriptDeps()
  public name: IdGlobal | null = null
  public error: unknown | null = null

  constructor(readonly group: ScriptGroup) {
    group.items.add(this)
  }

  remove() {
    this.group.items.delete(this)
  }

  private setBinding(binding: OpKind["binding"], value: Node) {}

  private setPlain(value: Node) {
    try {
      const deps = new ScriptDeps()
      deps.check(value)

      const decls = new ScriptDecls()
      const block = new ScriptBlock(decls)
      const expr = block.eval(value)
    } catch (e) {
      this.kind = Kind.Expr
      this.error = e ?? new Error("<null error>")
    }
  }

  set(node: Node, possiblyBinding: boolean) {
    if (node.data.type == "list" && !node.args?.length) {
      this.kind = Kind.Skip
      this.source = null
      this.deps = new ScriptDeps()
      this.name = null
      this.error = null
    } else if (node.data.type == "binding") {
      if (possiblyBinding) {
        this.setBinding(node.data.data, node.args![0]!)
      } else {
        issue(`Use a plain expression here.`)
      }
    } else {
      this.setPlain(node)
    }
  }
}
