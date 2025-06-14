import { subscript } from "@/eval2/tx"
import { D, L, R, U, type Dir, type VDir } from "@/field/dir"
import { h, U_ZERO_WIDTH_SPACE } from "@/jsx"
import { issue } from "../../../../lang/src/emit/error"
import type { LatexParser } from "../../latex"
import {
  Block,
  Command,
  Cursor,
  type InitProps,
  type IRBuilder,
} from "../../model"
import { focusEdge } from "../leaf"
import { CmdUnknown } from "../leaf/unknown"

export class CmdSupSub extends Command {
  static init(cursor: Cursor, { input }: InitProps) {
    const part =
      input == "^" ? (["sup", U, null, true] as const)
      : input == "_" ? (["sub", D, true, null] as const)
      : null

    if (!part) {
      return
    }

    // Move into an existing sup-/subscript on the left side
    const prev = cursor[L]
    if (prev instanceof CmdSupSub) {
      cursor.moveIn(prev.create(part[0]), R)
      return
    } else if (prev && prev.supSub(part[1], R, cursor)) {
      return
    }

    // Move into an existing sup-/subscript on the right side
    const next = cursor[R]
    if (next instanceof CmdSupSub) {
      cursor.moveIn(next.create(part[0]), L)
      return
    }

    // Fallback to creating a new SupSub instance
    const block = new Block(null)
    new CmdSupSub(part[2] && block, part[3] && block).insertAt(cursor, L)
    cursor.moveIn(block, R)
  }

  static fromLatex(cmd: string, parser: LatexParser): Command {
    if (cmd == "_") {
      const sub = new Block(null)
      let sup: Block | null = null
      const supsub = new CmdSupSub(sub, sup)
      parser.arg(sub)
      if (parser.peek() == "^") {
        parser.i++
        sup = supsub.create("sup")
        parser.arg(sup)
      }
      return supsub
    } else if (cmd == "^") {
      const sup = new Block(null)
      let sub: Block | null = null
      const supsub = new CmdSupSub(sub, sup)
      parser.arg(sup)
      if (parser.peek() == "_") {
        parser.i++
        sub = supsub.create("sub")
        parser.arg(sub)
      }
      return supsub
    } else {
      return new CmdUnknown(cmd)
    }
  }

  constructor(
    readonly sub: Block | null,
    readonly sup: Block | null,
  ) {
    super(
      sub ? "_" : "^",
      CmdSupSub.render(sub, sup),
      [sub, sup].filter((x) => x != null),
    )
  }

  supSub(part: VDir, side: Dir, cursor: Cursor): boolean {
    cursor.moveIn(this.create(part == U ? "sup" : "sub"), side)
    return true
  }

  ascii(): string {
    return (
      (this.sub ? `_(${this.sub.ascii()})` : "") +
      (this.sup ? `^(${this.sup.ascii()})` : "")
    )
  }

  latex(): string {
    return (
      (this.sub ? `_{${this.sub.latex()}}` : "") +
      (this.sup ? `^{${this.sup.latex()}}` : "")
    )
  }

  reader(): string {
    return (
      (this.sub ? `Sub ${this.sub.reader()} EndSub` : "") +
      (this.sup ? `Sup ${this.sup.reader()} EndSup` : "")
    )
  }

  static render(
    sub: { el: HTMLSpanElement } | null,
    sup: { el: HTMLSpanElement } | null,
  ) {
    if (sup && !sub) {
      return h(
        "nya-cmd-supsub",
        h(
          "mb-[-.2em] inline-block text-left align-[.5em] text-[90%] [.nya-selected>&]:nya-selected",
          h("inline-block align-text-bottom", sup.el),
        ),
      )
    } else if (sub && !sup) {
      return h(
        "nya-cmd-supsub",
        h(
          "mb-[-.2em] inline-block text-left align-[-.5em] text-[90%] [.nya-selected>&]:nya-selected",
          h("float-left block text-[80%]", sub.el),
          h("inline-block w-0", U_ZERO_WIDTH_SPACE),
        ),
      )
    } else if (sub && sup) {
      return h(
        "nya-cmd-supsub",
        h(
          "mb-[-.2em] inline-block text-left align-[-.5em] text-[90%] [.nya-selected>&]:nya-selected",
          h("block", sup.el),
          h("float-left block text-[80%]", sub.el),
          h("inline-block w-0", U_ZERO_WIDTH_SPACE),
        ),
      )
    } else {
      return h()
    }
  }

  render() {
    this.setEl(CmdSupSub.render(this.sub, this.sup))
  }

