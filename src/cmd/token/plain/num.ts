import { Token } from ".."
import { Cursor, LEFT } from "../../../core"
import { h, t } from "../../../jsx"

export class CmdNum extends Token {
  static createLeftOf(cursor: Cursor, input: string) {
    new CmdNum(input).insertAt(cursor, LEFT)
  }

  constructor(readonly text: string) {
    super(text, h("span", "font-['Symbola']", t(text)))
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
