import type { Node } from "../../../eval/ast/token"
import { h, p, svg } from "../../../jsx"
import {
  Block,
  Command,
  L,
  R,
  Span,
  type Cursor,
  type Dir,
  type InitProps,
  type InitRet,
  type Selection,
} from "../../model"
import { CmdComma } from "../leaf/comma"

export const BRACKS = {
  "[": {
    w: "w-[.55em]",
    mx: "mx-[.55em]",
    size: 0.55,
    side: L,
    latex: "[",
    html() {
      return svg("0 0 11 24", p("M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1"))
    },
  },
  "]": {
    w: "w-[.55em]",
    mx: "mx-[.55em]",
    size: 0.55,
    side: R,
    latex: "]",
    html() {
      return svg("0 0 11 24", p("M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1"))
    },
  },
  "(": {
    w: "w-[.55em]",
    mx: "mx-[.55em]",
    size: 0.55,
    side: L,
    latex: "(",
    html() {
      return svg(
        "3 0 106 186",
        p("M85 0 A61 101 0 0 0 85 186 L75 186 A75 101 0 0 1 75 0"),
      )
    },
  },
  ")": {
    w: "w-[.55em]",
    mx: "mx-[.55em]",
    size: 0.55,
    side: R,
    latex: ")",
    html() {
      return svg(
        "3 0 106 186",
        p("M24 0 A61 101 0 0 1 24 186 L34 186 A75 101 0 0 0 34 0"),
      )
    },
  },
  "{": {
    w: "w-[.7em]",
    mx: "mx-[.7em]",
    size: 0.7,
    side: L,
    latex: "\\{",
    html() {
      return svg(
        "10 0 210 350",
        p(
          "M170 0 L170 6 A47 52 0 0 0 123 60 L123 127 A35 48 0 0 1 88 175 A35 48 0 0 1 123 223 L123 290 A47 52 0 0 0 170 344 L170 350 L160 350 A58 49 0 0 1 102 301 L103 220 A45 40 0 0 0 58 180 L58 170 A45 40 0 0 0 103 130 L103 49 A58 49 0 0 1 161 0",
        ),
      )
    },
  },
  "}": {
    w: "w-[.7em]",
    mx: "mx-[.7em]",
    size: 0.7,
    side: R,
    latex: "\\}",
    html() {
      return svg(
        "10 0 210 350",
        p(
          "M60 0 L60 6 A47 52 0 0 1 107 60 L107 127 A35 48 0 0 0 142 175 A35 48 0 0 0 107 223 L107 290 A47 52 0 0 1 60 344 L60 350 L70 350 A58 49 0 0 0 128 301 L127 220 A45 40 0 0 1 172 180 L172 170 A45 40 0 0 1 127 130 L127 49 A58 49 0 0 0 70 0",
        ),
      )
    },
  },
  "|": {
    w: "w-[.4em]",
    mx: "mx-[.4em]",
    size: 0.4,
    side: null,
    latex: "|",
    html() {
      return svg("0 0 10 54", p("M4.4 0 L4.4 54 L5.6 54 L5.6 0"))
    },
  },
  "¡": {
    w: "w-[.4em]",
    mx: "mx-[.4em]",
    size: 0.4,
    side: L,
    latex: "¡",
    html() {
      return svg(
        "-10 0 30.645 71.583",
        p(
          "M 0.049 66.504 L 3.907 20.899 A 6.07 6.07 0 0 1 4.016 20.152 Q 4.191 19.348 4.574 18.989 A 1.056 1.056 0 0 1 5.323 18.702 A 1.09 1.09 0 0 1 6.295 19.289 Q 6.642 19.863 6.739 20.997 L 10.596 66.504 L 10.596 66.993 Q 10.596 68.946 9.131 70.215 A 5.821 5.821 0 0 1 5.323 71.583 A 5.821 5.821 0 0 1 1.514 70.215 A 4.051 4.051 0 0 1 0.058 67.294 A 5.005 5.005 0 0 1 0.049 66.993 L 0.049 66.504 Z M 9.033 1.515 A 5.119 5.119 0 0 0 5.323 0.001 A 6.136 6.136 0 0 0 5.254 0.001 A 5.12 5.12 0 0 0 1.563 1.563 A 6.317 6.317 0 0 0 1.514 1.612 A 5.089 5.089 0 0 0 0 5.298 A 5.273 5.273 0 0 0 0.268 6.993 A 5.234 5.234 0 0 0 1.563 9.034 A 6.247 6.247 0 0 0 1.612 9.082 A 5.119 5.119 0 0 0 5.323 10.596 A 6.136 6.136 0 0 0 5.391 10.596 A 5.12 5.12 0 0 0 9.082 9.034 A 6.317 6.317 0 0 0 9.131 8.985 A 5.089 5.089 0 0 0 10.645 5.298 A 5.273 5.273 0 0 0 10.377 3.604 A 5.234 5.234 0 0 0 9.082 1.563 A 6.247 6.247 0 0 0 9.033 1.515 Z",
        ),
      )
    },
  },
  "!": {
    w: "w-[.4em]",
    mx: "mx-[.4em]",
    size: 0.4,
    side: R,
    latex: "!",
    html() {
      return svg(
        "-10 0 30.645 71.583",
        p(
          "M 3.907 50.586 L 0.049 5.078 L 0.049 4.59 Q 0.049 2.637 1.514 1.367 A 5.821 5.821 0 0 1 5.323 0 A 5.821 5.821 0 0 1 9.131 1.367 A 4.051 4.051 0 0 1 10.587 4.289 A 5.005 5.005 0 0 1 10.596 4.59 L 10.596 5.078 L 6.739 50.684 A 6.07 6.07 0 0 1 6.629 51.431 Q 6.455 52.235 6.072 52.594 A 1.056 1.056 0 0 1 5.323 52.881 A 1.09 1.09 0 0 1 4.35 52.294 Q 4.003 51.72 3.907 50.586 Z M 9.033 62.501 A 5.119 5.119 0 0 0 5.323 60.987 A 6.136 6.136 0 0 0 5.254 60.987 A 5.12 5.12 0 0 0 1.563 62.549 A 6.317 6.317 0 0 0 1.514 62.598 A 5.089 5.089 0 0 0 0 66.284 A 5.273 5.273 0 0 0 0.268 67.979 A 5.234 5.234 0 0 0 1.563 70.02 A 6.247 6.247 0 0 0 1.612 70.068 A 5.119 5.119 0 0 0 5.323 71.582 A 6.136 6.136 0 0 0 5.391 71.582 A 5.12 5.12 0 0 0 9.082 70.02 A 6.317 6.317 0 0 0 9.131 69.971 A 5.089 5.089 0 0 0 10.645 66.284 A 5.273 5.273 0 0 0 10.377 64.59 A 5.234 5.234 0 0 0 9.082 62.549 A 6.247 6.247 0 0 0 9.033 62.501 Z",
        ),
      )
    },
  },
} satisfies Record<
  ParenLhs | ParenRhs,
  {
    w: `w-${string}`
    mx: `mx-${string}`
    size: number
    side: Dir | null
    latex: string
    html(): SVGSVGElement
  }
