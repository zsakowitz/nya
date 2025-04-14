import type { Node } from "@/eval/ast/token"
import { L, R, type Dir, type VDir } from "@/field/dir"
import { h, path, svg } from "@/jsx"
import type { LatexParser } from "../../latex"
import {
  Block,
  Command,
  type Cursor,
  type InitProps,
  type InitRet,
  type Selection,
} from "../../model"

export class CmdRoot extends Command<
  [contents: Block] | [contents: Block, root: Block]
> {
  static init(cursor: Cursor, { input }: InitProps): InitRet {
    if (input == "\\nthroot") {
      const b1 = new Block(null)
      const b2 = new Block(null)
      new CmdRoot(b1, b2).insertAt(cursor, L)
      cursor.moveIn(b2, L)
      return
    }

    const b1 = new Block(null)
    new CmdRoot(b1, null).insertAt(cursor, L)
    cursor.moveIn(b1, L)
    return
  }

  static initOn(selection: Selection, { input }: InitProps): InitRet {
    const inner = selection.splice().unwrap()
    const b1 = input == "\\nthroot" ? new Block(null) : null
    const cursor = selection.cursor(R)
    new CmdRoot(inner, b1).insertAt(cursor, L)
    if (b1) {
      cursor.moveIn(b1, L)
    }
    return cursor
  }

  static fromLatex(_cmd: string, parser: LatexParser): Command {
    const root =
      parser.peek() == "[" ? (parser.argMaybe("["), parser.until("]")) : null
    const body = parser.arg()
    return new this(body, root)
  }

  static render(body: Block, root: Block | null) {
    if (root) {
      return h(
        "inline-block",
        h(
          "relative z-[1] ml-[.2em] mr-[-.6em] min-w-[.5em] align-[.8em] text-[80%]",
          root.el,
        ),
        h(
          "relative inline-block",
          h(
            "absolute bottom-[.15em] top-px inline-block w-[.95em]",
            svg(
              "0 0 32 54",
              path(
                "M0 33 L7 27 L12.5 47 L13 47 L30 0 L32 0 L13 54 L11 54 L4.5 31 L0 33",
              ),
            ),
          ),
          h(
            "ml-[.9em] mr-[.1em] mt-px inline-block h-max border-t border-t-current pl-[.15em] pr-[.2em] pt-px",
            body.el,
          ),
        ),
      )
    }

    return h(
      "relative inline-block",
      h(
        "absolute bottom-[.15em] top-px inline-block w-[.95em]",
        svg(
          "0 0 32 54",
          path(
            "M0 33 L7 27 L12.5 47 L13 47 L30 0 L32 0 L13 54 L11 54 L4.5 31 L0 33",
          ),
        ),
      ),
      h(
        "ml-[.9em] mr-[.1em] mt-px inline-block h-max border-t border-t-current pl-[.15em] pr-[.2em] pt-px",
        body.el,
      ),
    )
  }

  constructor(body: Block, root: Block | null) {
    super("\\sqrt", CmdRoot.render(body, root), root ? [body, root] : [body])
  }

  latex(): string {
    return `\\sqrt${this.blocks[1] ? `[${this.blocks[1].latex()}]` : ""}{${this.blocks[0].latex()}}`
  }

  ascii(): string {
    if (this.blocks[1]) {
      return `nthroot(${this.blocks[0].ascii()})(${this.blocks[1].ascii()})`
    } else {
      return `sqrt(${this.blocks[0].ascii()})`
    }
  }

  reader(): string {
    if (this.blocks[1]) {
      return `NthRoot, ${this.blocks[1].reader()} RootOf ${this.blocks[0].reader()}, EndNthRoot`
    } else {
      return `SquareRoot, ${this.blocks[0].reader()}, EndSquareRoot`
    }
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    if (towards == L) {
      cursor.moveIn(this.blocks[0], R)
    } else {
      cursor.moveIn(this.blocks[1] || this.blocks[0], L)
    }
  }

  moveOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    if (block == this.blocks[1]) {
      if (towards == R) {
        cursor.moveIn(this.blocks[0], L)
      } else {
        cursor.moveTo(this, L)
      }
    } else {
      if (towards == R) {
        cursor.moveTo(this, R)
      } else if (this.blocks[1]) {
        cursor.moveIn(this.blocks[1], R)
      } else {
        cursor.moveTo(this, L)
      }
    }
  }

  vertFromSide(): undefined {}

  vertInto(_: VDir, clientX: number): Block | undefined {
    if (this.blocks.length == 2) {
      const b1 = this.blocks[1].distanceTo(clientX)
      const b0 = this.blocks[0].distanceTo(clientX)
      if (b0 == 0) {
        return this.blocks[0]
      }
      if (b1 == 0) {
        return this.blocks[1]
      }
      const edge = this.distanceToEdge(clientX)
      if (Math.min(b0, b1, edge) == b0) {
        return this.blocks[0]
      }
      if (Math.min(b0, b1, edge) == b1) {
        return this.blocks[1]
      }
      return
    }

    const b0 = this.blocks[0].distanceTo(clientX)
    if (b0 == 0) {
      return this.blocks[0]
    }
    const edge = this.distanceToEdge(clientX)
    if (b0 <= edge) {
      return this.blocks[0]
    }
  }

  vertOutOf(): undefined {}

  tabInto(cursor: Cursor, towards: Dir): void {
    this.moveInto(cursor, towards)
  }

  tabOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    this.moveOutOf(cursor, towards, block)
  }

  delete(cursor: Cursor, from: Dir): void {
    if (from == R) {
      cursor.moveIn(this.blocks[0], R)
    } else {
      cursor.moveIn(this.blocks[1] || this.blocks[0], L)
    }
  }

  deleteBlock(cursor: Cursor, from: Dir, block: Block): void {
    if (this.blocks.length == 1) {
      cursor.moveTo(this, R)
      this.remove()

      if (from == L) {
        cursor.insert(this.blocks[0], R)
      } else {
        cursor.insert(this.blocks[0], L)
      }
      return
    }

    cursor.moveTo(this, R)
    this.remove()

    if (block == this.blocks[1] && from == L) {
      cursor.insert(this.blocks[0], R)
      cursor.insert(this.blocks[1], R)
    } else if (block == this.blocks[0] && from == R) {
      cursor.insert(this.blocks[1], L)
      cursor.insert(this.blocks[0], L)
    } else {
      cursor.insert(this.blocks[1], L)
      cursor.insert(this.blocks[0], R)
    }
  }

  focus(x: number, y: number): Cursor {
    if (this.blocks.length == 1) {
      const [lhs, rhs] = this.bounds()
      if (x <= lhs + this.em(0.45)) {
        return this.cursor(L)
      }
      if (x >= rhs - this.em(0.05)) {
        return this.cursor(R)
      }
      return this.blocks[0].focus(x, y)
    }

    const [rootLhs, rootRhs] = this.blocks[1].bounds()
    const [innerLhs, innerRhs] = this.blocks[0].bounds()

    if (rootLhs <= x) {
      if (x <= (rootRhs + innerLhs) / 2) {
        return this.blocks[1].focus(x, y)
      } else if (x <= innerRhs + this.em(0.05)) {
        return this.blocks[0].focus(x, y)
      } else {
        return this.cursor(R)
      }
    }

    const [lhs] = this.bounds()
    const edgeDist = x < lhs ? 0 : x - lhs
    const rootDist = rootLhs - x
    if (edgeDist < rootDist) {
      return this.cursor(L)
    } else {
      return this.blocks[1].focus(x, y)
    }
  }

  ir(tokens: Node[]): void {
    tokens.push({
      type: "root",
      root: this.blocks[1]?.ast(),
      contents: this.blocks[0].ast(),
    })
  }
}
