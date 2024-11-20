import { Token } from ".."
import { Cursor, L } from "../../../model"
import { h, t } from "../../../jsx"

export class CmdVar extends Token {
  static createLeftOf(cursor: Cursor, input: string) {
    new CmdVar(input).insertAt(cursor, L)
  }

  constructor(readonly text: string) {
    super(text, h("span", "italic font-['Times'] [line-height:.9]", t(text)))
  }

  intoAsciiMath(): string {
    return this.text
  }

  intoLatex(): string {
    return this.text
  }

  intoScreenReadable(): string {
    return this.text
  }
}