>
Object.setPrototypeOf(BRACKS, null)

export type ParenLhs = "(" | "[" | "{" | "|" | "¡"
export type ParenRhs = ")" | "]" | "}" | "|" | "!"
export type ParenAny = ParenLhs | ParenRhs

export function matchParen(x: ParenLhs): ParenRhs
export function matchParen(x: ParenRhs): ParenLhs
export function matchParen(x: ParenAny): ParenAny
export function matchParen(x: ParenAny) {
  return {
    "(": ")",
    "[": "]",
    "{": "}",
    ")": "(",
    "]": "[",
    "}": "{",
    "|": "|",
    "!": "¡",
    "¡": "!",
  }[x]
}

function is(brack: string, dir: typeof L): brack is ParenLhs
function is(brack: string, dir: typeof R): brack is ParenRhs
function is(brack: string, dir: Dir): boolean
function is(brack: string, dir: Dir) {
  if (!{}.hasOwnProperty.call(BRACKS, brack)) return false
  const { side } = BRACKS[brack as ParenAny]
  return side == dir || side == null
}

export class CmdBrack extends Command<[Block]> {
  static init(cursor: Cursor, { input }: InitProps) {
    if (!cursor.parent) return

    if (is(input, L)) {
      const rhs = matchParen(input satisfies ParenLhs)

      if (
        cursor[R] instanceof CmdBrack &&
        cursor[R].side == R &&
        cursor[R].lhs == input &&
        cursor[R].rhs == rhs
      ) {
        cursor[R].setSide(null)
        cursor.moveIn(cursor[R].blocks[0], L)
        return
      }

      const parent = cursor.parent.parent

      if (
        parent instanceof CmdBrack &&
        parent.rhs == rhs &&
        parent.side == R &&
        parent.parent
      ) {
        const block = cursor.span().extendToEnd(L).splice()
        parent.parent.attach(block, null, R)
        parent.setSide(null)
        // Repair cursor
        cursor.moveIn(parent.blocks[0], R)
        return
      }
    }

    if (is(input, R)) {
      const lhs = matchParen(input satisfies ParenRhs)

      if (
        cursor[L] instanceof CmdBrack &&
        cursor[L].side == L &&
        cursor[L].lhs == lhs &&
        cursor[L].rhs == input
      ) {
        cursor[L].setSide(null)
        return
      }

      const parent = cursor.parent.parent

      if (
        parent instanceof CmdBrack &&
        parent.lhs == lhs &&
        parent.side == L &&
        parent.parent
      ) {
        const block = cursor.span().extendToEnd(R).splice()
        parent.parent.attach(block, null, L)
        parent.setSide(null)
        // Repair cursor
        cursor.moveTo(parent, R)
        return
      }
    }

    if (is(input, L)) {
      const rhs = matchParen(input satisfies ParenLhs)
      const span = cursor.span().extendToEnd(R)
      const brack = new CmdBrack(input, rhs, L, span.splice())
      // The `span.remove()` call invalidates the cursor, so we need
      // to fix it using the span (either side works, since it's empty)
      cursor.setTo(span.cursor(L))
      brack.insertAt(cursor, L)
      cursor.moveIn(brack.blocks[0], L)
      return
    }

    if (is(input, R)) {
      const lhs = matchParen(input satisfies ParenRhs)
      const span = cursor.span().extendToEnd(L)
      const brack = new CmdBrack(lhs, input, R, span.splice())
      // The `span.remove()` call invalidates the cursor, so we need
      // to fix it using the span (either side works, since it's empty)
      cursor.setTo(span.cursor(R))
      brack.insertAt(cursor, R)
      cursor.moveTo(brack, R)
      return
    }
  }

