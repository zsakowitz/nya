import { Leaf } from "."
import type { Node } from "../../../ast/token"
import { h, t } from "../../jsx"
import type { WordKind } from "./var"

export class CmdWord extends Leaf {
  constructor(
    readonly kind: WordKind,
    readonly text: string,
  ) {
    // The wrapper ensures selections work fine
    super(
      text,
      h(
        `nya-cmd-var nya-cmd-word nya-cmd-word-${kind} nya-cmd-word-l nya-cmd-word-r`,
        h("font-['Times_New_Roman'] [line-height:.9]", t(text)),
      ),
    )
  }

  ascii(): string {
    return this.text
  }

  latex(): string {
    return "\\operatorname{" + this.text + "}"
  }

  reader(): string {
    return " " + this.text + " "
  }

  ir(tokens: Node[]): void {
    tokens.push({
      type: "var",
      value: this.text,
      kind: this.kind,
    })
  }
}
