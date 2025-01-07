import { Leaf } from "."
import type { Token } from "../../../ast/token"
import { h } from "../../jsx"
import { L, type Cursor } from "../../model"

export class CmdExclamation extends Leaf {
  static init(cursor: Cursor) {
    new CmdExclamation().insertAt(cursor, L)
  }

  constructor() {
    super(",", h("nya-cmd-op pr-[.1em]", ","))
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

  ir(tokens: Token[]): void {
    tokens.push({ type: "punc", value: "," })
  }
}
