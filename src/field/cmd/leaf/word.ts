import type { Node } from "@/eval/ast/token"
import { h } from "@/jsx"
import { Leaf } from "."
import { L, R, Span } from "../../model"
import type { WordKind } from "./var"

export class CmdWord extends Leaf {
  constructor(
    readonly text: string,
    readonly kind: Exclude<WordKind, "magicprefix"> = "var",
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
        h("font-['Times_New_Roman'] [line-height:.9]", text),
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
      kind: this.kind,
      span: new Span(this.parent, this[L], this[R]),
    })
  }
}
