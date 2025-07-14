import { options } from "@/field/defaults"
import { LatexParser } from "@/field/latex"
import { fa, h } from "@/jsx"
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

  return h(
    "flex rounded-sm h-[36px] text-center items-center justify-center [line-height:1] " +
      (active ?
        "text-[--nya-kbd-key-active-text] bg-[--nya-kbd-key-active-bg] fill-[--nya-kbd-key-active-text]"
      : "text-[--nya-kbd-key-text] bg-[--nya-kbd-key-bg] fill-[--nya-kbd-key-text]") +
      (clsx ? " " + clsx : ""),
    h("font-['Symbola']", contents),
  )
}

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
  | (Contents & { size?: Size; clsx?: string; active?: boolean }) // plain key
  | Size // spacer
  | null // tbd

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

export const CONTROLS = {
  shift: { size: 5, text: "⇧" },
  backspace: { size: 5, text: "⌫" },

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
  arrowL: { size: 5, text: "←" },
  arrowR: { size: 5, text: "→" },
  cursor: { size: 4, icon: faArrowPointer },
  opts: { size: 4, icon: faGears, clsx: "opacity-30" },
  enter: { size: 10, text: "⏎" },
} satisfies Record<string, Key>

export function createKeyboard(layout: Key[]) {
  return h(
    "grid w-full grid-cols-[repeat(40,1fr)] gap-1 p-1 bg-[--nya-kbd-bg] [line-height:1] whitespace-nowrap",
    ...layout.map(keyFrom),
  )
}

function btm(mode: "num" | "alpha" | "sym" | "cursor" | "opts"): Key[] {
  return [
    {
      size: 5,
      latex: "\\digit{ABC}",
      clsx: "text-sm/[1]",
      active: mode == "alpha",
    },
    {
      size: 5,
      latex: "\\digit{∑}f",
      clsx: "[letter-spacing:.1em] pl-0.5",
      active: mode == "sym",
    },
    1,
    { size: 5, text: "←" },
    { size: 5, text: "→" },
    { size: 4, icon: faArrowPointer, active: mode == "cursor" },
    { size: 4, icon: faGears, active: mode == "opts", clsx: "opacity-30" },
    1,
    { size: 10, text: "⏎" },
  ]
}

export const LAYOUT_NUM: Layout = {
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
    "\\times",
    "÷",
    "a^2",
    "a^b",
    "\\digit{E}",
    "x",
    "y",
    "\\pi",
  ],
  lo: [
    ".",
    ",",
    { latex: "(\\nyafiller)", clsx: "pt-0.5" },
    { latex: "[\\nyafiller]", clsx: "pt-0.5" },
    "<",
    "=",
    ">",
  ],
}

const KEYS_NUM: Key[] = [
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
  "\\times",
  "÷",
  "a^2",
  "a^b",
  "\\digit{E}",
  "x",
  "y",
  "\\pi",

  { size: 5, text: "⇧" },
  1,
  ".",
  ",",
  { latex: "(\\nyafiller)", clsx: "pt-0.5" },
  { latex: "[\\nyafiller]", clsx: "pt-0.5" },
  "<",
  "=",
  ">",
  1,
  { size: 5, text: "⌫" },

  ...btm("num"),
]

const KEYS_NUM_SHIFT: Key[] = [
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
  { latex: "a^{-1}", clsx: "text-xs" },
  "\\sqrt{\\nyafiller}",
  "\\sqrt[n]{\\nyafillersmall}",
  "a_b",
  "e",
  "i",
  "\\tau",

  { size: 5, text: "⇧", active: true },
  1,
  "\\digit{:}",
  "\\digit{'}",
  { latex: "\\left\\{\\nyafillersmall\\right\\}", clsx: "pt-0.5" },
  { latex: "|\\nyafiller|", clsx: "pt-0.5" },
  "\\leq",
  "\\neq",
  "\\geq",
  1,
  { size: 5, text: "⌫" },

  ...btm("num"),
]

const KEYS_ABC: Key[] = [
  ..."qwertyuiopasdfghjkl".split(""),
  { latex: "θ", clsx: "pr-0.5" },

  { size: 5, text: "⇧" },
  1,
  ..."zxcvbnm".split(""),
  1,
  { size: 5, text: "⌫" },

  ...btm("alpha"),
]

const KEYS_ABC_SHIFT: Key[] = [
  ..."QWERTYUIOPASDFGHJKL".split(""),
  "\\tau",

  { size: 5, text: "⇧", active: true },
  1,
  ..."ZXCVBNM".split(""),
  1,
  { size: 5, text: "⌫" },

  ...btm("alpha"),
]

