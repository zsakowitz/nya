import { Leaf } from "."
import type { Node } from "../../../eval/ast/token"
import { h } from "../../../jsx"
import type { LatexParser } from "../../latex"
import {
  L,
  type Command,
  type Cursor,
  type InitProps,
  type InitRet,
} from "../../model"

export function sym(
  latex: string,
  reader: string,
  text: string,
  ascii: string,
) {
  const clsx =
    text == "∞" ?
      "[line-height:1] relative top-[-.05em]"
    : "font-['Times_New_Roman'] [line-height:.9]"

  return class extends Leaf {
    static init(cursor: Cursor, _props: InitProps): InitRet {
      new this().insertAt(cursor, L)
    }

    static fromLatex(_cmd: string, _parser: LatexParser): Command {
      return new this()
    }

    constructor() {
      super(latex, h("", h(clsx, text)))
    }

    ascii(): string {
      return ascii
    }

    reader(): string {
      return reader
    }

    latex(): string {
      return latex
    }

    ir(tokens: Node[]): void {
      tokens.push({ type: "var", kind: "var", value: text })
    }

    get autoCmd() {
      return ascii
    }
  }
}

export const SymPi = sym("\\pi ", " pi ", "π", "pi")
export const SymTau = sym("\\tau ", " tau ", "τ", "tau")
export const SymInfinity = sym("\\infinity ", " infinity ", "∞", "infinity")
