import type { Node } from "@/eval/ast/token"
import { L, R } from "@/field/dir"
import { h } from "@/jsx"
import { Leaf } from "."
import type { LatexParser } from "../../latex"
import {
  Span,
  type Command,
  type Cursor,
  type InitProps,
  type InitRet,
} from "../../model"

function sym(
  latex: string,
  reader: string,
  text: string,
  ascii: string,
  symbola?: boolean,
) {
  const clsx =
    text == "∞" || text == "°" ? "[line-height:1] relative top-[-.05em]"
    : symbola ? "font-['Symbola'] italic"
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
      tokens.push({
        type: "var",
        kind: "var",
        value: text,
        span: new Span(this.parent, this[L], this[R]),
      })
    }

    get autoCmd() {
      return ascii
    }
  }
}

export const SymPi = sym("\\pi ", " pi ", "π", "pi")
export const SymTau = sym("\\tau ", " tau ", "τ", "tau")
export const SymPsi = sym("\\psi ", " psi ", "ψ", "psi", true)
export const SymGamma = sym("\\Gamma ", " gamma ", "Γ", "Gamma")
export const SymInfinity = sym("\\infinity ", " infinity ", "∞", "infinity")
export const SymDegree = sym("°", " degrees ", "°", "degrees", true)