  static initOn(selection: Selection, { input }: InitProps): InitRet {
    if (!(is(input, L) || is(input, R))) {
      return
    }

    const block = selection.splice()
    const cursor = selection.cursor(R)

    if (is(input, L)) {
      const brack = new CmdBrack(input, matchParen(input), null, block)
      brack.insertAt(cursor, L)
      cursor.moveIn(block, L)
    } else {
      const brack = new CmdBrack(matchParen(input), input, null, block)
      brack.insertAt(cursor, L)
    }

    return cursor
  }

  static render(
    lhs: ParenLhs,
    rhs: ParenRhs,
    side: Dir | null,
    block: { el: HTMLSpanElement },
  ) {
    const lhsSymbol = BRACKS[lhs]
    const rhsSymbol = BRACKS[rhs]
    return h(
      "relative inline-block nya-cmd-brack",
      h(
        "left-0 absolute top-0 bottom-[2px] inline-block" +
          (side == R ? " opacity-20" : "") +
          " " +
          lhsSymbol.w,

        lhsSymbol.html(),
      ),
      h("my-[.1em] inline-block *:contents " + lhsSymbol.mx, block.el),
      h(
        "right-0 absolute top-0 bottom-[2px] inline-block " +
          rhsSymbol.w +
          (side == L ? " opacity-20" : ""),
        rhsSymbol.html(),
      ),
    )
  }

