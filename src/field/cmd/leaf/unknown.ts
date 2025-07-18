import type { IRBuilder } from "@/field/model"
import { h } from "@/jsx"
import { Leaf } from "."

/**
 * Returned when invalid LaTeX is parsed or when LaTeX is parsed but it cannot
 * be understood using the given command set, to alert the user to the error
 * instead of silently failing.
 */
export class CmdUnknown extends Leaf {
  constructor(readonly source: string) {
    super(
      "\\unknown ",
      h(
        "px-[.1em]",
        h("text-(--nya-latex-error) border border-current px-1", source),
      ),
    )
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

  ir2(_ret: IRBuilder): void {
    // TODO: location info
    throw new Error(
      `I don't understand the LaTeX command '${this.source}', which you pasted.`,
    )
  }
}
