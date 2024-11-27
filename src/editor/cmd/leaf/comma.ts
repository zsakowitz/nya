import { Leaf } from "."
import { h } from "../../jsx"
import { L, type Cursor } from "../../model"

export class CmdComma extends Leaf {
  static init(cursor: Cursor) {
    new CmdComma().insertAt(cursor, L)
  }

  constructor() {
    super(",", h("pr-[.1em]", ","))
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

  invalidatesTransparentWrapper(): boolean {
    return true
  }
}
