import { Leaf } from "."
import type { Node } from "../../../eval/ast/token"
import { h } from "../../jsx"

export class CmdDebug extends Leaf {
  constructor(readonly data: string) {
    super("", h("inline-block px-[.4em] text-[25%] whitespace-pre", data))
  }

  latex(): string {
    return ""
  }

  reader(): string {
    return ""
  }

  ascii(): string {
    return ""
  }

  ir(tokens: Node[]): void {}
}
