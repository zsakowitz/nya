import { Leaf } from "."
import { h, t } from "../../jsx"
import { L, type Cursor } from "../../model"

export abstract class Op extends Leaf {
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

export function opm(
  latex: string,
  mathspeak: string,
  html = latex,
  ascii = html,
  endsImplicitGroup = true,
) {
  return class extends OpPm {
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

export const OpPlus = opm("+", " plus ")
export const OpMinus = opm("-", " minus ")
export const OpPlusMinus = opm("\\pm ", " plus-or-minus ", "±")
export const OpMinusPlus = opm("\\mp ", " minus-or-plus ", "∓")

export const OpCdot = op("\\cdot ", " times ", "·", "*")
export const OpDiv = op("÷", " divided by ", "÷", "/")
