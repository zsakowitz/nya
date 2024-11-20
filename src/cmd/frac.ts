import { U_ZERO_WIDTH_SPACE, h, t } from "../jsx"
import { Block, Command, L, R, type Cursor } from "../model"
import { CmdBrack } from "./paren"

export class CmdFrac extends Command<[Block, Block]> {
  static createLeftOf(cursor: Cursor) {
    const span = cursor.span()
    while (span[L] && !span[L].endsImplicitGroup()) {
      span[L] = span[L][L]
    }
    const block = span.remove()
    cursor.setTo(span.cursor(L))
    const denom = new Block(null)
    const num =
      !block.isEmpty() &&
      block.ends[L] == block.ends[R] &&
      block.ends[L] instanceof CmdBrack &&
      block.ends[L].lhs == "(" &&
      block.ends[L].rhs == ")"
        ? block.ends[L].blocks[0]
        : block
    new CmdFrac(num, denom).insertAt(cursor, L)
    if (num.isEmpty()) {
      cursor.moveInside(num, R)
    } else {
      cursor.moveInside(denom, L)
    }
  }

  constructor(num: Block, denom: Block) {
    super(
      "\\frac",
      h(
        "span",
        "text-[90%] text-center align-[-.4em] px-[.2em] inline-block",
        h("span", "px-[.1em] block", num.el),
        h(
          "span",
          "float-right w-full p-[.1em] border-t border-current block",
          denom.el,
        ),
        h("span", "inline-block w-0", t(U_ZERO_WIDTH_SPACE)),
      ),
      [num, denom],
    )
  }

  intoLatex(): string {
    return `\\frac{${this.blocks[0].intoLatex()}}{${this.blocks[1].intoLatex()}}`
  }

  intoAsciiMath(): string {
    return `(${this.blocks[0].intoAsciiMath()})/(${this.blocks[1].intoAsciiMath()})`
  }

  intoScreenReadable(): string {
    return ` BeginFraction, ${this.blocks[0].intoScreenReadable()} Over, ${this.blocks[1].intoScreenReadable()} EndFraction `
  }
}
