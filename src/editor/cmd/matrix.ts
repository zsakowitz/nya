import { h, p, svg } from "../jsx"
import { Block, Command, Cursor, L, R, U, type Dir, type VDir } from "../model"
import { CmdNum } from "./leaf/num"

export type Coords = [row: number, col: number]

export class CmdMatrix extends Command<Block[]> {
  static init(cursor: Cursor) {
    const x1 = new Block(null)
    new CmdNum("1").insertAt(new Cursor(x1, null), L)
    const x2 = new Block(null)
    new CmdNum("2").insertAt(new Cursor(x2, null), L)
    const x3 = new Block(null)
    new CmdNum("3").insertAt(new Cursor(x3, null), L)
    const x4 = new Block(null)
    new CmdNum("4").insertAt(new Cursor(x4, null), L)
    new CmdMatrix(2, [x1, x2, x3, x4]).insertAt(cursor, L)
    return x3.cursor(R)
  }

  static render(cols: number, blocks: Block[]) {
    blocks.map((x) => x.el.remove())
    return h(
      "relative inline-block align-middle",
      h(
        "left-0 absolute top-0 bottom-[2px] inline-block w-[.55em]",
        svg("0 0 11 24", p("M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1")),
      ),
      h(
        {
          class:
            "my-[.1em] inline-grid mx-[.55em] gap-y-[.1em] gap-x-[.4em] items-baseline",
          style: `grid-template-columns:repeat(${cols},auto)`,
        },
        ...blocks.map((x) => x.el),
      ),
      h(
        "right-0 absolute top-0 bottom-[2px] inline-block w-[.55em]",
        svg("0 0 11 24", p("M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1")),
      ),
    )
  }

  constructor(
    readonly cols: number,
    blocks: Block[],
  ) {
    if (cols < 1) {
      throw new Error("A matrix must have at least one column.")
    }
    super("\\matrix", CmdMatrix.render(cols, blocks), blocks)
  }

  get rows() {
    return this.blocks.length / this.cols
  }

  coords(index: number): Coords {
    console.warn(index)
    return [Math.floor(index / this.cols), index % this.cols]
  }

  index(row: number, col: number): number | undefined {
    if (row < 0 || col < 0 || col >= this.cols) {
      return
    }

    return row * this.cols + col
  }

  insRow(index: number) {
    const next = this.blocks.slice()
    next.splice(
      index * this.cols,
      0,
      ...Array.from({ length: this.cols }, () => new Block(this)),
    )
    ;(this as any).blocks = next
    this.render()
  }

  private render() {
    this.setEl(CmdMatrix.render(this.cols, this.blocks))
  }

  latex(): string {
    return "TODO:"
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveIn(
      this.blocks[towards == L ? this.cols - 1 : 0]!,
      towards == L ? R : L,
    )
  }

  moveOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    const index = this.blocks.indexOf(block)

    const adj =
      towards == R ?
        (index + 1) % this.cols ?
          this.blocks[index + 1]
        : null
      : index % this.cols ? this.blocks[index - 1]
      : null

    if (adj) {
      cursor.moveIn(adj, towards == L ? R : L)
    } else {
      cursor.moveTo(this, towards)
    }
  }

  vertOutOf(dir: VDir, block: Block): Block | undefined {
    const index = this.blocks.indexOf(block)

    const ret =
      dir == U ? this.blocks[index - this.cols] : this.blocks[index + this.cols]

    if (ret) {
      return ret
    }

    if (dir == U) {
      this.insRow(0)
      return this.blocks[index]
    } else {
      this.insRow(this.rows)
      return this.blocks[index + this.cols]
    }
  }
}
