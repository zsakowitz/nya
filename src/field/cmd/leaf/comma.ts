import type { Node } from "@/eval/ast/token"
import { infx } from "@/eval2/node"
import { Precedence } from "@/eval2/prec"
import { L } from "@/field/dir"
import { h } from "@/jsx"
import { Leaf } from "."
import type { LatexParser } from "../../latex"
import type { Command, Cursor, IRBuilder } from "../../model"

export class CmdComma extends Leaf {
  static init(cursor: Cursor) {
    if (cursor.parent?.parent?.insComma?.(cursor, cursor.parent)) {
      return
    }

    new CmdComma().insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, _parser: LatexParser): Command {
    return new this()
  }

  constructor() {
    super(",", h("nya-cmd-op nya-cmd-comma pr-[.2em]", ","))
  }

  reader(): string {
    return " comma "
  }

  ascii(): string {
    return ","
  }

  latex(): string {
    return ","
  }

  invalidatesTransparentWrapper(): boolean {
    return true
  }

  ir(tokens: Node[]): void {
    const last = tokens[tokens.length - 1]
    if (last?.type == "punc" && (last.value == ".." || last.value == "...")) {
      tokens.push({ type: "void" })
    }
    tokens.push({ type: "punc", kind: "infix", value: "," })
  }

  ir2(ret: IRBuilder): void {
    ret.push(
      infx(
        { type: "list", data: null },
        Precedence.CommaL,
        Precedence.CommaR,
        Precedence.CommaR0,
      ),
    )
  }

  endsImplicitGroup(): boolean {
    return true
  }
}
