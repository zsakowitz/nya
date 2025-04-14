import { type Cursor, type InitProps } from "@/field/model"
import { L, R } from "@/field/sides"
import { h } from "@/jsx"
import { Leaf } from "."
import { CmdSupSub } from "../math/supsub"

export abstract class Op extends Leaf {
  /** Exits `SupSub` nodes when instructed to, following the passed `options.` */
  static exitSupSub(cursor: Cursor, { options }: InitProps) {
    if (
      options.exitSubWithOp &&
      cursor.parent?.parent instanceof CmdSupSub &&
      cursor.parent.parent.sub == cursor.parent &&
      !cursor[R] &&
      cursor[L]
    ) {
      cursor.moveTo(cursor.parent.parent, R)
    }
  }

  static render(html: string) {
    return h("nya-cmd-op", h("px-[.2em] inline-block", html))
  }

  constructor(
    readonly ctrlSeq: string,
    html: string,
    el = Op.render(html),
  ) {
    super(ctrlSeq, el)
  }

  setHtml(html: string) {
    this.setEl(Op.render(html))
  }
}
