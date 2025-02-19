import { Leaf } from "."
import type { Node } from "../../../eval/ast/token"
import { h } from "../../../jsx"
import type { LatexParser } from "../../latex"
import { L, type Command, type Cursor, type Dir } from "../../model"
import { CmdVar } from "./var"

export class CmdColon extends Leaf {
  static init(cursor: Cursor) {
    new CmdColon().insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, _parser: LatexParser): Command {
    return new this()
  }

  constructor() {
    super(":", h("nya-cmd-colon pr-[.2em]", ":"))
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
    const last = tokens[tokens.length - 1]
    if (last?.type == "var") {
      if (last.sup) {
        throw new Error("A field name cannot have a superscript.")
      }
      tokens.pop()
      tokens.push({ type: "field", value: last.value, sub: last.sub })
    } else {
      throw new Error("Try putting a variable name before ':'.")
    }
  }

  moveAcrossWord(cursor: Cursor, dir: Dir): void {
    cursor.moveTo(this, dir)
    if (dir == L && cursor[L] instanceof CmdVar) {
      cursor[L].moveAcrossWord(cursor, L)
    }
  }
}
