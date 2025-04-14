import type { Node } from "@/eval/ast/token"
import { L } from "@/field/dir"
import { h } from "@/jsx"
import { Leaf } from "."
import type { LatexParser } from "../../latex"
import type { Command, Cursor } from "../../model"

export class CmdColon extends Leaf {
  static init(cursor: Cursor) {
    new CmdColon().insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, _parser: LatexParser): Command {
    return new this()
  }

  constructor() {
    super(":", h("nya-cmd-colon nya-cmd-op pr-[.2em]", ":"))
  }

  reader(): string {
    return " colon "
  }

  ascii(): string {
    return ":"
  }

  latex(): string {
    return ":"
  }

  ir(tokens: Node[]): void {
    tokens.push({ type: "punc", kind: "infix", value: ":" })
  }

  endsImplicitGroup(): boolean {
    return true
  }
}
