import { Leaf } from "."
import type { Punc, PuncBinary, PuncPm, Token } from "../../../ast/token"
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
  punc: () => Punc,
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

    ir(tokens: Token[]): void {
      tokens.push({ type: "punc", value: punc() })
    }
  }
}

export function opp(
  latex: PuncBinary,
  mathspeak: string,
  html?: string,
  ascii?: string,
  endsImplicitGroup?: boolean,
) {
  return op(
    () => ({ type: "infix", kind: latex }),
    latex,
    mathspeak,
    html,
    ascii,
    endsImplicitGroup,
  )
}

export function opm(
  latex: PuncPm,
  mathspeak: string,
  html: string = latex,
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

    ir(tokens: Token[]): void {
      tokens.push({ type: "punc", value: { type: "pm", kind: latex } })
    }
  }
}

export const OpPlus = opm("+", " plus ")
export const OpMinus = opm("-", " minus ")
export const OpPlusMinus = opm("\\pm ", " plus-or-minus ", "±")
export const OpMinusPlus = opm("\\mp ", " minus-or-plus ", "∓")

export const OpCdot = opp("\\cdot ", " times ", "·", "*")
export const OpDiv = opp("÷", " divided by ", "÷", "/")

export const OpAnd = opp("\\and ", " and ", "∧", "∧", true)
export const OpOr = opp("\\or ", " or ", "⋁", "⋁", true)

export class OpNeg extends Leaf {
  static init(cursor: Cursor, props: InitProps) {
    new OpNeg().insertAt(cursor, L)
  }

  static render(html: string) {
    return h(
      "nya-cmd-op nya-cmd-pm nya-cmd-not",
      h("px-[.2em] inline-block", t(html)),
    )
  }

  constructor() {
    super("\\neg ", OpNeg.render("¬"))
  }

  setHtml(html: string) {
    this.setEl(OpNeg.render(html))
  }

  reader(): string {
    return " not "
  }

  ascii(): string {
    return " not "
  }

  latex(): string {
    return "\\neg "
  }

  ir(tokens: Token[]): void {
    tokens.push({ type: "punc", value: { type: "prefix", kind: "\\neg " } })
  }

  endsImplicitGroup(): boolean {
    return true
  }
}

export class OpTo extends opp("\\to ", " becomes ", "→", "->", true) {
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
export class OpRightarrow extends opp(
  "\\Rightarrow ",
  " maps to ",
  "⇒",
  "=>",
  true,
) {
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
