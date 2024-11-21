import { Token } from ".."
import { Cursor, L } from "../../../model"
import { h, t } from "../../../jsx"

export class CmdVar extends Token {
  static init(cursor: Cursor, input: string) {
    new CmdVar(input).insertAt(cursor, L)
  }

  constructor(readonly text: string) {
    super(text, h("italic font-['Times'] [line-height:.9]", t(text)))
  }

  ascii(): string {
    return this.text
  }

  latex(): string {
    return this.text
  }

  reader(): string {
    return this.text
  }
}
