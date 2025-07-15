import { CmdDot, CmdNum, CmdVar } from "@/field/cmd/leaf/num"
import { OpCdot } from "@/field/cmd/leaf/op"
import {
  CmdBrack,
  CmdSurreal,
  type ParenLhs,
  type ParenRhs,
} from "@/field/cmd/math/brack"
import { CmdFrac } from "@/field/cmd/math/frac"
import { CmdRoot } from "@/field/cmd/math/root"
import { CmdSupSub } from "@/field/cmd/math/supsub"
import { options } from "@/field/defaults"
import { L, R } from "@/field/dir"
import type { Field } from "@/field/field"
import { LatexParser } from "@/field/latex"
import { Block, type Command } from "@/field/model"
import { fa, h, hx } from "@/jsx"
import { faCopy, faPaste } from "@fortawesome/free-regular-svg-icons"
import { faCut, type IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft"
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight"
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons/faAnglesLeft"
import { faAnglesRight } from "@fortawesome/free-solid-svg-icons/faAnglesRight"
import { faArrowPointer } from "@fortawesome/free-solid-svg-icons/faArrowPointer"
import { faArrowsLeftRight } from "@fortawesome/free-solid-svg-icons/faArrowsLeftRight"
import { faGears } from "@fortawesome/free-solid-svg-icons/faGears"

const parser = new LatexParser(options, null, "")

function key(base?: string | Node, clsx?: string, active?: boolean) {
  const contents =
    typeof base == "string" ?
      h("font-['Symbola'] last:*:*:*:pr-0", parser.run(base).el)
    : (base ?? "")

  return hx(
    "button",
    "flex rounded-sm h-[36px] sm:h-[40px] text-center items-center justify-center [line-height:1] relative " +
      (active ?
        "text-[--nya-kbd-key-active-text] bg-[--nya-kbd-key-active-bg] fill-[--nya-kbd-key-active-text]"
      : "text-[--nya-kbd-key-text] bg-[--nya-kbd-key-bg] fill-[--nya-kbd-key-text] hover:bg-[--nya-kbd-key-hover-bg]") +
      (clsx ? " " + clsx : ""),
    h("font-['Symbola'] pointer-events-none", contents),
    h("absolute -inset-0.5"),
  )
}

export const CANCEL_CHANGES = Symbol()

export type KeyActionReturn =
  | Block // block to be inserted left of cursor
  | Command // command to be inserted left of cursor
  | string // latex
  | void // this command wrote its output already
  | typeof CANCEL_CHANGES // this command did not modify anything

export type KeyAction =
  | string
  | ((field: Field) => Block | Command | string | void | typeof CANCEL_CHANGES)

type Size = keyof typeof span

type OneOf<T> = {
  [K in keyof T]: Record<K, T[K]> &
    Partial<Record<Exclude<keyof T, K>, undefined>>
}[keyof T]

type Contents = OneOf<{
  latex: string
  text: string
  icon: IconDefinition
}>

export type Key =
  | string // shortcut for 4-width, latex, typed is same as written
  | (Contents & { size?: Size; clsx?: string; active?: boolean }) // normal key
  | Size // spacer

export type ActionKey =
  | string
  | (Contents & {
      action: KeyAction
      size?: Size
      clsx?: string
      active?: boolean
    })
  | ({ latex: string } & {
      action?: KeyAction
      size?: Size
      clsx?: string
      active?: boolean
    })
  | Size

const span = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
}

export function keyFrom(k: Key) {
  if (typeof k == "string") {
    return key(k, "col-span-4")
  }

  if (typeof k == "number") {
    return h(span[k])
  }

  if (k == null) {
    return key(undefined, "col-span-4 text-sm")
  }

  return key(
    k.latex ??
      (k.text ? h("font-[system-ui]", k.text)
      : k.icon ? fa(k.icon, "size-4")
      : h("")),
    span[k.size ?? 4] + " " + k.clsx,
    k.active,
  )
}

const kSqrt: ActionKey = {
  latex: "\\sqrt{\\nyafiller}",
  action: wrapper((x) => new CmdRoot(x, null)),
}

const kRoot: ActionKey = {
  latex: "\\sqrt[b]{\\nyafillersmall}",
  action: wrapper((x) => new CmdRoot(new Block(null), x)),
}

export const CONTROLS = {
  shift: { size: 5, text: "⇧" },
  backspace: {
    size: 5,
    text: "⌫",
    action(field) {
      field.type("Backspace", { skipChangeHandlers: true })
    },
  },
  abc: {
    size: 5,
    latex: "\\digit{ABC}",
    clsx: "text-sm/[1]",
  },
  sym: {
    size: 5,
    latex: "\\digit{∑}f",
    clsx: "[letter-spacing:.1em] pl-0.5",
  },
  arrowL: {
    size: 5,
    text: "←",
    action(field) {
      if (field.sel.isCursor()) {
        const c = field.sel.cursor(L)
        if (c.move(L)) {
          field.sel = c.selection()
        } else {
          field.onMoveOut?.(L)
        }
      } else {
        field.sel = field.sel.cursor(L).selection()
      }
    },
  },
  arrowR: {
    size: 5,
    text: "→",
    action(field) {
      if (field.sel.isCursor()) {
        const c = field.sel.cursor(R)
        if (c.move(R)) {
          field.sel = c.selection()
        } else {
          field.onMoveOut?.(R)
        }
      } else {
        field.sel = field.sel.cursor(R).selection()
      }
    },
  },
  cursor: { size: 4, icon: faArrowPointer },
  opts: { size: 4, icon: faGears, clsx: "opacity-30" },
  enter: { size: 10, text: "⏎" },
} satisfies Record<string, Key | ActionKey>

