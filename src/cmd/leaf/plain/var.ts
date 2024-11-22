import { Leaf } from ".."
import { h, t } from "../../../jsx"
import { Cursor, L } from "../../../model"

export class CmdVar extends Leaf {
  static init(cursor: Cursor, input: string) {
    new CmdVar(input).insertAt(cursor, L)
  }

  constructor(readonly text: string) {
    // The wrapper ensures selections work fine
    super(text, h("", h("italic font-['Times'] [line-height:.9]", t(text))))
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
