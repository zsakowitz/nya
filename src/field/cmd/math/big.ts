import type { Token } from "../../../ast/token"
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
  type InitProps,
  type VDir,
} from "../../model"
import { focusEdge } from "../leaf"
import { OpEq } from "../leaf/cmp"
import { CmdVar } from "../leaf/var"

export const BIG_CMDS = {
  "\\sum": "∑",
  "\\prod": "∏",
  "\\coprod": "∐",
} as const

export type BigCmd = keyof typeof BIG_CMDS
type BigSym = (typeof BIG_CMDS)[BigCmd]

export const BIG_ALIASES: Record<(string & {}) | BigCmd | BigSym, BigCmd> = {
  "\\sum": "\\sum",
  "\\prod": "\\prod",
  "\\coprod": "\\coprod",
  "∑": "\\sum",
  "∏": "\\prod",
  "∐": "\\coprod",
}

export class CmdBig extends Command<
  [sub: Block] | [sub: Block, sup: Block],
  BigCmd
> {
  static init(cursor: Cursor, { input, options }: InitProps) {
    if (!(input in BIG_ALIASES)) return

    const seq = BIG_ALIASES[input]!
    const cmd = new CmdBig(seq, new Block(null), null)
    cmd.insertAt(cursor, L)
    cursor.moveIn(cmd.blocks[0], L)
    new CmdVar("n", options).insertAt(cursor, L)
    new OpEq(false).insertAt(cursor, L)

    return cursor
  }

  static render(ctrlSeq: BigCmd, sub: Block, sup: Block | null) {
    return h(
      "inline-block px-[.2em] py-[.1em] text-center align-[-.2em]",
      sup ? h("block text-[80%]", sup.el) : null,
      h("relative block text-[200%]", BIG_CMDS[ctrlSeq]),
      h("float-right block w-full text-[80%]", sub.el),
    )
  }

  constructor(ctrlSeq: BigCmd, sub: Block, sup: Block | null) {
    super(ctrlSeq, CmdBig.render(ctrlSeq, sub, sup), sup ? [sub, sup] : [sub])
  }

  latex(): string {
    const upper = this.blocks[1] ? `^{${this.blocks[1].latex()}}` : ""
    return `${this.ctrlSeq}_{${this.blocks[0].latex()}}${upper}`
  }

  ascii(): string {
    const upper = this.blocks[1] ? `,(${this.blocks[1].ascii()})` : ""
    return `${this.ctrlSeq.slice(1)}((${this.blocks[0].ascii()})${upper})`
  }

  reader(): string {
    const tag = `${this.ctrlSeq[1]!.toUpperCase()}${this.ctrlSeq.slice(2)}`
    const upper =
      this.blocks[1] ? `${tag}Upper ${this.blocks[1].reader()} ` : ""
    return ` ${tag} ${this.blocks[0].reader()} ${upper}End${tag} `
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveIn(this.blocks[1] || this.blocks[0], towards == R ? L : R)
  }

  moveOutOf(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards)
  }

  vertInto(dir: VDir): Block | undefined {
    return dir == U ? this.blocks[1] : this.blocks[0]
  }

  vertFromSide(dir: VDir): Block {
    if (dir == U) {
      if (!this.blocks[1]) {
        this.blocks[1] = new Block(this)
        this.setEl(CmdBig.render(this.ctrlSeq, this.blocks[0], this.blocks[1]!))
      }
      return this.blocks[1]
    }
    return this.blocks[0]
  }

  vertOutOf(dir: VDir, block: Block): Block | true | undefined {
    if (dir == U && block == this.blocks[0]) {
      if (!this.blocks[1]) {
        this.blocks[1] = new Block(this)
        this.setEl(CmdBig.render(this.ctrlSeq, this.blocks[0], this.blocks[1]))
      }
      return this.blocks[1]
    } else if (dir == D && block == this.blocks[1]) {
      return this.blocks[0]
    }
  }

  delete(cursor: Cursor, from: Dir): void {
    cursor.moveIn(this.blocks[0], from)
  }

  deleteBlock(cursor: Cursor, at: Dir, block: Block): void {
    if (!cursor.parent) return

    if (block == this.blocks[1]) {
      cursor.moveTo(this, R)
      cursor.insert(this.blocks[1], L)
      cursor.moveIn(this.blocks[0], at == L ? R : L)
      this.blocks.pop()
      this.setEl(CmdBig.render(this.ctrlSeq, this.blocks[0], null))
      return
    }

    cursor.moveTo(this, R)
    cursor.insert(this.blocks[0], at == L ? R : L)
    this.remove()
  }

  endsImplicitGroup(): boolean {
    return true
  }

  supSub(part: VDir, side: Dir, cursor: Cursor): boolean {
    if (part == U && !this.blocks[1]) {
      this.blocks[1] = new Block(this)
      this.setEl(CmdBig.render(this.ctrlSeq, this.blocks[0], this.blocks[1]))
    }
    cursor.moveIn(this.blocks[part == U ? 1 : 0]!, side)
    return true
  }

  focus(x: number, y: number): Cursor {
    if (
      this.distanceToEdge(x) < this.em(0.1) ||
      this.distanceToEdge(x) < this.blocks[0].distanceTo(x)
    ) {
      return focusEdge(this, x)
    }

    if (this.blocks[1] && y <= this.blocks[1].bounds()[3]) {
      return this.blocks[1].focus(x, y)
    }

    return this.blocks[0].focus(x, y)
  }

  ir(tokens: Token[]): void {
    tokens.push({
      type: "big",
      cmd: this.ctrlSeq,
      sub: this.blocks[0].ast(),
      sup: this.blocks[1]?.ast(),
    })
  }
}
