import { h } from "../jsx"
import { Block, Command, Cursor, L, R, U, type Dir, type VDir } from "../model"

export type Coords = [row: number, col: number]

export class CmdMatrix extends Command<Block[]> {
  static init(cursor: Cursor) {
    const b1 = new Block(null)
    new CmdMatrix(2, [
      b1,
      new Block(null),
      new Block(null),
      new Block(null),
    ]).insertAt(cursor, L)
    cursor.moveIn(b1, L)
  }

  static render(cols: number, blocks: Block[]) {
    blocks.map((x) => x.el.remove())
    return h(
      "relative inline-block align-middle",
      h(
        "left-[.15em] absolute top-0 bottom-[2px] inline-block w-[.25em] border-l-[.05em] border-y-[.05em] border-current",
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
        "right-[.15em] absolute top-0 bottom-[2px] inline-block w-[.25em] border-r-[.05em] border-y-[.05em] border-current",
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
    this.render(next)
  }

  insCol(index: number) {
    const next = this.blocks.slice()
    const rows = this.rows
    for (let i = 0; i < rows; i++) {
      next.splice(i * (this.cols + 1) + index, 0, new Block(this))
    }
    this.render(next, this.cols + 1)
  }

  delCol(index: number) {
    const next = this.blocks.slice()
    const rows = this.rows
    for (let i = 0; i < rows; i++) {
      next.splice(i * (this.cols - 1) + index, 1)
    }
    this.render(next, this.cols - 1)
  }

  col(col: number) {
    return Array.from(
      { length: this.rows },
      (_, index) => this.blocks[index * this.cols + col]!,
    )
  }

  private render(blocks = this.blocks, cols = this.cols) {
    ;(this as any).blocks = blocks
    ;(this as any).cols = cols
    this.setEl(CmdMatrix.render(this.cols, this.blocks))
  }

  latex(): string {
    return `\\begin{matrix}${this.blocks
      .map((block, index) => {
        if (index % this.cols) {
          return "&" + block.latex()
        } else if (index) {
          return "\\\\" + block.latex()
        } else {
          return block.latex()
        }
      })
      .join("")}\\end{matrix}`
  }

  ascii(): string {
    return `matrix(${this.blocks
      .map((block, index) => {
        const inner = `(${block.ascii()})`
        if (index % this.cols) {
          return `,${inner}`
        } else if (index) {
          return `;${inner}`
        } else {
          return inner
        }
      })
      .join("")})`
  }

  reader(): string {
    return ` BeginMatrix, ${this.blocks
      .map((block, index) => {
        if (index % this.cols) {
          return ` MatrixCell ${block.reader()}`
        } else if (index) {
          return `, MatrixRow ${block.reader()}`
        } else {
          return block.reader()
        }
      })
      .join("")}, EndMatrix`
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveIn(
      this.blocks[towards == L ? this.cols - 1 : 0]!,
      towards == L ? R : L,
    )
  }

  moveOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    const index = this.blocks.indexOf(block)

    const [row, col] = this.coords(index)

    const adj = this.blocks[this.index(row, col + towards) ?? -1]

    if (adj) {
      cursor.moveIn(adj, towards == L ? R : L)
      return
    }

    if (towards == L) {
      if (this.col(0).every((x) => x.isEmpty())) {
        if (this.cols > 1) {
          this.delCol(0)
        }
      } else {
        this.insCol(0)
        cursor.moveIn(this.blocks[this.index(row, 0)!]!, L)
        return
      }
    } else {
      if (this.col(this.cols - 1).every((x) => x.isEmpty())) {
        if (this.cols > 1) {
          this.delCol(this.cols - 1)
        }
      } else {
        this.insCol(this.cols)
        cursor.moveIn(this.blocks[this.index(row, this.cols - 1)!]!, L)
        return
      }
    }

    cursor.moveTo(this, towards)
  }

  vertOutOf(dir: VDir, block: Block, cursor: Cursor): Block | undefined {
    const index = this.blocks.indexOf(block)

    const ret =
      dir == U ? this.blocks[index - this.cols] : this.blocks[index + this.cols]

    if (ret) {
      return ret
    }

    if (dir == U) {
      if (
        this.rows > 1 &&
        this.blocks.slice(0, this.cols).every((x) => x.isEmpty())
      ) {
        this.render(this.blocks.slice(this.cols))
        cursor.moveIn(this.blocks[index]!, R)
        return
      }
      this.insRow(0)
      return this.blocks[index]
    } else {
      if (
        this.rows > 1 &&
        this.blocks.slice(-this.cols).every((x) => x.isEmpty())
      ) {
        this.render(this.blocks.slice(0, -this.cols))
        cursor.moveIn(this.blocks[index - this.cols]!, R)
        return
      }
      this.insRow(this.rows)
      return this.blocks[index + this.cols]
    }
  }

  vertFromSide(dir: VDir, from: Dir): Block | undefined {
    return this.blocks[
      this.index(from == L ? 0 : this.cols - 1, dir == U ? 0 : this.rows - 1)!
    ]
  }

  vertInto(dir: VDir, clientX: number): Block | undefined {
    const row =
      dir == U ? this.blocks.slice(0, this.cols) : this.blocks.slice(-this.cols)

    let dist = Infinity
    let ret: Block | undefined

    for (const block of row) {
      const [l, r] = block.bounds()
      if (l <= clientX && clientX <= r) {
        if (dist != 0) {
          dist = 0
          ret = block
        }
        break
      }
      const myDist = clientX < l ? l - clientX : clientX - r
      if (myDist < dist) {
        dist = myDist
        ret = block
      }
    }

    return ret
  }

  delete(cursor: Cursor, from: Dir): void {
    cursor.moveIn(this.blocks[from == L ? 0 : this.cols - 1]!, from)
  }

  deleteBlock(cursor: Cursor, at: Dir, block: Block): void {
    const [row, col] = this.coords(this.blocks.indexOf(block))

    if (this.col(col).every((x) => x.isEmpty())) {
      if (this.cols <= 1) {
        cursor.moveTo(this, R)
        this.remove()
        return
      }
      this.delCol(col)
      const next = Math.max(0, Math.min(this.cols - 1, at == R ? col : col - 1))
      cursor.moveIn(this.blocks[this.index(row, next)!]!, at == L ? R : L)
    } else if (col == 0 && at == L) {
      cursor.moveTo(this, L)
    } else if (col == this.cols - 1 && at == R) {
      cursor.moveTo(this, R)
    } else {
      cursor.moveIn(this.blocks[this.index(row, col + at)!]!, at == L ? R : L)
    }
  }
}
