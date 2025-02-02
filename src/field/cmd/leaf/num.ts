import { Leaf } from "."
import type { Node } from "../../../eval/ast/token"
import { h } from "../../../jsx"
import type { LatexParser } from "../../latex"
import {
  Block,
  Cursor,
  L,
  R,
  type Command,
  type Dir,
  type InitProps,
} from "../../model"
import { CmdSupSub } from "../math/supsub"
import { CmdDot } from "./dot"

export class CmdNum extends Leaf {
  static init(cursor: Cursor, { input, options }: InitProps) {
    const num = new CmdNum(input)
    const left = cursor[L]

    if (
      left &&
      options.subscriptNumberAfter &&
      options.subscriptNumberAfter(left)
    ) {
      if (left instanceof CmdSupSub) {
        num.insertAt(left.create("sub").cursor(R), L)
      } else if (cursor[R] instanceof CmdSupSub) {
        num.insertAt(cursor[R].create("sub").cursor(L), L)
        cursor.moveTo(cursor[R], R)
      } else {
        const sub = new Block(null)
        num.insertAt(sub.cursor(R), L)
        new CmdSupSub(sub, null).insertAt(cursor, L)
      }
      return
    }

    num.insertAt(cursor, L)
  }

  static fromLatex(cmd: string, parser: LatexParser): Command {
    if (cmd == "\\digit") {
      return new this(parser.text())
    }
    return new this(cmd)
  }

  constructor(readonly text: string) {
    super(text, h("", text))
  }

  ascii(): string {
    return this.text
  }

  latex(): string {
    if ("0" <= this.text && this.text <= "9") {
      return this.text
    } else {
      return `\\digit{${this.text}}`
    }
  }

  reader(): string {
    return this.text
  }

  moveAcrossWord(cursor: Cursor, dir: Dir): void {
    cursor.moveTo(this, dir)
    while (
      cursor[dir] instanceof CmdNum ||
      (cursor[dir] instanceof CmdDot && !(cursor[dir][dir] instanceof CmdDot))
    ) {
      cursor.moveTo(cursor[dir], dir)
    }
  }

  ir(tokens: Node[]): void {
    const last = tokens[tokens.length - 1]
    if (last && last.type == "num") {
      tokens.pop()
      tokens.push({ type: "num", value: last.value + this.text })
    } else {
      tokens.push({ type: "num", value: this.text })
    }
  }
}