  constructor(
    readonly lhs: ParenLhs,
    readonly rhs: ParenRhs,
    readonly side: Dir | null,
    block: Block,
  ) {
    super(
      "\\left" + BRACKS[lhs].latex,
      CmdBrack.render(lhs, rhs, side, block),
      [block],
    )
  }

  setSide(side: Dir | null) {
    ;(this as any).side = side
    this.checkSvg(L)
    this.checkSvg(R)
  }

  ascii(): string {
    return this.lhs + this.blocks[0].ascii() + this.rhs
  }

  latex(): string {
    return `\\left${BRACKS[this.lhs].latex}${this.blocks[0].latex()}\\right${BRACKS[this.rhs].latex}`
  }

  reader(): string {
    return `Bracket, ${this.lhs} ${this.blocks[0].reader()} , EndBracket ${this.rhs}`
  }

  checkSvg(side: Dir) {
    const symbol = BRACKS[side == L ? this.lhs : this.rhs]
    const idx = side == L ? 0 : 2
    this.el.children[idx]!.replaceWith(
      h(
        "absolute top-0 bottom-[2px] inline-block " +
          symbol.w +
          " " +
          (side == L ? "left-0" : "right-0") +
          (this.side == side || this.side == null ? "" : " opacity-20"),
        symbol.html(),
      ),
    )
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveIn(this.blocks[0], towards == R ? L : R)
  }

  moveOutOf(cursor: Cursor, towards: Dir, _block: Block): void {
    cursor.moveTo(this, towards)
  }

  vertInto(): Block | undefined {
    return this.blocks[0]
  }

  vertFromSide(): undefined {}

  vertOutOf(): undefined {}

  delete(cursor: Cursor, from: Dir): void {
    if (this.side == from) {
      cursor.moveTo(this, R)
      this.remove()
      cursor.insert(this.blocks[0], from == L ? R : L)
    } else {
      this.setSide(from == L ? R : L)
      this.checkSvg(from)
      const spliced = new Span(this.parent, this, null).splice()
      cursor.moveIn(this.blocks[0], from)
      cursor.insert(spliced, from)
    }
  }

  deleteBlock(cursor: Cursor, at: Dir): void {
    cursor.moveTo(this, R)
    this.remove()
    cursor.insert(this.blocks[0], at == L ? R : L)
  }

  isTransparentWrapper(): boolean {
    return (
      this.lhs == "(" &&
      this.rhs == ")" &&
      !this.blocks[0].some((x) => x instanceof CmdComma)
    )
  }

  focus(x: number, y: number): Cursor {
    const [lhs, rhs] = this.bounds()
    if (x < lhs + this.em(BRACKS[this.lhs].size / 2)) {
      return this.cursor(L)
    }
    if (x > rhs - this.em(BRACKS[this.rhs].size / 2)) {
      return this.cursor(R)
    }

    return this.blocks[0].focus(x, y)
  }

  ir(tokens: Node[]): void {
    tokens.push({
      type: "group",
      lhs: this.lhs,
      rhs: this.rhs,
      value: this.blocks[0].ast(),
    })
  }

  onSiblingChange(dir: Dir): void {
    if (dir == R && this.side == L && this[R]) {
      this.setSide(null)
    } else if (dir == L && this.side == R && this[L]) {
      this.setSide(null)
    }
  }
}