export const NUM: Layout = {
  hi: [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",

    "+",
    "-",
    { latex: "\\times", action: "\\cdot" },
    { latex: "÷", action: "/" },
    {
      latex: "a^2",
      action(field) {
        field.type("^")
        field.type("2")
        field.type("ArrowRight")
      },
    },
    { latex: "a^b", action: "^" },
    { latex: "\\digit{E}", action: "ᴇ", clsx: "opacity-30" },
    "x",
    "y",
    "\\pi",
  ],
  lo: [
    ".",
    { latex: "\\digit{,}", action: "," },
    brackWrapper("(\\nyafiller)", "(", ")", 4),
    brackWrapper("[\\nyafiller]", "[", "]", 4),
    "<",
    "=",
    ">",
  ],
}

export const NUM_SHIFT: Layout = {
  hi: [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",

    "!",
    "\\to",
    "~",
    {
      latex: "a^{-1}",
      action(field) {
        const c = field.sel.remove()
        field.type("^")
        field.type("(")
        field.type("-")
        field.type("1")
        field.type("ArrowLeft")
        field.type("ArrowLeft")
        field.type("Backspace")
        field.type("ArrowRight")
        field.type("ArrowRight")
        field.type("ArrowRight")
      },
      clsx: "text-xs",
    },
    kSqrt,
    kRoot,
    { latex: "a_b", action: "_" },
    "e",
    "i",
    "\\tau",
  ],
  lo: [
    { latex: "\\digit{:}", action: ":" },
    { clsx: "opacity-30", latex: "\\digit{'}", action: "'" },
    { latex: "\\left\\{\\nyafillersmall\\right\\}", clsx: "pt-0.5" },
    { latex: "|\\nyafiller|", clsx: "pt-0.5" },
    "\\leq",
    fn("h", 4, "opacity-30"),
    "\\geq",
  ],
}

export const KEYS_ABC: Layout = {
  hi: [
    ..."qwertyuiopasdfghjkl".split(""),
    { latex: "θ", clsx: "pr-0.5", action: "\\theta" },
  ],
  lo: "zxcvbnm".split(""),
}

export const KEYS_ABC_SHIFT: Layout = {
  hi: [..."QWERTYUIOPASDFGHJKL".split(""), "\\tau"],
  lo: "ZXCVBNM".split(""),
}

function fn(name: string, size: Size, clsx?: string): ActionKey {
  return {
    latex: `\\wordprefix{${name}}`,
    size,
    clsx,
    action(field) {
      const block = field.sel.splice()
      field.typeLatex(name)
      field.type("(")
      field.type(")")
      field.type("ArrowLeft")
      block.insertAt(field.sel.cursor(L), L)
      field.sel = field.sel.cursor(R).selection()
    },
  }
}

export const KEYS_SYMBOL: Layout = {
  hi: [
    fn("sin", 6),
    fn("cos", 6),
    fn("tan", 6),
    { latex: "\\digit{∑}", action: "∑" },
    fn("exp", 6),
    {
      latex: "10^a",
      size: 6,
      action(field) {
        const contents = field.sel.splice()
        const c = field.sel.cursor(L)
        if (c[L] instanceof CmdNum || c[L] instanceof CmdDot) {
          new OpCdot().insertAt(c, L)
        }
        new CmdNum("1").insertAt(c, L)
        new CmdNum("0").insertAt(c, L)
        new CmdSupSub(null, contents).insertAt(c, L)
        field.sel = contents.cursor(R).selection()
      },
    },
    fn("min", 6),

    fn("asin", 6),
    fn("acos", 6),
    fn("atan", 6),
    { latex: "\\digit{∏}", action: "∏" },
    fn("ln", 6),
    fn("log", 6),
    fn("max", 6),
  ],
  lo: [
    ".",
    { latex: "\\digit{,}", action: "," },
    "\\infty",
    { latex: "\\digit{∫}", action: "\\int" },
    {
      latex: "\\frac{d}{dx}",
      action(field) {
        const num = new Block(null)
        const denom = new Block(null)
        new CmdVar("d", field.options).insertAt(num.cursor(L), L)
        const c = denom.cursor(L)
        new CmdVar("d", field.options).insertAt(c, L)
        new CmdFrac(num, denom).insertAt(field.sel.remove(), L)
        field.sel = c.selection()
        // TODO: maybe go to the letter menu by default here?
      },
    },
    {
      size: 8,
      latex: "\\surreal{}{}",
      action(field) {
        const contents = field.sel.splice()
        const lhs = contents ?? new Block(null)
        const rhs = new Block(null)
        const cursor = field.sel.cursor(L)
        new CmdSurreal(lhs, rhs).insertAt(cursor, L)
        field.sel = (lhs.isEmpty() ? lhs.cursor(L) : rhs.cursor(L)).selection()
      },
    },
  ],
}

