import { P } from "@/eval2/prec"
import { L, R, type Dir } from "@/field/dir"
import { h, path, svg, svgx } from "@/jsx"
import type { LatexParser } from "../../latex"
import {
  Block,
  Command,
  Span,
  type Cursor,
  type InitProps,
  type InitRet,
  type IRBuilder,
  type Selection,
} from "../../model"
import { CmdComma } from "../leaf/comma"
import { CmdNum } from "../leaf/num"
import { CmdUnknown } from "../leaf/unknown"

export const BRACKS = {
  "[": {
    w: "w-[.55em]",
    mx: "ml-[.55em]",
    size: 0.55,
    side: L,
    latex: "[",
    html() {
      return svg(
        "0 0 11 24",
        path("M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1"),
      )
    },
  },
  "]": {
    w: "w-[.55em]",
    mx: "mr-[.55em]",
    size: 0.55,
    side: R,
    latex: "]",
    html() {
      return svg(
        "0 0 11 24",
        path("M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1"),
      )
    },
  },
  "(": {
    w: "w-[.55em]",
    mx: "ml-[.55em]",
    size: 0.55,
    side: L,
    latex: "(",
    html() {
      return svg(
        "3 0 106 186",
        path("M85 0 A61 101 0 0 0 85 186 L75 186 A75 101 0 0 1 75 0"),
      )
    },
  },
  ")": {
    w: "w-[.55em]",
    mx: "mr-[.55em]",
    size: 0.55,
    side: R,
    latex: ")",
    html() {
      return svg(
        "3 0 106 186",
        path("M24 0 A61 101 0 0 1 24 186 L34 186 A75 101 0 0 0 34 0"),
      )
    },
  },
  "{": {
    w: "w-[.7em]",
    mx: "ml-[.7em]",
    size: 0.7,
    side: L,
    latex: "\\{",
    html() {
      return svg(
        "10 0 210 350",
        path(
          "M170 0 L170 6 A47 52 0 0 0 123 60 L123 127 A35 48 0 0 1 88 175 A35 48 0 0 1 123 223 L123 290 A47 52 0 0 0 170 344 L170 350 L160 350 A58 49 0 0 1 102 301 L103 220 A45 40 0 0 0 58 180 L58 170 A45 40 0 0 0 103 130 L103 49 A58 49 0 0 1 161 0",
        ),
      )
    },
  },
  "}": {
    w: "w-[.7em]",
    mx: "mr-[.7em]",
    size: 0.7,
    side: R,
    latex: "\\}",
    html() {
      return svg(
        "10 0 210 350",
        path(
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
      return svg("0 0 10 54", path("M4.4 0 L4.4 54 L5.6 54 L5.6 0"))
    },
  },
  "¡": {
    w: "w-[.4em]",
    mx: "ml-[.4em]",
    size: 0.4,
    side: L,
    latex: "¡",
    html() {
      return svg(
        "-10 0 30.645 71.583",
        path(
          "M 0.049 66.504 L 3.907 20.899 A 6.07 6.07 0 0 1 4.016 20.152 Q 4.191 19.348 4.574 18.989 A 1.056 1.056 0 0 1 5.323 18.702 A 1.09 1.09 0 0 1 6.295 19.289 Q 6.642 19.863 6.739 20.997 L 10.596 66.504 L 10.596 66.993 Q 10.596 68.946 9.131 70.215 A 5.821 5.821 0 0 1 5.323 71.583 A 5.821 5.821 0 0 1 1.514 70.215 A 4.051 4.051 0 0 1 0.058 67.294 A 5.005 5.005 0 0 1 0.049 66.993 L 0.049 66.504 Z M 9.033 1.515 A 5.119 5.119 0 0 0 5.323 0.001 A 6.136 6.136 0 0 0 5.254 0.001 A 5.12 5.12 0 0 0 1.563 1.563 A 6.317 6.317 0 0 0 1.514 1.612 A 5.089 5.089 0 0 0 0 5.298 A 5.273 5.273 0 0 0 0.268 6.993 A 5.234 5.234 0 0 0 1.563 9.034 A 6.247 6.247 0 0 0 1.612 9.082 A 5.119 5.119 0 0 0 5.323 10.596 A 6.136 6.136 0 0 0 5.391 10.596 A 5.12 5.12 0 0 0 9.082 9.034 A 6.317 6.317 0 0 0 9.131 8.985 A 5.089 5.089 0 0 0 10.645 5.298 A 5.273 5.273 0 0 0 10.377 3.604 A 5.234 5.234 0 0 0 9.082 1.563 A 6.247 6.247 0 0 0 9.033 1.515 Z",
        ),
      )
    },
  },
  "!": {
    w: "w-[.4em]",
    mx: "mr-[.4em]",
    size: 0.4,
    side: R,
    latex: "!",
    html() {
      return svg(
        "-10 0 30.645 71.583",
        path(
          "M 3.907 50.586 L 0.049 5.078 L 0.049 4.59 Q 0.049 2.637 1.514 1.367 A 5.821 5.821 0 0 1 5.323 0 A 5.821 5.821 0 0 1 9.131 1.367 A 4.051 4.051 0 0 1 10.587 4.289 A 5.005 5.005 0 0 1 10.596 4.59 L 10.596 5.078 L 6.739 50.684 A 6.07 6.07 0 0 1 6.629 51.431 Q 6.455 52.235 6.072 52.594 A 1.056 1.056 0 0 1 5.323 52.881 A 1.09 1.09 0 0 1 4.35 52.294 Q 4.003 51.72 3.907 50.586 Z M 9.033 62.501 A 5.119 5.119 0 0 0 5.323 60.987 A 6.136 6.136 0 0 0 5.254 60.987 A 5.12 5.12 0 0 0 1.563 62.549 A 6.317 6.317 0 0 0 1.514 62.598 A 5.089 5.089 0 0 0 0 66.284 A 5.273 5.273 0 0 0 0.268 67.979 A 5.234 5.234 0 0 0 1.563 70.02 A 6.247 6.247 0 0 0 1.612 70.068 A 5.119 5.119 0 0 0 5.323 71.582 A 6.136 6.136 0 0 0 5.391 71.582 A 5.12 5.12 0 0 0 9.082 70.02 A 6.317 6.317 0 0 0 9.131 69.971 A 5.089 5.089 0 0 0 10.645 66.284 A 5.273 5.273 0 0 0 10.377 64.59 A 5.234 5.234 0 0 0 9.082 62.549 A 6.247 6.247 0 0 0 9.033 62.501 Z",
        ),
      )
    },
  },
} satisfies Record<
  ParenLhs | ParenRhs,
  {
    w: `w-${string}`
    mx: `m${"l" | "r" | "x"}-${string}`
    size: number
    side: Dir | null
    latex: string
    html(): SVGSVGElement
  }
>
Object.setPrototypeOf(BRACKS, null)

export function barPlain(className: string) {
  return svgx("0 0 10 54", className, path("M4.4 0 L4.4 54 L5.6 54 L5.6 0"))
}

export type ParenLhs = "(" | "[" | "{" | "|" | "¡"
export type ParenRhs = ")" | "]" | "}" | "|" | "!"
type ParenAny = ParenLhs | ParenRhs

function matchParen(x: ParenLhs): ParenRhs
function matchParen(x: ParenRhs): ParenLhs
function matchParen(x: ParenAny): ParenAny
function matchParen(x: ParenAny) {
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
  static index(index: number) {
    const inner = new Block(null)
    const brack = new CmdBrack("[", "]", null, inner)
    const cursor = inner.cursor(R)
    for (const digit of BigInt(index).toString()) {
      new CmdNum(digit).insertAt(cursor, L)
    }
    return brack
  }

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
      "relative inline-block nya-cmd-brack" +
        (lhs == "(" && rhs == ")" ? " nya-cmd-paren" : ""),
      h(
        "left-0 absolute top-0 bottom-[2px] inline-block" +
          (side == R ? " opacity-20" : "") +
          " " +
          lhsSymbol.w,

        lhsSymbol.html(),
      ),
      h(
        `my-[.1em] inline-block *:contents ${lhsSymbol.mx} ${rhsSymbol.mx}`,
        block.el,
      ),
      h(
        "right-0 absolute top-0 bottom-[2px] inline-block " +
          rhsSymbol.w +
          (side == L ? " opacity-20" : ""),
        rhsSymbol.html(),
      ),
    )
  }

  static fromLatex(cmd: string, parser: LatexParser): Command {
    if (cmd == "\\left") {
      const lhsRaw = parser.peek()
      const lhs =
        (
          lhsRaw &&
          lhsRaw in BRACKS &&
          BRACKS[lhsRaw as keyof typeof BRACKS].side != R
        ) ?
          ((parser.i += lhsRaw.length), lhsRaw as ParenLhs)
        : (
          lhsRaw &&
          lhsRaw.length >= 2 &&
          lhsRaw[0] == "\\" &&
          lhsRaw.slice(1) in BRACKS &&
          BRACKS[lhsRaw.slice(1) as keyof typeof BRACKS].side != R
        ) ?
          ((parser.i += lhsRaw.length), lhsRaw.slice(1) as ParenLhs)
        : null

      let contents: Block | undefined
      let surrealLhsContents: Block | undefined
      if (lhs == "{") {
        const [contents1, end] = parser.untilAny(["\\right", "\\middle"])
        if (end == "\\middle" && parser.peek() == "|") {
          parser.i++ // consume the bar
          surrealLhsContents = contents1
        } else {
          contents = contents1
        }
      }

      contents ??= parser.until("\\right")
      const rhsRaw = parser.peek()
      const rhs =
        (
          rhsRaw &&
          rhsRaw in BRACKS &&
          BRACKS[rhsRaw as keyof typeof BRACKS].side != L
        ) ?
          ((parser.i += rhsRaw.length), rhsRaw as ParenRhs)
        : (
          rhsRaw &&
          rhsRaw.length >= 2 &&
          rhsRaw[0] == "\\" &&
          rhsRaw.slice(1) in BRACKS &&
          BRACKS[rhsRaw.slice(1) as keyof typeof BRACKS].side != L
        ) ?
          ((parser.i += rhsRaw.length), rhsRaw.slice(1) as ParenRhs)
        : null
      if (surrealLhsContents) {
        return new CmdSurreal(surrealLhsContents, contents)
      } else if (lhs && rhs) {
        return new CmdBrack(lhs, rhs, null, contents)
      } else if (lhs) {
        return new CmdBrack(lhs, matchParen(lhs), null, contents)
      } else if (rhs) {
        return new CmdBrack(matchParen(rhs), rhs, null, contents)
      } else {
        return new CmdBrack("(", ")", null, contents)
      }
    }

    if (is(cmd, L)) {
      const lhs = cmd
      const rhs = matchParen(lhs)
      const contents = parser.until(rhs)
      return new CmdBrack(lhs, rhs, null, contents)
    }

    return new CmdUnknown(cmd)
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

  ir2(ret: IRBuilder): void {
    const last = ret.last()
    if (this.lhs == "(" && this.rhs == ")") {
      if (
        last?.leaf?.type == "uvar" &&
        !last.prfx &&
        !last.infx &&
        !last.sufx
      ) {
        ret.ir.pop()
        ret.leaf({
          type: "ucall",
          data: { name: last.leaf.data, arg: this.blocks[0].parse() },
        })
        return
      }

      if (
        last?.prfx?.data.type == "sop" &&
        last.prfx.pl == P.ImplicitFnL &&
        last.prfx.pr == P.ImplicitFnR &&
        !last.infx &&
        !last.leaf &&
        !last.sufx
      ) {
        ret.ir.pop()
        ret.leaf({
          type: "bcall",
          data: {
            name: {
              name: last.prfx.data.data.name,
              sub: last.prfx.data.data.sub,
            },
            sup: last.prfx.data.data.sup,
            arg: this.blocks[0].parse(),
          },
        })
        return
      }
    }

    ret.leaf({
      type: "group",
      data: {
        lhs: this.lhs,
        rhs: this.rhs,
        contents: this.blocks[0].parse(),
      },
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

export class CmdSurreal extends Command<[Block, Block]> {
  static fromLatex(_cmd: string, parser: LatexParser): Command {
    const lhs = parser.arg()
    const rhs = parser.arg()
    return new CmdSurreal(lhs, rhs)
  }

  static init(cursor: Cursor, _props: InitProps): InitRet {
    new CmdSurreal(new Block(null), new Block(null)).insertAt(cursor, L)
  }

  static render(lhs: Block, rhs: Block) {
    const lhsSymbol = BRACKS["{"]
    const rhsSymbol = BRACKS["}"]
    const barSymbol = BRACKS["|"]
    return h(
      "inline-flex",
      h("relative inline-block " + lhsSymbol.w, lhsSymbol.html()),
      h("self-baseline my-[.1em] *:contents", lhs.el),
      h("relative inline-block " + barSymbol.w, barSymbol.html()),
      h("self-baseline my-[.1em] *:contents", rhs.el),
      h("relative inline-block " + rhsSymbol.w, rhsSymbol.html()),
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
    const [lhs, rhs] = this.bounds()
    if (x < lhs + this.em(BRACKS["{"].size / 2)) {
      return this.cursor(L)
    }
    if (x > rhs - this.em(BRACKS["}"].size / 2)) {
      return this.cursor(R)
    }
    const d0 = this.blocks[0].distanceTo(x)
    const d1 = this.blocks[1].distanceTo(x)
    return d0 <= d1 ? this.blocks[0].focus(x, y) : this.blocks[1].focus(x, y)
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
