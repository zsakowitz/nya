import type { Node } from "@/eval/ast/token"
import type { LatexParser } from "@/field/latex"
import { h } from "@/jsx"
import { Leaf } from "."
import { L, R, Span, type Command } from "../../model"
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

  ir(tokens: Node[]): true | void {
    tokens.push({
      type: "var",
      value: this.text,
      kind: this.kind == "builtin" ? "prefix" : this.kind,
      span: new Span(this.parent, this[L], this[R]),
    })
  }
}
