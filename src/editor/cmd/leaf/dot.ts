import { Leaf } from "."
import { h } from "../../jsx"
import { L, type Cursor } from "../../model"

export class CmdDot extends Leaf {
  static init(cursor: Cursor) {
    new CmdDot().insertAt(cursor, L)
  }

  constructor() {
    super(",", h("", "."))
  }

  reader(): string {
    return " comma "
  }

  ascii(): string {
    return ","
  }

  latex(): string {
    return ","
  }
}
