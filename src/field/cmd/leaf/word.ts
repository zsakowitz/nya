import {
  Precedence,
  PRECEDENCE_WORD_BINARY,
  PRECEDENCE_WORD_UNARY,
} from "@/eval2/prec"
import type { LatexParser } from "@/field/latex"
import { h } from "@/jsx"
import { Leaf } from "."
import { type Command, type IRBuilder } from "../../model"
import { CmdUnknown } from "./unknown"
import type { WordKind } from "./var"

export class CmdWord extends Leaf {
  static fromLatex(cmd: string, parser: LatexParser): Command {
    const kind =
      cmd == "\\wordvar" ? "var"
      : cmd == "\\wordprefix" ? "prefix"
      : cmd == "\\wordinfix" ? "infix"
      : cmd == "\\nyaop" ? "builtin"
      : null

    if (kind == null) {
      return new CmdUnknown(cmd)
    }

    return new CmdWord(parser.text(), kind)
  }

  constructor(
    readonly text: string,
    readonly kind:
      | Exclude<WordKind, "magicprefix" | "magicprefixword">
      | "builtin" = "var",
    readonly italic?: boolean,
  ) {
    // The wrapper ensures selections work fine
    super(
      text,
      h(
        "nya-cmd-var " +
          (italic ?
            /[A-Za-z]/.test(text) ?
              "italic"
            : ""
          : `nya-cmd-word nya-cmd-word-${kind} nya-cmd-word-l nya-cmd-word-r`),
        h(
          (kind == "builtin" ? "font-['Symbola']" : (
            "font-['Times_New_Roman']"
          )) + " [line-height:.9]",
          text,
        ),
      ),
    )
  }

  ascii(): string {
    return this.text
  }

  latex(): string {
    if (this.italic) {
      return this.text
    } else {
      return "\\operatorname{" + this.text + "}"
    }
  }

  reader(): string {
    if (this.italic) {
      return this.text
    } else {
      return " " + this.text + " "
    }
  }

  ir2(ret: IRBuilder): void {
    switch (this.kind) {
      case "prefix":
      case "builtin": {
        const p = PRECEDENCE_WORD_UNARY[this.text]
        ret.prfx(
          { type: "op", data: this.text },
          p == null ? Precedence.ImplicitFnL : p,
          p == null ? Precedence.ImplicitFnR : p,
        )
        break
      }

      case "infix": {
        const p = PRECEDENCE_WORD_BINARY[this.text]
        ret.prfx(
          { type: "op", data: this.text },
          p ? p[0] : Precedence.ProdL,
          p ? p[1] : Precedence.ProdR,
        )
        break
      }

      case "var":
        ret.leaf({ type: "bvar", data: { name: this.text, sub: null } })
        break
    }
  }
}
