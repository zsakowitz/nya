import { L, R, type Dir } from "@/field/dir"
import { h } from "@/jsx"
import type { LatexParser } from "../../latex"
import { Block, Command, type Cursor, type IRBuilder } from "../../model"
import { Leaf } from "../leaf"
import { BRACKS } from "./brack"

export class CmdSurreal extends Command<[Block, Block]> {
  static fromLatex(_cmd: string, parser: LatexParser): Command {
    const lhs = parser.arg()
    const rhs = parser.arg()
    return new CmdSurreal(lhs, rhs)
  }

  static render(lhs: Block, rhs: Block) {
    const lhsSymbol = BRACKS["{"]
    const rhsSymbol = BRACKS["}"]
    return h(
      "relative inline-block nya-cmd-brack items-baseline",
      h(
        "left-0 absolute top-0 bottom-[2px] inline-block " + lhsSymbol.w,
        lhsSymbol.html(),
      ),
      h(`my-[.1em] inline-block *:contents ${lhsSymbol.mx}`, lhs.el),
      h("nya-cmd-op px-[.2em]", "|"), // TODO: fix bar rendering
      h(`my-[.1em] inline-block *:contents ${rhsSymbol.mx}`, rhs.el),
      h(
        "right-0 absolute top-0 bottom-[2px] inline-block " + rhsSymbol.w,
        rhsSymbol.html(),
      ),
    )
  }

  constructor(
    readonly lhs: Block,
    readonly rhs: Block,
  ) {
    super("\\left\\{", CmdSurreal.render(lhs, rhs), [lhs, rhs])
  }

  ascii(): string {
    return `surreal(${this.blocks[0].ascii()};${this.blocks[1].ascii()})`
  }

  latex(): string {
    return `\\left\\{${this.blocks[0].latex()}\\middle|${this.blocks[1].latex()}\\right\\}`
  }

  reader(): string {
    return `SurrealLeft, ${this.blocks[0].reader()} SurrealRight, ${this.blocks[1].reader()} , EndSurreal ${this.rhs}`
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    if (towards == R) {
      cursor.moveIn(this.blocks[0], L)
    } else {
      cursor.moveIn(this.blocks[1], R)
    }
  }

  moveOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    if (block == this.blocks[0] && towards == R) {
      cursor.moveIn(this.blocks[1], L)
    } else if (block == this.blocks[1] && towards == L) {
      cursor.moveIn(this.blocks[0], R)
    } else {
      cursor.moveTo(this, towards)
    }
  }

  vertInto(): Block | undefined {
    // TODO: make this better
    return this.blocks[0]
  }

  vertFromSide(): undefined {}

  vertOutOf(): undefined {}

  delete(_cursor: Cursor, _from: Dir): void {
    // TODO: whenever surreals are interactive make this better
  }

  deleteBlock(cursor: Cursor, at: Dir): void {
    // TODO: make this better
    cursor.moveTo(this, R)
    this.remove()
    cursor.insert(this.blocks[0], at == L ? R : L)
  }

  focus(x: number, y: number): Cursor {
    // TODO: whenever surreals are interactive make this better
    return Leaf.prototype.focus.call(this, x, y)
  }

  ir2(ret: IRBuilder): void {
    ret.leaf({
      type: "surreal",
      data: {
        lhs: this.blocks[0]!.parse(),
        rhs: this.blocks[1]!.parse(),
      },
    })
  }
}
