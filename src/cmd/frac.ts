import { U_ZERO_WIDTH_SPACE, h, t } from "../jsx"
import { Block, Command, L, type Cursor } from "../model"
import { CmdVar } from "./token/plain/var"

export class CmdFrac extends Command<[Block, Block]> {
  static createLeftOf(cursor: Cursor) {
    const a = new Block(null)
    const ac = cursor.clone()
    ac.moveInside(a, L)
    CmdVar.createLeftOf(ac, "goodbye")
    const b = new Block(null)
    const bc = cursor.clone()
    bc.moveInside(b, L)
    CmdVar.createLeftOf(bc, "hello")
    new CmdFrac([a, b]).insertAt(cursor, L)
  }

  constructor(blocks: [Block, Block]) {
    super(
      "\\frac",
      h(
        "span",
        "text-[90%] text-center align-[-.4em] px-[.2em] inline-block",
        h("span", "px-[.1em] block", blocks[0].el),
        h(
          "span",
          "float-right w-full px-[.1em] border-t border-current block",
          blocks[1].el,
        ),
        h("span", "inline-block w-0", t(U_ZERO_WIDTH_SPACE)),
      ),
      blocks,
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
