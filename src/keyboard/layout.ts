import { options } from "@/field/defaults"
import { LatexParser } from "@/field/latex"
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
    h("font-['Symbola']", contents),
    h("absolute -inset-0.5"),
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
    "\\digit{,}",
    { latex: "(\\nyafiller)", clsx: "pt-0.5" },
    { latex: "[\\nyafiller]", clsx: "pt-0.5" },
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
    { latex: "a^{-1}", clsx: "text-xs" },
    "\\sqrt{\\nyafiller}",
    "\\sqrt[n]{\\nyafillersmall}",
    "a_b",
    "e",
    "i",
    "\\tau",
  ],
  lo: [
    "\\digit{:}",
    "\\digit{'}",
    { latex: "\\left\\{\\nyafillersmall\\right\\}", clsx: "pt-0.5" },
    { latex: "|\\nyafiller|", clsx: "pt-0.5" },
    "\\leq",
    { latex: "\\wordprefix{h}", clsx: "opacity-30" },
    "\\geq",
  ],
}

export const KEYS_ABC: Layout = {
  hi: [..."qwertyuiopasdfghjkl".split(""), { latex: "θ", clsx: "pr-0.5" }],
  lo: "zxcvbnm".split(""),
}

export const KEYS_ABC_SHIFT: Layout = {
  hi: [..."QWERTYUIOPASDFGHJKL".split(""), "\\tau"],
  lo: "ZXCVBNM".split(""),
}

export const KEYS_SYMBOL: Layout = {
  hi: [
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
  ],
  lo: [
    ".",
    "\\digit{,}",
    "\\infty",
    "\\digit{∫}",
    "\\frac{d}{dx}",
    { size: 8, latex: "\\surreal{}{}" },
  ],
}

export const KEYS_SYMBOL_SHIFT: Layout = {
  hi: [
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
  ],
  lo: [
    ".",
    "\\digit{,}",
    { latex: "\\wordprefix{floor}", size: 6 },
    { latex: "\\wordprefix{ceil}", size: 6 },
    { latex: "\\wordprefix{round}", size: 8 },
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
  hi: Key[]
  lo: Key[]
}

function layoutCursor(select: boolean): Layout {
  return {
    hi: [
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
    ],
    lo: [
      { size: 7, icon: faCut, clsx: select ? "" : "opacity-30" },
      { size: 7, icon: faCopy, clsx: select ? "" : "opacity-30" },
      { size: 7, icon: faPaste },
      select ?
        { size: 7, icon: faArrowsLeftRight }
      : { size: 7, latex: "\\wordvar{select}" }, // select / select word / expand word selection
    ],
  }
}
