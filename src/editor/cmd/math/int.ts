import { h, U_ZERO_WIDTH_SPACE } from "../../jsx"
import {
  Block,
  Command,
  D,
  L,
  R,
  U,
  type Cursor,
  type Dir,
  type InitRet,
  type VDir,
} from "../../model"

export type BlocksInt = [sub: Block, sup: Block] | []

export class CmdInt extends Command<BlocksInt> {
  static init(cursor: Cursor): InitRet {
    // const b0 = new Block(null)
    // new CmdInt([b0, new Block(null)]).insertAt(cursor, L)
    // cursor.moveIn(b0, R)
    new CmdInt([]).insertAt(cursor, L)
  }

  static render(blocks: BlocksInt) {
    if (blocks.length == 0) {
      return h(
        "relative inline-block",
        h(
          "relative inline-block scale-x-[70%] align-[-.12em] text-[200%]",
          "∫",
        ),
      )
    }

    return h(
      "relative inline-block",
      h("relative inline-block scale-x-[70%] align-[-.12em] text-[200%]", "∫"),
      h(
        "mb-[-.2em] inline-block pb-[.2em] pr-[.2em] text-left align-[-1.1em] text-[80%]",
        h("block", h("align-[1.3em]", blocks[1].el)),
        h("float-left ml-[-.35em] block text-[100%]", blocks[0].el),
        h("", U_ZERO_WIDTH_SPACE),
      ),
    )
  }

  constructor(blocks: BlocksInt) {
    super("\\int", CmdInt.render(blocks), blocks)
  }

  private render(blocks = this.blocks) {
    ;(this as any).blocks = blocks
    this.setEl(CmdInt.render(blocks))
  }

  latex(): string {
    return this.blocks.length ?
        `\\int_{${this.blocks[0]!.latex()}}^{${this.blocks[1]!.latex()}}`
      : `\\int `
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    if (this.blocks[1]) {
      cursor.moveIn(this.blocks[1], towards == L ? R : L)
    } else {
      cursor.moveTo(this, towards)
    }
  }

  moveOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    cursor.moveTo(this, towards)
  }

  vertFromSide(dir: VDir, from: Dir): Block | undefined {
    if (!this.blocks.length) {
      this.render([new Block(this), new Block(this)])
    }

    return this.blocks[dir == U ? 1 : 0]!
  }

  vertInto(dir: VDir): Block | undefined {
    if (!this.blocks.length) {
      return
    }

    if (dir == U) {
      return this.blocks[1]
    } else {
      return this.blocks[0]
    }
  }

  vertOutOf(dir: VDir, block: Block, cursor: Cursor): Block | true | undefined {
    if (dir == U && block == this.blocks[0]) {
      return this.blocks[1]!
    }

    if (dir == D && block == this.blocks[1]) {
      return this.blocks[0]!
    }
  }

  delete(cursor: Cursor, from: Dir): void {
    if (this.blocks.length) {
      cursor.moveIn(this.blocks[0]!, from)
      return
    }
    if (cursor[R] == this) {
      cursor.moveTo(this, R)
    }
    this.remove()
  }

  supSub(part: VDir, side: Dir, cursor: Cursor): boolean {
    if (!this.blocks.length) {
      this.render([new Block(this), new Block(this)])
    }

    cursor.moveIn(this.blocks[part == U ? 1 : 0]!, side)
    return true
  }

  reader(): string {
    if (this.blocks.length == 2) {
      return (
        "\\int_{" +
        this.blocks[0]!.reader() +
        "}^{" +
        this.blocks[1]!.reader() +
        "}"
      )
    }

    return "\\int"
  }

  ascii(): string {
    if (this.blocks.length == 2) {
      return `int((${this.blocks[0]!.ascii()}),(${this.blocks[1]!.ascii()}))`
    }
    return "int"
  }
}
