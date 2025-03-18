import { Leaf } from "."
import type { Node, Punc, PuncInfix, PuncPm } from "../../../eval/ast/token"
import { h } from "../../../jsx"
import type { LatexParser } from "../../latex"
import {
  L,
  R,
  Span,
  type Command,
  type Cursor,
  type Dir,
  type InitProps,
} from "../../model"
import { CmdSupSub } from "../math/supsub"
import { OpEq } from "./cmp"

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

abstract class OpPm extends Op {
  static exitSupSub(cursor: Cursor, { options }: InitProps) {
    if (
      (options.exitSubWithOp &&
        cursor.parent?.parent instanceof CmdSupSub &&
        cursor.parent.parent.sub == cursor.parent &&
        !cursor[R] &&
        cursor[L]) ||
      (options.exitSupWithPm &&
        cursor.parent?.parent instanceof CmdSupSub &&
        cursor.parent.parent.sup == cursor.parent &&
        !cursor[R] &&
        cursor[L])
    ) {
      cursor.moveTo(cursor.parent.parent, R)
    }
  }

  static render(html: string) {
    return h("nya-cmd-op nya-cmd-pm", h("px-[.2em] inline-block", html))
  }

  constructor(
    readonly ctrlSeq: string,
    html: string,
  ) {
    super(ctrlSeq, html, OpPm.render(html))
  }

  setHtml(html: string) {
    this.setEl(OpPm.render(html))
  }
}

function op(
  punc: (self: Op) => Punc,
  latex: string,
  mathspeak: string,
  html = latex,
  ascii = html,
  endsImplicitGroup = true,
) {
  return class extends Op {
    static fromLatex(_cmd: string, _parser: LatexParser): Command {
      return new this()
    }

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

    ir(tokens: Node[]): void {
      tokens.push(punc(this))
    }
  }
}

function opp(
  latex: Exclude<PuncInfix, ".">,
  mathspeak: string,
  html?: string,
  ascii?: string,
  endsImplicitGroup?: boolean,
) {
  return op(
    (self) => ({
      type: "punc",
      kind: "infix",
      value: latex,
      span: new Span(self.parent, self[L], self[R]),
    }),
    latex,
    mathspeak,
    html,
    ascii,
    endsImplicitGroup,
  )
}

function opm(
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

    static fromLatex(_cmd: string, _parser: LatexParser): Command {
      return new this()
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

    ir(tokens: Node[]): void {
      tokens.push({
        type: "punc",
        kind: "pm",
        value: latex,
        span: new Span(this.parent, this[L], this[R]),
      })
    }
  }
}

export const OpPlus = opm("+", " plus ")
export const OpMinus = opm("-", " minus ")
export const OpPlusMinus = opm("\\pm ", " plus-or-minus ", "±")
export const OpMinusPlus = opm("\\mp ", " minus-or-plus ", "∓")

export const OpCdot = opp("\\cdot ", " times ", "·", "*")
export const OpTimes = opp("\\times ", " cross ", "×", "*")
export const OpOdot = opp("\\odot ", " encircled dot ", "⊙", "⊙")
export const OpOtimes = opp("\\otimes ", " encircled cross ", "⊗", "⊗")

export const OpDiv = opp("÷", " divided by ", "÷", "/")

export const OpAnd = opp("\\and ", " and ", "∧", "∧", true)
export const OpOr = opp("\\or ", " or ", "⋁", "⋁", true)

export const OpUpArrow = opp("\\uparrow ", " up arrow ", "↑", "↑")

export class OpNeg extends Leaf {
  static init(cursor: Cursor, _props: InitProps) {
    new OpNeg().insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, _parser: LatexParser): Command {
    return new this()
  }

  static render(html: string) {
    return h(
      "nya-cmd-op nya-cmd-pm nya-cmd-not",
      h("px-[.2em] inline-block", html),
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

  ir(tokens: Node[]): void {
    tokens.push({ type: "punc", kind: "prefix", value: "\\neg " })
  }

  endsImplicitGroup(): boolean {
    return true
  }
}

export class OpRightArrow extends opp("\\to ", " becomes ", "→", "->", true) {
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
export class OpDoubleRightArrow extends opp(
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
