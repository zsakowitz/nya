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
  type Selection,
  type VDir,
} from "../model"
import { OpCeq, OpCmp } from "./leaf/cmp"

export class CmdFrac extends Command<[Block, Block]> {
  static init(cursor: Cursor) {
    if (
      cursor[L] instanceof OpCeq &&
      !cursor[L].neg &&
      !(cursor[L] instanceof OpCmp && cursor[L].eq)
    ) {
      cursor[L].setNeg(true)
      return
    }

    const span = cursor.span()
    while (span[L] && !span[L].endsImplicitGroup()) {
      span[L] = span[L][L]
    }
    const num = span.splice().unwrap()
    const denom = new Block(null)
    cursor.setTo(span.cursor(R))
    new CmdFrac(num, denom).insertAt(cursor, L)
    if (num.isEmpty()) {
      cursor.moveIn(num, R)
    } else {
      cursor.moveIn(denom, R)
    }
  }

  static initOn(selection: Selection) {
    const cursor = selection.cursor(R)
    const num = selection.splice().unwrap()
    const denom = new Block(null)
    new CmdFrac(num, denom).insertAt(cursor, L)
    cursor.moveIn(denom, R)
    return cursor
  }

  constructor(num: Block, denom: Block) {
    super(
      "\\frac",
      h(
        "text-[90%] text-center align-[-.46em] px-[.2em] inline-block [.bg-blue-200>&]:bg-blue-200",
        h("px-[.1em] block pt-[.1em]", num.el),
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

  delete(cursor: Cursor, from: Dir): void {
    cursor.moveIn(this.blocks[1], from)
  }

  deleteBlock(cursor: Cursor, at: Dir, block: Block): void {
    if (!cursor.parent) return

    cursor.moveTo(this, R)
    this.remove()

    if (at == L && block == this.blocks[0]) {
      cursor.insert(this.blocks[1], R)
      cursor.insert(this.blocks[0], R)
    } else if (at == R && block == this.blocks[1]) {
      cursor.insert(this.blocks[0], L)
      cursor.insert(this.blocks[1], L)
    } else {
      cursor.insert(this.blocks[1], R)
      cursor.insert(this.blocks[0], L)
    }
  }
}
