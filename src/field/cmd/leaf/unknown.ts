import { Leaf } from "."
import type { Node } from "../../../eval/ast/token"
import { h } from "../../../jsx"

/**
 * Returned when invalid LaTeX is parsed or when LaTeX is parsed but it cannot
 * be understood using the given command set, to alert the user to the error
 * instead of silently failing.
 */
export class CmdUnknown extends Leaf {
  constructor(readonly source: string) {
    super("\\unknown ", h("text-red-500", source))
  }

  reader(): string {
    return " latex parsing error "
  }

  latex(): string {
    return ""
  }

  ascii(): string {
    return ""
  }

  ir(_tokens: Node[]): true | void {}
}
