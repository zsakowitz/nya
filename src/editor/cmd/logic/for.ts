import { h } from "../../jsx"
import {
  Block,
  Command,
  Cursor,
  D,
  L,
  R,
  U,
  type Dir,
  type VDir,
} from "../../model"
import { OpEq } from "../leaf/cmp"

export class CmdFor extends Command<
  [bound: Block, source: Block, mapped: Block]
> {
  static init(cursor: Cursor) {
    const b1 = new Block(null)
    new CmdFor(b1, new Block(null), new Block(null)).insertAt(cursor, L)
    cursor.moveIn(b1, L)
  }

  constructor(mapped: Block, bound: Block, source: Block) {
    super(
      "\\matrix",
      h(
        "relative inline-block align-baseline nya-cmd-brack",
        h(
          "left-[.15em] absolute top-0 bottom-[2px] inline-block w-[.25em] border-l border-y border-current",
        ),
        h(
          "my-[.1em] mx-[.55em] gap-y-[.1em] flex flex-col items-baseline",
          h("", mapped.el),
          h(
            "text-[60%]",
            h("font-serif", "for "),
            bound.el,
            new OpEq(false).el,
            source.el,
          ),
        ),
        h(
          "right-[.15em] absolute top-0 bottom-[2px] inline-block w-[.25em] border-r border-y border-current",
        ),
      ),
      [mapped, bound, source],
    )
  }

  latex(): string {
    return "\\text{no clue how to .latex() CmdFor yet}"
  }

  reader(): string {
    return "\\text{no clue how to .reader() CmdFor yet}"
  }

  ascii(): string {
    return "\\text{no clue how to .ascii() CmdFor yet}"
  }

  moveOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    if (towards == R && block == this.blocks[1]) {
      cursor.moveIn(this.blocks[2], L)
      return
    }

    if (towards == L && block == this.blocks[2]) {
      cursor.moveIn(this.blocks[1], R)
      return
    }

    cursor.moveTo(this, towards)
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveIn(this.blocks[0], towards == L ? R : L)
  }

  vertOutOf(dir: VDir, block: Block, cursor: Cursor): Block | true | undefined {
    if (block == this.blocks[0]) {
      if (dir == D) {
        const x = cursor.clientX()!
        const b1 = this.blocks[1].distanceTo(x)
        const b2 = this.blocks[2].distanceTo(x)
        if (b1 <= b2) {
          return this.blocks[1]
        } else {
          return this.blocks[2]
        }
      }
    } else if (dir == U) {
      return this.blocks[0]
    }
  }

  vertFromSide(): undefined {}

  delete(cursor: Cursor, from: Dir): void {
    cursor.moveIn(this.blocks[0], from)
  }

  vertInto(dir: VDir, clientX: number): Block | undefined {
    if (dir == D) {
      const b1 = this.blocks[1].distanceTo(clientX)
      const b2 = this.blocks[2].distanceTo(clientX)

      if (b1 <= b2) {
        return this.blocks[1]
      } else {
        return this.blocks[2]
      }
    } else {
      return this.blocks[0]
    }
  }
}
