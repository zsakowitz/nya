import { Leaf } from "."
import type { Node } from "../../../ast/token"
import { h } from "../../jsx"
import { L, type Cursor } from "../../model"

export class CmdExclamation extends Leaf {
  static init(cursor: Cursor) {
    new CmdExclamation().insertAt(cursor, L)
  }

  constructor() {
    super("!", h("nya-cmd-op", "!"))
  }

  reader(): string {
    return " exclamation "
  }

  ascii(): string {
    return "!"
  }

  latex(): string {
    return "!"
  }

  invalidatesTransparentWrapper(): boolean {
    return true
  }

  ir(tokens: Node[]): void {
    tokens.push({ type: "punc", value: "!", kind: "suffix" })
  }
}
