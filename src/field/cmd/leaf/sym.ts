import { IR, leaf } from "@/eval2/node"
import { ParseNode } from "@/eval2/parse"
import { L } from "@/field/dir"
import { h } from "@/jsx"
import { Leaf } from "."
import type { LatexParser } from "../../latex"
import type {
  Command,
  Cursor,
  InitProps,
  InitRet,
  IRBuilder,
} from "../../model"

interface Sym {
  text: string
  ascii: string
  /** @default `\\${ascii} ` */
  latex?: string
  /** @default ` ${ascii} ` */
  reader?: string
  style?: "infdeg" | "symbola" | "var-italic" | "var"
  ir?: IR
}

function sym2({
  style,
  text,
  ascii,
  latex = `\\${ascii} `,
  reader = ` ${ascii} `,
  ir,
}: Sym) {
  const clsx = {
    infdeg: "[line-height:1] relative top-[-.05em]",
    symbola: "font-['Symbola'] italic",
    "var-italic": "font-['Times_New_Roman'] [line-height:.9] italic",
    var: "font-['Times_New_Roman'] [line-height:.9]",
  }[style ?? "var"]

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

    get autoCmd() {
      return ascii
    }

    ir2(ret: IRBuilder): void {
      if (ir) {
        ret.push(ir)
      } else {
        super.ir2(ret)
      }
    }
  }
}

function sym(
  latex: string,
  reader: string,
  text: string,
  ascii: string,
  symbola?: boolean,
  italic?: boolean,
) {
  const clsx =
    text == "∞" || text == "°" ? "[line-height:1] relative top-[-.05em]"
    : symbola ? "font-['Symbola'] italic"
    : italic ? "font-['Times_New_Roman'] [line-height:.9] italic"
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

    get autoCmd() {
      return ascii
    }
  }
}

export const SymPi = sym2({
  ascii: "pi",
  text: "π",
  ir: leaf({
    type: "bcall",
    data: {
      name: { name: "pi", sub: null },
      sup: null,
      arg: new ParseNode({ type: "list", data: null }, []),
    },
  }),
})

export const SymTau = sym2({
  ascii: "tau",
  text: "τ",
  ir: leaf({
    type: "bcall",
    data: {
      name: { name: "tau", sub: null },
      sup: null,
      arg: new ParseNode({ type: "list", data: null }, []),
    },
  }),
})

export const SymInfinity = sym2({
  style: "infdeg",
  ascii: "infty",
  text: "∞",
  reader: " infinity ",
  ir: leaf({
    type: "bcall",
    data: {
      name: { name: "pos_inf", sub: null },
      sup: null,
      arg: new ParseNode({ type: "list", data: null }, []),
    },
  }),
})

export const SymPsi = sym("\\psi ", " psi ", "ψ", "psi", true)
// export const SymGamma = sym("\\Gamma ", " gamma ", "Γ", "Gamma")
export const SymDegree = sym("°", " degrees ", "°", "degrees", true)
export const SymE = sym("ᴇ", " times ten to the ", "ᴇ", "E")
export const SymTheta = sym("\\theta ", " theta ", "θ", "theta", false, true)
