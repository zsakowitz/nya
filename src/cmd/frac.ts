import { U_ZERO_WIDTH_SPACE, h, t } from "../jsx"
import {
  Block,
  Command,
  D,
  L,
  R,
  U,
  type Cursor,
  type Dir,
  type VDir,
} from "../model"
import { CmdBrack } from "./brack"

export class CmdFrac extends Command<[Block, Block]> {
  static init(cursor: Cursor) {
    const span = cursor.span()
    while (span[L] && !span[L].endsImplicitGroup()) {
      span[L] = span[L][L]
    }
    const block = span.splice()
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
      cursor.moveIn(num, R)
    } else {
      cursor.moveIn(denom, L)
    }
  }

  constructor(num: Block, denom: Block) {
    super(
      "\\frac",
      h(
        "text-[90%] text-center align-[-.46em] px-[.2em] inline-block",
        h("px-[.1em] block", num.el),
        h(
          "float-right w-full p-[.1em] border-t border-current block",
          denom.el,
        ),
        h("inline-block w-0", t(U_ZERO_WIDTH_SPACE)),
      ),
      [num, denom],
    )
  }

  latex(): string {
    return `\\frac{${this.blocks[0].latex()}}{${this.blocks[1].latex()}}`
  }

  ascii(): string {
    return `(${this.blocks[0].ascii()})/(${this.blocks[1].ascii()})`
  }

  reader(): string {
    return ` BeginFraction, ${this.blocks[0].reader()} Over, ${this.blocks[1].reader()} EndFraction `
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveIn(this.blocks[0], towards == R ? L : R)
  }

  moveOutOf(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards)
  }

  vertInto(dir: VDir): Block {
    return dir == U ? this.blocks[0] : this.blocks[1]
  }

  vertOutOf(dir: VDir, block: Block): Block | undefined {
    if (dir == D && block == this.blocks[0]) {
      return this.blocks[1]
    } else if (dir == U && block == this.blocks[1]) {
      return this.blocks[0]
    }
  }
}
