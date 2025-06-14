import type { PuncInfix, PuncPm } from "@/eval/ast/token"
import { infx, pifx, type IR } from "@/eval2/node"
import { Precedence as P } from "@/eval2/prec"
import { L, R } from "@/field/dir"
import { h } from "@/jsx"
import { Leaf } from "."
import type { LatexParser } from "../../latex"
import {
  type Command,
  type Cursor,
  type InitProps,
  type IRBuilder,
} from "../../model"
import { CmdSupSub } from "../math/supsub"
import { Op } from "./op-core"

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
  ir2: IR,
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

    ir2(ret: IRBuilder): void {
      ret.push(ir2)
    }
  }
}

export function opp(
  latex: Exclude<PuncInfix, ".">,
  pl: P,
  pr: P,
  mathspeak: string,
  html?: string,
  ascii?: string,
  endsImplicitGroup?: boolean,
) {
  return op(
    infx({ type: "op", data: latex }, pl, pr),
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

    ir2(ret: IRBuilder): void {
      ret.push(pifx({ type: "op", data: latex }, P.SumL, P.SumR, P.Negation))
    }
  }
}

export const OpPlus = opm("+", " plus ")
export const OpMinus = opm("-", " minus ")
export const OpPlusMinus = opm("\\pm ", " plus-or-minus ", "±")
export const OpMinusPlus = opm("\\mp ", " minus-or-plus ", "∓")

export const OpCdot = class extends Op {
  static fromLatex(_cmd: string, _parser: LatexParser): Command {
    return new this()
  }

  static init(cursor: Cursor, props: InitProps) {
    this.exitSupSub(cursor, props)
    new this().insertAt(cursor, L)
  }

  constructor() {
    super("\\cdot ", "·", h("nya-cmd-op", h("px-[.25em] inline-block", "·")))
  }

  endsImplicitGroup(): boolean {
    return false
  }

  ascii(): string {
    return "*"
  }

  reader(): string {
    return " Dot "
  }

  latex(): string {
    return "\\cdot "
  }

  ir2(ret: IRBuilder): void {
    ret.infx({ type: "op", data: "\\cdot " }, P.ProdL, P.ProdR)
  }
}
export const OpTimes = opp("\\times ", P.ProdL, P.ProdR, " cross ", "×", "*")
export const OpOdot = opp(
  "\\odot ",
  P.ProdL,
  P.ProdR,
  " encircled dot ",
  "⊙",
  "⊙",
)
export const OpOtimes = opp(
  "\\otimes ",
  P.ProdL,
  P.ProdR,
  " encircled cross ",
  "⊗",
  "⊗",
)

export const OpDiv = opp("÷", P.ProdL, P.ProdR, " divided by ", "÷", "/")

export const OpAnd = opp(
  "\\and ",
  P.BoolAndL,
  P.BoolAndR,
  " and ",
  "∧",
  "∧",
  true,
)
export const OpOr = opp("\\or ", P.BoolOrL, P.BoolOrR, " or ", "⋁", "⋁", true)

export const OpUpArrow = opp(
  "\\uparrow ",
  P.ExponentL,
  P.ExponentR,
  " up arrow ",
  "↑",
  "↑",
)

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

  ir2(ret: IRBuilder): void {
    ret.prfx({ type: "op", data: "\\neg" }, P.BoolNot)
  }

  endsImplicitGroup(): boolean {
    return true
  }
}
