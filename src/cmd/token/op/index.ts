import { Token } from ".."
import { h, t } from "../../../jsx"

export abstract class Op extends Token {
  constructor(
    readonly ctrlSeq: string,
    readonly text: string,
  ) {
    super(ctrlSeq, h("span", "px-[.2em] font-['Symbola']", t(text)))
  }
}
