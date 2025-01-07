import { Leaf } from "."
import type { Token } from "../../../ast/token"
import { h } from "../../jsx"
import { L, type Cursor } from "../../model"

export class CmdComma extends Leaf {
  static init(cursor: Cursor) {
    new CmdComma().insertAt(cursor, L)
  }

  constructor() {
    super(",", h("-cmd-op pr-[.1em]", ","))
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
