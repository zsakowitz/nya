import { type LatexParser, toText } from "@/field/latex"
import type { Command, IRBuilder } from "@/field/model"
import { h } from "@/jsx"
import { Leaf } from "."

export class CmdTextInert extends Leaf {
  static fromLatex(_cmd: string, parser: LatexParser): Command {
    return new this(parser.text())
  }

  constructor(readonly value: string) {
    super("\\text", h("", "“", h("font-['Times_New_Roman']", value), "”"))
  }

  reader(): string {
    return " Text " + this.value + " EndText "
  }

  ascii(): string {
    return "text(" + this.value + ")"
  }

  latex(): string {
    return "\\text{" + toText(this.value) + "}"
  }

  ir2(ret: IRBuilder): void {
    // TODO: allow latex
    ret.leaf({ type: "text", data: this.value })
  }
}
