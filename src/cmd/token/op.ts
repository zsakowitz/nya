import { Token } from "."
import { h, t } from "../../jsx"
import { L, type Cursor } from "../../model"

export abstract class Op extends Token {
  constructor(
    readonly ctrlSeq: string,
    readonly html: string,
  ) {
    super(ctrlSeq, h("px-[.2em] inline-block cursor-text", t(html)))
  }
}

export function op(
  latex: string,
  mathspeak: string,
  html = latex,
  ascii = html,
  endsImplicitGroup = false,
) {
  return class extends Op {
    static init(cursor: Cursor) {
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

export function eop(
  latex: string,
  mathspeak: string,
  html = latex,
  ascii = html,
) {
  return op(latex, mathspeak, html, ascii, true)
}

export const OpPlus = eop("+", " plus ")
export const OpMinus = eop("-", " minus ")
export const OpPm = eop("\\pm ", " plus-or-minus ", "±")
export const OpMp = eop("\\mp ", " minus-or-plus ", "∓")

export const OpCdot = eop("\\cdot ", " times ", "·", "*")
