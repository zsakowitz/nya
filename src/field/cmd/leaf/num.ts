import { Leaf } from "."
import { h, t } from "../../jsx"
import { Block, Cursor, L, R, type Dir, type InitProps } from "../../model"
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
      } else {
        const sub = new Block(null)
        num.insertAt(sub.cursor(R), L)
        new CmdSupSub(sub, null).insertAt(cursor, L)
      }
      return
    }

    num.insertAt(cursor, L)
  }

  constructor(readonly text: string) {
    super(text, h("", t(text)))
  }

  ascii(): string {
    return this.text
  }

  latex(): string {
    return this.text
  }

  reader(): string {
    return this.text
  }

  moveAcrossWord(cursor: Cursor, dir: Dir): void {
    cursor.moveTo(this, dir)
    while (cursor[dir] instanceof CmdNum || cursor[dir] instanceof CmdDot) {
      cursor.moveTo(cursor[dir], dir)
    }
  }
}
