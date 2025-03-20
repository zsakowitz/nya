import { Leaf } from "."
import type { Node } from "@/eval/ast/token"
import { h } from "@/jsx"
import { Block, L, R } from "../../model"

/**
 * Created when a LaTeX string terminates too early (e.g. before closing a
 * `{...` group, a `\sqrt[...` root, or a `\begin{...}` environment), to alert
 * the user to their error instead of silently failing.
 */
export class CmdEOF extends Leaf {
  static block(expected: string) {
    const block = new Block(null)
    new this(expected).insertAt(block.cursor(R), L)
    return block
  }

  constructor(readonly expected: string) {
    super(
      "\\error ",
      h(
        "px-[.1em]",
        h("text-[--nya-latex-error] border border-current px-1", "EOF"),
      ),
    )
  }

  reader(): string {
    return " unexpected end of latex source "
  }

  latex(): string {
    return ""
  }

  ascii(): string {
    return ""
  }

  ir(_tokens: Node[]): true | void {}
}
