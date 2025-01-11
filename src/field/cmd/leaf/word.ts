import { Leaf } from "."
import type { Node } from "../../../eval/ast/token"
import { h, t } from "../../jsx"
import { R, Span } from "../../model"
import { CmdSupSub } from "../math/supsub"
import type { WordKind } from "./var"

export class CmdWord extends Leaf {
  constructor(
    readonly text: string,
    readonly kind: WordKind = "var",
    readonly italic?: boolean,
  ) {
    // The wrapper ensures selections work fine
    super(
      text,
      h(
        "nya-cmd-var " +
          (italic ? "italic" : (
            `nya-cmd-word nya-cmd-word-${kind == "magicprefix" ? "prefix" : kind} nya-cmd-word-l nya-cmd-word-r`
          )),
        h("font-['Times_New_Roman'] [line-height:.9]", t(text)),
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
    if (this.kind == "magicprefix") {
      let value = this.text
      const ss = this?.[R] instanceof CmdSupSub ? this[R] : null
      tokens.push({
        type: "magicvar",
        value,
        sub: ss?.sub?.ast(),
        sup: ss?.sup?.ast(),
        contents: new Span(this.parent, ss || this, null).ast(),
      })
      return true
    }

    tokens.push({
      type: "var",
      value: this.text,
      kind: this.kind,
    })
  }
}
