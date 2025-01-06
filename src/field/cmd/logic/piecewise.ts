import { h } from "../../jsx"
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
import { focusEdge } from "../leaf"
import { BRACKS } from "../math/brack"
import { closestGridCell } from "../math/matrix"

export class CmdPiecewise extends Command {
  static init(cursor: Cursor): InitRet {
    const b0 = new Block(null)
    new CmdPiecewise([
      b0,
      new Block(null),
      new Block(null),
      new Block(null),
    ]).insertAt(cursor, L)
    cursor.moveIn(b0, R)
  }

  static render(blocks: Block[]) {
    const el = h(
      "relative inline-block text-left -cmd-brack",
      h(
        `absolute bottom-[2px] left-0 top-0 ${BRACKS["{"].w}`,
        BRACKS["{"].html(),
      ),
      h(
        `my-[.1em] inline-block ${BRACKS["{"].mx}`,
        h(
          "inline-grid grid-cols-[auto,auto] gap-y-[0.2em] align-middle items-baseline",
          ...blocks.map((block, index) =>
            h(
              "inline-block py-[.1em]" +
                (index % 2 ?
                  " before:content-['if'] before:px-[0.2em] last:[&.zlx-has-empty]:before:content-['else'] last:[&.zlx-has-empty]:before:pr-0 last:[&.zlx-has-empty]:before:opacity-30 [&:last-child.zlx-has-empty>*]:hidden"
                : ""),
              block.el,
            ),
          ),
        ),
      ),
      h(
        `absolute bottom-[2px] right-0 top-0 ${BRACKS["}"].w}`,
        BRACKS["}"].html(),
      ),
    )
    blocks.map((x) => x.checkIfEmpty())
    return el
  }

  constructor(blocks: Block[]) {
    if (blocks.length % 2) {
      blocks = blocks.concat(new Block(null))
    }
    super("\\cases", CmdPiecewise.render(blocks), blocks)
  }

  private render(blocks: Block[]) {
    ;(this as any).blocks = blocks
    this.setEl(CmdPiecewise.render(blocks))
  }

  latex(): string {
    return `\\begin{cases}${this.blocks
      .map((block, index) => {
        const inner = block.latex()
        if (index % 2) {
          return "&" + inner
        } else if (index) {
          return "\\\\" + inner
        } else {
          return inner
        }
      })
      .join("")}\\end{cases}`
  }

  ascii(): string {
    return `piecewise(${this.blocks
      .map(
        (block, index) =>
          (!(index % 2) && index ? "," : "") + `(${block.ascii()})`,
      )
      .join("")})`
  }

  reader(): string {
    return `Piecewise, ${this.blocks
      .map((block, index) =>
        index % 2 ? `If ${block.reader()} EndCase` : `Case ${block.reader()}`,
      )
      .join(" ")}, EndPiecewise`
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    if (this.blocks.length == 0) {
      this.render([new Block(null), new Block(null)])
    }
    if (towards == L) {
      cursor.moveIn(this.blocks[1]!, R)
    } else {
      cursor.moveIn(this.blocks[0]!, L)
    }
  }

  moveOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    const index = this.blocks.indexOf(block)

    if (index % 2) {
      if (towards == R) {
        cursor.moveTo(this, R)
      } else {
        cursor.moveIn(this.match(index), R)
      }
    } else {
      if (towards == L) {
        cursor.moveTo(this, L)
      } else {
        cursor.moveIn(this.match(index), L)
      }
    }
  }

  private match(index: number) {
    if (index % 2) {
      return this.blocks[index - 1]!
    } else {
      return this.blocks[index + 1]!
    }
  }

  vertFromSide(): undefined {}

  vertOutOf(dir: VDir, block: Block, cursor: Cursor): Block | true | undefined {
    const index = this.blocks.indexOf(block)
    const next = this.blocks[index + dir] // `VDir`'s values are convenient here
    if (next) {
      return next
    }

    const match = this.match(index)
    if (block.isEmpty() && match.isEmpty()) {
      if (this.blocks.length > 2) {
        const next = this.blocks.slice()
        next.splice((index >> 1) << 1, 2)
        this.render(next)
      }
      return
    }
  }

  insRow(cursor: Cursor, block: Block, dir: VDir | null): void {
    const index = this.blocks.indexOf(block)
    if (!dir) {
      dir = !(index % 2) && !cursor[L] && cursor[R] ? U : D
    }

    const insertAt = ((index >> 1) << 1) + (dir == U ? 0 : 2)
    const next = this.blocks.slice()
    const b0 = new Block(this)
    next.splice(insertAt, 0, b0, new Block(this))
    this.render(next)
    cursor.moveIn(b0, L)
  }

  delete(cursor: Cursor, from: Dir): void {
    const block = this.blocks[this.blocks.length - (from == L ? 2 : 1)]
    if (block) {
      cursor.moveIn(block, from)
    } else {
      cursor.moveTo(this, from == L ? R : L)
    }
  }

  deleteBlock(cursor: Cursor, at: Dir, block: Block): void {
    const index = this.blocks.indexOf(block)
    const start = (index >> 1) << 1
    const match = this.match(index)

    if (match.isEmpty() && block.isEmpty()) {
      if (this.blocks.length > 2) {
        const next = this.blocks.slice()
        next.splice(start, 2)
        this.render(next)
        const nextIndex = at == L ? start - 1 : start
        if (this.blocks[nextIndex]) {
          cursor.moveIn(this.blocks[nextIndex], at == L ? R : L)
        } else {
          cursor.moveTo(this, at)
        }
      }
      cursor.moveTo(this, at)
      return
    }

    const next = this.blocks[index + at]
    if (next) {
      cursor.moveIn(next, at == L ? R : L)
    } else {
      cursor.moveTo(this, at)
    }
  }

  vertInto(dir: VDir, clientX: number): Block | undefined {
    if (!this.blocks.length) {
      this.render([new Block(null), new Block(null)])
    }

    const b0 = dir == U ? this.blocks[0]! : this.blocks[this.blocks.length - 2]!
    const b1 = dir == U ? this.blocks[1]! : this.blocks[this.blocks.length - 1]!

    if (b0.distanceTo(clientX) <= b1.distanceTo(clientX)) {
      return b0
    } else {
      return b1
    }
  }

  focus(x: number, y: number): Cursor {
    if (this.distanceToEdge(x) < this.em(0.7 / 2)) {
      return focusEdge(this, x)
    }

    const [row, col] = closestGridCell(
      this.el.children[1]!.children[0] as HTMLElement,
      x,
      y,
    )
    const block = this.blocks[2 * row + col]
    if (block) {
      return block.focus(x, y)
    } else {
      return focusEdge(this, x)
    }
  }
}
