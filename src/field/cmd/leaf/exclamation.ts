import type { Node } from "@/eval/ast/token"
import { L } from "@/field/dir"
import { h } from "@/jsx"
import { Leaf } from "."
import type { LatexParser } from "../../latex"
import type { Command, Cursor } from "../../model"

export class CmdExclamation extends Leaf {
  static init(cursor: Cursor) {
    new CmdExclamation().insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, _parser: LatexParser): Command {
    return new this()
  }

  constructor() {
    super("!", h("", "!"))
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

  ir(tokens: Node[]): void {
    tokens.push({ type: "punc", value: "!", kind: "suffix" })
  }
}
