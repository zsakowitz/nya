import { Leaf } from "."
import { h, t } from "../../jsx"
import { L, R, type Cursor, type Dir, type InitProps } from "../../model"
import { CmdSupSub } from "../math/supsub"
import { OpEq } from "./cmp"

export abstract class Op extends Leaf {
  /** Exits `SupSub` nodes when instructed to, following the passed `options.` */
  static exitSupSub(cursor: Cursor, { options }: InitProps) {
    if (
      options.exitSubWithOp &&
      cursor.parent?.parent instanceof CmdSupSub &&
      cursor.parent.parent.sub == cursor.parent &&
      !cursor[R]
    ) {
      cursor.moveTo(cursor.parent.parent, R)
    }
  }

  constructor(
    readonly ctrlSeq: string,
    html: string,
  ) {
    super(
      ctrlSeq,
      h("nya-cmd-op", h("px-[.2em] inline-block cursor-text", t(html))),
    )
  }

  setHtml(html: string) {
    this.setEl(
      h("nya-cmd-op", h("px-[.2em] inline-block cursor-text", t(html))),
    )
  }
}

export abstract class OpPm extends Leaf {
  static exitSupSub(cursor: Cursor, { options }: InitProps) {
    if (
      (options.exitSubWithOp &&
        cursor.parent?.parent instanceof CmdSupSub &&
        cursor.parent.parent.sub == cursor.parent &&
        !cursor[R]) ||
      (options.exitSupWithPm &&
        cursor.parent?.parent instanceof CmdSupSub &&
        cursor.parent.parent.sup == cursor.parent &&
        !cursor[R])
    ) {
      cursor.moveTo(cursor.parent.parent, R)
    }
  }

  static render(html: string) {
    return h("nya-cmd-op nya-cmd-pm", h("px-[.2em] inline-block", t(html)))
  }

  constructor(
    readonly ctrlSeq: string,
    html: string,
  ) {
    super(ctrlSeq, OpPm.render(html))
  }

  setHtml(html: string) {
    this.setEl(OpPm.render(html))
  }
}

export function op(
  latex: string,
  mathspeak: string,
  html = latex,
  ascii = html,
  endsImplicitGroup = true,
) {
  return class extends Op {
    static init(cursor: Cursor, props: InitProps) {
      this.exitSupSub(cursor, props)
      new this().insertAt(cursor, L)
    }

    constructor() {
      super(latex, html)
    }

    endsImplicitGroup(): boolean {
      return endsImplicitGroup
    }

    ascii(): string {
      return ascii
    }

    reader(): string {
      return mathspeak
    }

    latex(): string {
      return latex
    }
  }
}

export function opm(
  latex: string,
  mathspeak: string,
  html = latex,
  ascii = html,
  endsImplicitGroup = true,
) {
  return class extends OpPm {
    static init(cursor: Cursor, props: InitProps) {
      this.exitSupSub(cursor, props)
      new this().insertAt(cursor, L)
    }

    constructor() {
      super(latex, html)
    }

    endsImplicitGroup(): boolean {
      return endsImplicitGroup
    }

    ascii(): string {
      return ascii
    }

    reader(): string {
      return mathspeak
    }

    latex(): string {
      return latex
    }
  }
}

export const OpPlus = opm("+", " plus ")
export const OpMinus = opm("-", " minus ")
export const OpPlusMinus = opm("\\pm ", " plus-or-minus ", "±")
export const OpMinusPlus = opm("\\mp ", " minus-or-plus ", "∓")

export const OpCdot = op("\\cdot ", " times ", "·", "*")
export const OpDiv = op("÷", " divided by ", "÷", "/")
export class OpTo extends op("\\to ", " becomes ", "→", "->") {
  delete(cursor: Cursor, from: Dir): void {
    if (from == R) {
      const minus = new OpMinus()
      this.replaceWith(minus.lone())
      if (cursor[R] == this) {
        cursor.moveTo(minus, L)
      }
      return
    }

    super.delete(cursor, from)
  }
}
export class OpEqArrow extends op("⇒", " maps to ", "⇒", "=>") {
  delete(cursor: Cursor, from: Dir): void {
    if (from == R) {
      const minus = new OpEq(false)
      this.replaceWith(minus.lone())
      if (cursor[R] == this) {
        cursor.moveTo(minus, L)
      }
      return
    }

    super.delete(cursor, from)
  }
}
