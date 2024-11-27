import { Leaf } from "."
import { h, t } from "../../jsx"
import { Block, Cursor, L, R } from "../../model"
import type { Options } from "../../options"
import { CmdSupSub } from "../math/supsub"
import { CmdVar } from "./var"

export class CmdNum extends Leaf {
  static init(cursor: Cursor, input: string, options: Options) {
    const num = new CmdNum(input)
    if (options.autoSubscriptNumbers) {
      const left = cursor[L]
      if (left instanceof CmdSupSub) {
        num.insertAt(left.create("sub").cursor(R), L)
        return
      } else if (left instanceof CmdVar) {
        const sub = new Block(null)
        num.insertAt(sub.cursor(R), L)
        new CmdSupSub(sub, null).insertAt(cursor, L)
        return
      }
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
}
