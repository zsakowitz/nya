import { h, p, svg } from "../jsx"
import { Block, Command, L, R, type Cursor, type Dir } from "../model"

const PARENS = {
  "[": {
    width: ".55em",
    latex: "[",
    html() {
      return svg("0 0 11 24", p("M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1"))
    },
  },
  "]": {
    width: ".55em",
    latex: "]",
    html() {
      return svg("0 0 11 24", p("M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1"))
    },
  },
  "(": {
    width: ".55em",
    latex: "(",
    html() {
      return svg(
        "3 0 106 186",
        p("M85 0 A61 101 0 0 0 85 186 L75 186 A75 101 0 0 1 75 0"),
      )
    },
  },
  ")": {
    width: ".55em",
    latex: ")",
    html() {
      return svg(
        "3 0 106 186",
        p("M24 0 A61 101 0 0 1 24 186 L34 186 A75 101 0 0 0 34 0"),
      )
    },
  },
  "{": {
    width: ".7em",
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
    width: ".7em",
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
}

export type ParenLhs = "(" | "[" | "{"
export type ParenRhs = ")" | "]" | "}"
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
  }[x]
}

export class CmdBrack extends Command<[Block]> {
  static createLeftOf(cursor: Cursor, input: string) {
    if (!cursor.parent) return

    if (input == "(" || input == "[" || input == "{") {
      const rhs = matchParen(input satisfies ParenLhs)

      const parent = cursor.parent.parent

      if (
        parent instanceof CmdBrack &&
        parent.rhs == rhs &&
        parent.side == R &&
        parent.parent
      ) {
        const block = cursor.span().extendTo(L).remove()
        parent.parent.attach(block, null, R)
        ;(parent as any).side = null // `.side` is only `readonly` in user code
        parent.checkSvg(L)
        // Repair cursor
        cursor.moveInside(parent.blocks[0], R)
        return
      }

      const span = cursor.span().extendTo(R)
      const brack = new CmdBrack(input, rhs, L, span.remove())
      // The `span.remove()` call invalidates the cursor, so we need
      // to fix it using the span (either side works, since it's empty)
      cursor.setTo(span.cursor(L))
      brack.insertAt(cursor, L)
      cursor.moveInside(brack.blocks[0], L)
    } else if (input == ")" || input == "]" || input == "}") {
      const lhs = matchParen(input satisfies ParenRhs)

      const parent = cursor.parent.parent

      if (
        parent instanceof CmdBrack &&
        parent.lhs == lhs &&
        parent.side == L &&
        parent.parent
      ) {
        const block = cursor.span().extendTo(R).remove()
        parent.parent.attach(block, null, L)
        ;(parent as any).side = null // `.side` is only `readonly` in user code
        parent.checkSvg(R)
        // Repair cursor
        cursor.moveTo(parent, R)
        return
      }

      const span = cursor.span().extendTo(L)
      const brack = new CmdBrack(lhs, input, R, span.remove())
      // The `span.remove()` call invalidates the cursor, so we need
      // to fix it using the span (either side works, since it's empty)
      cursor.setTo(span.cursor(R))
      brack.insertAt(cursor, R)
      cursor.moveTo(brack, R)
    }
  }

  constructor(
    readonly lhs: ParenLhs,
    readonly rhs: ParenRhs,
    readonly side: Dir | null,
    block: Block,
  ) {
    super(
      "\\left" + PARENS[lhs].latex,
      CmdBrack.render(lhs, rhs, side, block),
      [block],
    )
  }

  intoAsciiMath(): string {
    return this.lhs + this.blocks[0].intoAsciiMath() + this.rhs
  }

  intoLatex(): string {
    return `\\left${PARENS[this.lhs].latex}\\right${PARENS[this.rhs].latex}`
  }

  intoScreenReadable(): string {
    return `Bracket, ${this.lhs} ${this.blocks[0].intoScreenReadable()} , EndBracket ${this.rhs}`
  }

  checkSvg(side: Dir) {
    const symbol = PARENS[side == L ? this.lhs : this.rhs]
    const idx = side == L ? 0 : 2
    this.el.children[idx]!.replaceWith(
      h(
        "span",
        {
          style: "width:" + symbol.width,
          class:
            "absolute top-0 bottom-[2px] inline-block " +
            (side == L ? "left-0" : "right-0") +
            (this.side == side || this.side == null ? "" : " opacity-20"),
        },
        symbol.html(),
      ),
    )
  }

  static render(lhs: ParenLhs, rhs: ParenRhs, side: Dir | null, block: Block) {
    const lhsSymbol = PARENS[lhs]
    const rhsSymbol = PARENS[rhs]
    return h(
      // be set by createLeftOf or parser
      "span",
      "relative inline-block",
      h(
        "span",
        {
          style: "width:" + lhsSymbol.width,
          class:
            "left-0 absolute top-0 bottom-[2px] inline-block" +
            (side == R ? " opacity-20" : ""),
        },
        lhsSymbol.html(),
      ),
      h(
        "span",
        {
          style: `margin-left:${lhsSymbol.width};margin-right:${rhsSymbol.width}`,
          class: "my-[.1em] inline-block *:contents",
        },
        block.el,
      ),
      h(
        "span",
        {
          style: "width:" + rhsSymbol.width,
          class:
            "right-0 absolute top-0 bottom-[2px] inline-block" +
            (side == L ? " opacity-20" : ""),
        },
        rhsSymbol.html(),
      ),
    )
  }
}
