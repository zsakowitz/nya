import { Leaf } from "."
import type { Node } from "../../../eval/ast/token"
import { h } from "../../../jsx"
import type { LatexParser } from "../../latex"
import { L, type Command, type Cursor } from "../../model"

export class CmdExclamation extends Leaf {
  static init(cursor: Cursor) {
    new CmdExclamation().insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, _parser: LatexParser): Command {
    return new this()
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
