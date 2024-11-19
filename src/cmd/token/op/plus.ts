import { Op } from "."
import { LEFT, type Cursor } from "../../../core"

export class CmdPlus extends Op {
  static createLeftOf(cursor: Cursor) {
    new CmdPlus().insertAt(cursor, LEFT)
  }

  constructor() {
    super("+", "+")
  }

  intoAsciiMath(): string {
    return "+"
  }

  intoLatex(): string {
    return "+"
  }

  intoScreenReadable(): string {
    return " plus "
  }
}