  /** Creates the given part, or returns the block if it already exists. */
  create(part: "sub" | "sup") {
    if (!this[part]) {
      ;(this as any)[part] = new Block(this)
      this.render()
    }
    return this[part]!
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    if (this.sup) {
      cursor.moveIn(this.sup, towards == L ? R : L)
    } else {
      cursor.moveTo(this, towards)
    }
  }

  moveOutOf(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards)
  }

  vertInto(dir: VDir): Block | undefined {
    return (dir == U ? this.sup : this.sub) || void 0
  }

  vertFromSide(dir: VDir): Block | undefined {
    return this.vertInto(dir)
  }

  vertOutOf(dir: VDir, block: Block, cursor: Cursor): Block | true | undefined {
    if (dir == U && block == this.sub) {
      if (this.sup) {
        return this.sup
      }
    } else if (dir == D && block == this.sup) {
      if (this.sub) {
        return this.sub
      }
    } else {
      return
    }

    // Move the cursor to some side of this `SupSub`

    // If cursor[R] == null && cursor.parent.parent[R] == null and so on through when cursor.parent.parent... == this, move to the right
    // Else, move to the left

    let el: Command | Cursor | null | undefined = cursor
    let moveToLeft = false
    while (el) {
      if (el[R] != null) {
        moveToLeft = true
        break
      }

      if (el == this) {
        break
      }

      el = el.parent?.parent
    }

    cursor.moveTo(this, moveToLeft ? L : R)
    return true
  }

  delete(cursor: Cursor, from: Dir): void {
    if (this.sub) {
      if (!this.sub.isEmpty()) {
        this.sub.ends[from]!.delete(cursor, from)
      }

      if (this.sub.isEmpty()) {
        ;(this as any).sub = null
        if (!this.sup) {
          this.remove()
          if (cursor[R] == this) {
            cursor.moveTo(this, R)
          }
        } else {
          this.render()
        }
      }

      return
    }

    if (this.sup) {
      if (!this.sup.isEmpty()) {
        cursor.moveIn(this.sup, from)
        return
      }
      ;(this as any).sup = null
    }

    if (cursor[R] == this) {
      cursor.moveTo(this, R)
    }
    this.remove()
    return
  }

  deleteBlock(cursor: Cursor, at: Dir, block: Block): void {
    if (block == this.sub) {
      cursor.moveTo(this, L)
      ;(this as any).sub = null
      this.render()
      cursor.insert(block, at == R ? L : R)
    } else {
      cursor.moveTo(this, R)
      ;(this as any).sup = null
      this.render()
      cursor.insert(block, at == R ? L : R)
    }

    if (!(this.sub || this.sup)) {
      if (cursor[R] == this) {
        cursor.moveTo(this, R)
      }
      this.remove()
    }
  }

  focus(x: number, y: number): Cursor {
    if (this.outside(x)) {
      return focusEdge(this, x)
    }

    const pr = +(
      getComputedStyle(this.el).paddingRight.match(/^(.+)px$/)?.[1] || 0
    )

    if (x > this.bounds()[1] - pr / 2) {
      return this.cursor(R)
    }

    if (this.sub && !this.sup) {
      return this.sub.focus(x, y)
    }

    if (this.sup && !this.sub) {
      return this.sup.focus(x, y)
    }

    if (!(this.sub && this.sup)) {
      return focusEdge(this, x)
    }

    if (this.sup.distanceToY(y) <= this.sub.distanceToY(y)) {
      return this.sup.focus(x, y)
    } else {
      return this.sub.focus(x, y)
    }
  }

  ir2(ret: IRBuilder): void {
    const last = ret.last()
    if (
      last?.leaf &&
      !last.prfx &&
      !last.sufx &&
      !last.infx &&
      last.leaf.type == "uvar"
    ) {
      if (this.sub) {
        if (last.leaf.data.sub) {
          issue(`Cannot have duplicate subscripts.`)
        }
        last.leaf.data.sub = subscript(this.sub.parse())
      }
      if (this.sup) {
        ret.suffixed({ type: "exponent", data: this.sup.parse() })
      }
      return
    }
    if (
      last?.prfx &&
      !last.infx &&
      !last.sufx &&
      !last.infx &&
      last.prfx.data.type == "sop"
    ) {
      if (this.sub) {
        if (last.prfx.data.data.sub) {
          issue(`Cannot have duplicate subscripts.`)
        }
        last.prfx.data.data.sub = this.sub.parse()
      }
      if (this.sup) {
        if (last.prfx.data.data.sup) {
          issue(`Cannot have duplicate supscripts.`)
        }
        last.prfx.data.data.sup = this.sup.parse()
      }
      return
    }

    if (this.sub) {
      throw new Error("Subscripts are not allowed here.")
    }
    if (this.sup) {
      ret.suffixed({ type: "exponent", data: this.sup.parse() })
    }
  }
}