const KEYS_SYMBOL: Key[] = [
  { latex: "\\wordprefix{sin}", size: 6 },
  { latex: "\\wordprefix{cos}", size: 6 },
  { latex: "\\wordprefix{tan}", size: 6 },
  "\\digit{∑}",
  { latex: "\\wordprefix{exp}", size: 6 },
  { latex: "10^a", size: 6 },
  { latex: "\\wordprefix{min}", size: 6 },

  { latex: "\\wordprefix{asin}", size: 6 },
  { latex: "\\wordprefix{acos}", size: 6 },
  { latex: "\\wordprefix{atan}", size: 6 },
  "\\digit{∏}",
  { latex: "\\wordprefix{ln}", size: 6 },
  { latex: "\\wordprefix{log}", size: 6 },
  { latex: "\\wordprefix{max}", size: 6 },

  { size: 5, text: "⇧" },
  1,
  ".",
  ",",
  "\\infty",
  "\\digit{∫}",
  "\\frac{d}{dx}",
  { size: 8, latex: "\\surreal{}{}" },
  1,
  { size: 5, text: "⌫" },

  ...btm("sym"),
]

const KEYS_SYMBOL_SHIFT: Key[] = [
  { latex: "\\wordprefix{csc}", size: 6 },
  { latex: "\\wordprefix{sec}", size: 6 },
  { latex: "\\wordprefix{cot}", size: 6 },
  { latex: "\\wordprefix{nPr}", size: 4 },
  { latex: "\\wordprefix{erf}", size: 6 },
  { latex: "\\wordprefix{total}", size: 6 },
  { latex: "\\wordprefix{median}", size: 6, clsx: "text-sm" },

  { latex: "\\wordprefix{acsc}", size: 6 },
  { latex: "\\wordprefix{asec}", size: 6 },
  { latex: "\\wordprefix{acot}", size: 6 },
  { latex: "\\wordprefix{nCr}", size: 4 },
  { latex: "\\wordprefix{mean}", size: 6 },
  { latex: "\\wordprefix{stdev}", size: 6 },
  { latex: "\\wordprefix{stdevp}", size: 6, clsx: "text-sm" },

  { size: 5, text: "⇧", active: true },
  1,
  ".",
  "\\wordprefix{h}",
  { latex: "\\wordprefix{floor}", size: 6 },
  { latex: "\\wordprefix{ceil}", size: 6 },
  { latex: "\\wordprefix{round}", size: 8 },
  1,
  { size: 5, text: "⌫" },

  ...btm("sym"),
]

function layoutCursor(select: boolean): Key[] {
  return [
    ...(select ?
      ([
        { size: 8, latex: "(\\nyafillerblock)", clsx: "pt-0.5" },
        { size: 8, latex: "[\\nyafillerblock]", clsx: "pt-0.5" },
      ] satisfies Key[])
    : ["\\digit{(}", "\\digit{)}", "\\digit{[}", "\\digit{]}"]),
    "a^b",
    "\\sqrt{\\nyafiller}",
    4,
    4,
    { icon: faAngleLeft },
    { icon: faAngleRight },

    ...(select ?
      ([
        {
          size: 8,
          latex: "\\left\\{\\nyafillerblock\\right\\}",
          clsx: "pt-0.5",
        },
        { size: 8, latex: "|\\nyafillerblock|", clsx: "pt-0.5" },
      ] satisfies Key[])
    : ["\\digit{\\{}", "\\digit{\\}}", "\\digit{|}", "\\digit{|}"]),
    "a_b",
    "\\sqrt[b]{\\nyafillersmall}",
    4,
    4,
    { icon: faAnglesLeft }, // extend to beginning
    { icon: faAnglesRight }, // extend to end

    { size: 5, text: "⇧" },
    1,
    { size: 7, icon: faCut, clsx: select ? "" : "opacity-30" },
    { size: 7, icon: faCopy, clsx: select ? "" : "opacity-30" },
    { size: 7, icon: faPaste },
    select ?
      { size: 7, icon: faArrowsLeftRight }
    : { size: 7, latex: "\\wordvar{select}" }, // select / select word / expand word selection
    1,
    { size: 5, text: "⌫" },

    ...btm("cursor"),
  ]
}

const KEYS_CURSOR = layoutCursor(false)
const KEYS_SELECT = layoutCursor(true)

export const LAYOUTS = [
  KEYS_NUM,
  KEYS_NUM_SHIFT,
  KEYS_ABC,
  KEYS_ABC_SHIFT,
  KEYS_SYMBOL,
  KEYS_SYMBOL_SHIFT,
  KEYS_CURSOR,
  KEYS_SELECT,
]

export interface Layout {
  hi: Key[]
  lo: Key[]
}
