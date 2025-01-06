import { Leaf } from "."
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
        `-cmd-var -cmd-word -cmd-word-${kind} -cmd-word-l -cmd-word-r`,
        h("font-['Times'] [line-height:.9]", t(text)),
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
}
