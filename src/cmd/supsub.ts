import { U_ZERO_WIDTH_SPACE, h, t } from "../jsx"
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
} from "../model"

export class CmdSupSub extends Command {
  static init(cursor: Cursor, input: string) {
    if (input == "^") {
      const prev = cursor[L]
      if (prev instanceof CmdSupSub) {
        cursor.moveIn(prev.create("sup"), R)
        return
      }

      const next = cursor[R]
      if (next instanceof CmdSupSub) {
        cursor.moveIn(next.create("sup"), L)
        return
      }

      const block = new Block(null)
      new CmdSupSub(null, block).insertAt(cursor, L)
      cursor.moveIn(block, R)
    } else if (input == "_") {
      const prev = cursor[L]
      if (prev instanceof CmdSupSub) {
        cursor.moveIn(prev.create("sub"), R)
        return
      }

      const next = cursor[R]
      if (next instanceof CmdSupSub) {
        cursor.moveIn(next.create("sub"), L)
        return
      }

      const block = new Block(null)
      new CmdSupSub(block, null).insertAt(cursor, L)
      cursor.moveIn(block, R)
    }
  }

  constructor(
    readonly sub: Block | null,
    readonly sup: Block | null,
  ) {
    super(
      sub ? "_" : "^",
      CmdSupSub.html(sub, sup),
      [sub, sup].filter((x) => x != null),
    )
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

  static html(sub: Block | null, sup: Block | null) {
    if (sup && !sub) {
      return h(
        "",
        h(
          "mb-[-.2em] inline-block text-left align-[.5em] text-[90%] [.bg-blue-200>&]:bg-blue-200",
          h("inline-block align-text-bottom", sup.el),
        ),
      )
    } else if (sub && !sup) {
      return h(
        "",
        h(
          "mb-[-.2em] inline-block text-left align-[-.5em] text-[90%] [.bg-blue-200>&]:bg-blue-200",
          h("float-left block text-[80%]", sub.el),
          h("inline-block w-0", t(U_ZERO_WIDTH_SPACE)),
        ),
      )
    } else if (sub && sup) {
      return h(
        "",
        h(
          "mb-[-.2em] inline-block text-left align-[-.5em] text-[90%] [.bg-blue-200>&]:bg-blue-200",
          h("block", sup.el),
          h("float-left block text-[80%]", sub.el),
          h("inline-block w-0", t(U_ZERO_WIDTH_SPACE)),
        ),
      )
    } else {
      return h()
    }
  }

  /** Creates the given part, or returns the block if it already exists. */
  create(part: "sub" | "sup") {
    if (!this[part]) {
      ;(this as any)[part] = new Block(this)
      const next = CmdSupSub.html(this.sub, this.sup)
      this.el.replaceWith(next)
      ;(this as any).el = next
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
      if (this.sub.ends[from]) {
        this.sub.ends[from].delete(cursor, from)
        if (this.sub.ends[from] != null) {
          return
        }
      } else if (this.sup) {
        // the `readonly` is for outside users
        ;(this as any).sub = null
        const next = CmdSupSub.html(this.sub, this.sup)
        this.el.replaceWith(next)
        ;(this as any).el = next
        return
      }
    }

    if (this.sup) {
      if (this.sup.ends[from]) {
        cursor.moveIn(this.sup, from)
      } else if (this.sub) {
        // the `readonly` is for outside users
        ;(this as any).sup = null
        const next = CmdSupSub.html(this.sub, this.sup)
        this.el.replaceWith(next)
        ;(this as any).el = next
      }
    }

    cursor.moveTo(this, R)
    this.remove()
  }
}