export const KEYS_SYMBOL_SHIFT: Layout = {
  hi: [
    fn("csc", 6),
    fn("sec", 6),
    fn("cot", 6),
    fn("nPr", 4),
    fn("erf", 6),
    fn("total", 6),
    fn("median", 6, "text-sm"),

    fn("acsc", 6),
    fn("asec", 6),
    fn("acot", 6),
    fn("nCr", 4),
    fn("mean", 6),
    fn("stdev", 6),
    fn("stdevp", 6, "text-sm"),
  ],
  lo: [
    ".",
    { latex: "\\digit{,}", action: "," },
    fn("floor", 6),
    fn("ceil", 6),
    fn("round", 8),
  ],
}

export const KEYS_CURSOR = layoutCursor(false)

export const KEYS_SELECT = layoutCursor(true)

export const LAYOUTS = [
  NUM,
  NUM_SHIFT,
  KEYS_ABC,
  KEYS_ABC_SHIFT,
  KEYS_SYMBOL,
  KEYS_SYMBOL_SHIFT,
  KEYS_CURSOR,
  KEYS_SELECT,
]

export interface Layout {
  hi: ActionKey[]
  lo: ActionKey[]
}

function wrapper(action: (contents: Block) => Command): KeyAction {
  return (field) => {
    const contents = field.sel.splice()
    const c = field.sel.cursor(L)
    const command = action(contents)
    command.insertAt(c, L)
    field.sel =
      ((command instanceof CmdRoot && command.blocks[1]) || command.blocks[0])
        ?.cursor(L)
        .selection() ?? c.selection()
  }
}

function brackWrapper(
  latex: string,
  lhs: ParenLhs,
  rhs: ParenRhs,
  size: Size,
): ActionKey {
  return {
    size,
    latex,
    clsx: "pt-0.5",
    action: wrapper((contents) => new CmdBrack(lhs, rhs, null, contents)),
  }
}

function layoutCursor(select: boolean): Layout {
  const parens: ActionKey[] =
    select ?
      ([
        brackWrapper("(\\nyafillerblock)", "(", ")", 8),
        brackWrapper("[\\nyafillerblock]", "[", "]", 8),
      ] satisfies ActionKey[])
    : ([
        { latex: "\\digit{(}", action: "(" },
        { latex: "\\digit{)}", action: ")" },
        { latex: "\\digit{[}", action: "[" },
        { latex: "\\digit{]}", action: "]" },
      ] satisfies ActionKey[])

  const row1: ActionKey[] = [
    ...parens,
    { latex: "a^b", action: "^" },
    kSqrt,
    4,
    4,
    { clsx: "opacity-30", icon: faAngleLeft, action(field) {} },
    { clsx: "opacity-30", icon: faAngleRight, action(field) {} },
  ]

  const parens2: ActionKey[] =
    select ?
      ([
        brackWrapper("\\left\\{\\nyafillerblock\\right\\}", "{", "}", 8),
        brackWrapper("|\\nyafillerblock|", "|", "|", 8),
      ] satisfies ActionKey[])
    : [
        { latex: "\\digit{\\{}}", action: "{" },
        { latex: "\\digit{\\}}", action: "}" },
        { latex: "\\digit{|}", action: "|lhs" },
        { latex: "\\digit{|}", action: "|rhs" },
      ]

  const row2: ActionKey[] = [
    ...parens2,
    { latex: "a_b", action: "_" },
    kRoot,
    4,
    4,
    { clsx: "opacity-30", icon: faAnglesLeft, action(field) {} }, // extend to beginning
    { clsx: "opacity-30", icon: faAnglesRight, action(field) {} }, // extend to end
  ]

  return {
    hi: [...row1, ...row2],
    lo: [
      {
        size: 7,
        icon: faCut,
        clsx: select ? "" : "opacity-30",
        action(field) {
          navigator.clipboard.writeText(field.sel.latex())
          field.sel.splice()
        },
      },
      {
        size: 7,
        icon: faCopy,
        clsx: select ? "" : "opacity-30",
        action(field) {
          navigator.clipboard.writeText(field.sel.latex())
          return CANCEL_CHANGES
        },
      },
      {
        size: 7,
        icon: faPaste,
        action(field) {
          navigator.clipboard.readText().then((x) => field.typeLatex(x))
          return CANCEL_CHANGES
        },
      },
      select ?
        { clsx: "opacity-30", size: 7, icon: faArrowsLeftRight, action() {} }
      : {
          clsx: "opacity-30",
          size: 7,
          latex: "\\wordvar{select}",
          action() {},
        },
      // select / select word / expand word selection
    ],
  }
}
