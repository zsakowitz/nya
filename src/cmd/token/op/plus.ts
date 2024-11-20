import { Op } from "."
import { L, type Cursor } from "../../../model"

export class CmdPlus extends Op {
  static createLeftOf(cursor: Cursor) {
    new CmdPlus().insertAt(cursor, L)
  }

  constructor() {
    super("+", "+")
  }

  endsImplicitGroup(): boolean {
    return true
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
