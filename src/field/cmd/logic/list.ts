import type { Node } from "../../../eval/ast/token"
import { h } from "../../../jsx"
import type { LatexParser } from "../../latex"
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
} from "../../model"
import { focusEdge, Leaf } from "../leaf"
import { closestGridCell } from "../math/matrix"

export class CmdList extends Command {
  static init(cursor: Cursor) {
    const b1 = new Block(null)
    new CmdList([b1]).insertAt(cursor, L)
    cursor.moveIn(b1, L)
  }

  static render(blocks: Block[]) {
    return h(
      "relative inline-block align-baseline nya-cmd-brack",
      h(
        "left-[.15em] absolute top-0 bottom-[2px] inline-block w-[.25em] border-l border-y border-current",
      ),
      h(
        "my-[.1em] mx-[.55em] gap-y-[.1em] inline-grid align-middle items-center",
        ...blocks.map((x) => h("text-center", x.el)),
      ),
      h(
        "right-[.15em] absolute top-0 bottom-[2px] inline-block w-[.25em] border-r border-y border-current",
      ),
    )
  }

  static fromLatex(cmd: string, parser: LatexParser): Command {
    return new this(
      parser
        .env(cmd, 1)
        .map((x) => x[0])
        .filter((x) => x != null),
    )
  }

  constructor(blocks: Block[]) {
    super("[", CmdList.render(blocks), blocks)
  }

  render(blocks: Block[]) {
    ;(this as any).blocks = blocks
    this.setEl(CmdList.render(blocks))
  }

  get first() {
    if (!this.blocks[0]) {
      this.render([new Block(null)])
    }
    return this.blocks[0]!
  }

  get last() {
    if (!this.blocks[0]) {
      this.render([new Block(null)])
    }
    return this.blocks[this.blocks.length - 1]!
  }

  latex(): string {
    return `\\begin{list}${this.blocks.map((x) => x.latex()).join("\\\\")}\\end{list}`
  }

  reader(): string {
    return ` List ${this.blocks.map((x) => x.reader()).join(" comma ")} EndList `
  }

  ascii(): string {
    return `[${this.blocks.map((x) => x.ascii()).join(",")}]`
  }

  moveOutOf(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards)
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveIn(this.first, towards == L ? R : L)
  }

  vertOutOf(
    dir: VDir,
    block: Block,
    _cursor: Cursor,
  ): Block | true | undefined {
    if ((block == this.first && dir == U) || (block == this.last && dir == D)) {
      return
    }

    return this.blocks[this.blocks.indexOf(block) + dir / 2]
  }

  vertFromSide(): undefined {}

  delete(cursor: Cursor, from: Dir): void {
    if (this.first) {
      cursor.moveIn(this.first, from)
    } else {
      Leaf.prototype.delete.call(this, cursor, from)
    }
  }

  vertInto(dir: VDir, _clientX: number): Block | undefined {
    if (dir == D) {
      return this.last
    } else {
      return this.first
    }
  }

  focus(x: number, y: number): Cursor {
    if (this.distanceToEdge(x) < this.em(0.55 / 2)) {
      return focusEdge(this, x)
    }

    const [row] = closestGridCell(this.el.children[1] as HTMLElement, x, y)
    const block = this.blocks[row]
    if (block) {
      return block.focus(x, y)
    } else {
      return focusEdge(this, x)
    }
  }

  ir(tokens: Node[]): void {
    tokens.push({
      type: "group",
      lhs: "[",
      rhs: "]",
      value:
        this.blocks.length == 1 ? this.blocks[0]!.ast()
        : this.blocks.length ?
          { type: "commalist", items: this.blocks.map((x) => x.ast()) }
        : { type: "void" },
    })
  }

  insRow(cursor: Cursor, block: Block, dir: VDir | null): void {
    const index = this.blocks.indexOf(block)
    if (!dir) {
      dir = !cursor[L] && cursor[R] ? U : D
    }

    const insertAt = index + (dir == U ? 0 : 1)
    const next = this.blocks.slice()
    const b0 = new Block(this)
    next.splice(insertAt, 0, b0)
    this.render(next)
    cursor.moveIn(b0, L)
  }

  insComma(cursor: Cursor, block: Block): true | undefined {
    const index = this.blocks.indexOf(block)
    const next = this.blocks.slice()
    const b0 = new Block(this)
    next.splice(index + 1, 0, b0)
    this.render(next)
    cursor.moveIn(b0, L)
    return true
  }
}
