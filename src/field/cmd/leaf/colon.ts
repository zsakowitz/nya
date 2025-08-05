import { Precedence } from "@/eval/prec"
import { L } from "@/field/dir"
import { h } from "@/lib/jsx"
import { Leaf } from "."
import type { LatexParser } from "../../latex"
import type { Command, Cursor, IRBuilder } from "../../model"

export class CmdColon extends Leaf {
  static init(cursor: Cursor) {
    new CmdColon().insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, _parser: LatexParser): Command {
    return new this()
  }

  constructor() {
    super(":", h("nya-cmd-colon pr-[.2em]", h("inline-block", ":")))
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

  endsImplicitGroup(): boolean {
    return true
  }

  ir2(ret: IRBuilder): void {
    ret.infx({ type: "op", data: ":" }, Precedence.ColonL, Precedence.ColonR)
  }
}
