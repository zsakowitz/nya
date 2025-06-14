import { Precedence } from "@/eval2/prec"
import { D, L, R, U, type Dir, type VDir } from "@/field/dir"
import { U_ZERO_WIDTH_SPACE, h } from "@/jsx"
import type { LatexParser } from "../../latex"
import {
  Block,
  Command,
  type Cursor,
  type IRBuilder,
  type Selection,
} from "../../model"
import { focusEdge } from "../leaf"
import { OpCeq } from "../leaf/cmp"
import { OpDiv } from "../leaf/op"
import { CmdUnknown } from "../leaf/unknown"

export class CmdFrac extends Command<[Block, Block]> {
  static init(cursor: Cursor) {
    if (cursor[L] instanceof OpCeq && !cursor[L].neg) {
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

  static fromLatex(cmd: string, parser: LatexParser): Command {
    if (cmd == "/") {
      return new OpDiv()
    } else if (cmd == "\\frac") {
      return new CmdFrac(parser.arg(), parser.arg())
    } else {
      return new CmdUnknown(cmd)
    }
  }

  constructor(num: Block, denom: Block) {
    super(
      "\\frac",
      h(
        "nya-cmd-frac text-[90%] text-center align-[-.46em] px-[.2em] inline-block [.nya-selected>&]:nya-selected",
        h("px-[.1em] block pt-[.1em]", num.el),
        h(
          "float-right w-full p-[.1em] border-t border-current block",
          denom.el,
        ),
        h("inline-block w-0", U_ZERO_WIDTH_SPACE),
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

  vertFromSide(dir: VDir): Block {
    return this.vertInto(dir)
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

  focus(x: number, y: number): Cursor {
    if (this.distanceToEdge(x) < this.em(0.1)) {
      return focusEdge(this, x)
    }

    if (this.blocks[0].distanceToY(y) < this.blocks[1].distanceToY(y)) {
      return this.blocks[0].focus(x, y)
    } else {
      return this.blocks[1].focus(x, y)
    }
  }

  ir2(ret: IRBuilder): void {
    const a = this.blocks[0].parse()
    const b = this.blocks[1].parse()

    if (
      a.data.type == "uvar" &&
      b.data.type == "op" &&
      b.data.data == "%juxtapose"
    ) {
      const bl = b.args?.[0]?.data
      const br = b.args?.[1]?.data
      if (
        bl?.type == "uvar" &&
        bl.data.name == "d" &&
        !bl.data.sub &&
        br?.type == "uvar"
      ) {
        ret.prfx({ type: "derivative", data: br.data }, Precedence.BigSym)
        return
      }
    }

    ret.leaf({ type: "frac", data: [a, b] })
  }
}
