import { options } from "@/field/defaults"
import { LatexParser } from "@/field/latex"
import { fa, h } from "@/jsx"
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { faArrowPointer } from "@fortawesome/free-solid-svg-icons/faArrowPointer"

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

type Contents =
  | { latex: string; text?: undefined; icon?: undefined }
  | { latex?: undefined; text: string; icon?: undefined }
  | { latex?: undefined; text?: undefined; icon: IconDefinition }

type Key =
  | string // shortcut for 4-width, latex
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

function keyFrom(k: Key) {
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

export function createKeyboard(layout: Key[]) {
  return h(
    "grid w-full grid-cols-[repeat(40,1fr)] gap-1 p-1 bg-[--nya-kbd-bg] [line-height:1]",
    ...layout.map(keyFrom),
  )
}

export const LAYOUT: Key[] = [
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
  "\\pi",
  ".",
  ",",

  { size: 5, text: "⇧" },
  1,
  { latex: "(\\nyafiller)", clsx: "pt-0.5" },
  { latex: "[\\nyafiller]", clsx: "pt-0.5" },
  "<",
  "=",
  ">",
  "x",
  "y",
  1,
  { size: 5, text: "⌫" },

  { size: 5, latex: "\\digit{ABC}", clsx: "text-sm/[1]" },
  { size: 5, latex: "\\digit{∑}f", clsx: "[letter-spacing:.1em] pl-0.5" },
  2,
  { size: 5, text: "←" },
  { size: 5, text: "→" },
  2,
  { size: 4, icon: faArrowPointer },
  2,
  { size: 10, text: "⏎" },
]

export const LAYOUT_SHIFT: Key[] = [
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
  "\\tau",
  ":",
  "\\digit{'}",

  { size: 5, text: "⇧", active: true },
  1,
  { latex: "\\left\\{\\nyafillersmall\\right\\}", clsx: "pt-0.5" },
  { latex: "|\\nyafiller|", clsx: "pt-0.5" },
  "\\leq",
  "\\neq",
  "\\geq",
  "e",
  "i",
  1,
  { size: 5, text: "⌫" },

  { size: 5, latex: "\\digit{ABC}", clsx: "text-sm/[1]" },
  { size: 5, latex: "\\digit{∑}f", clsx: "[letter-spacing:.1em] pl-0.5" },
  2,
  { size: 5, text: "←" },
  { size: 5, text: "→" },
  2,
  { size: 4, icon: faArrowPointer },
  2,
  { size: 10, text: "⏎" },
]

export const LAYOUT_ABC: Key[] = [
  ..."qwertyuiopasdfghjkl".split(""),
  { latex: "θ", clsx: "pr-0.5" },

  { size: 5, text: "⇧" },
  1,
  ..."zxcvbnm".split(""),
  1,
  { size: 5, text: "⌫" },

  { size: 5, latex: "\\digit{ABC}", clsx: "text-sm/[1]", active: true },
  { size: 5, latex: "\\digit{∑}f", clsx: "[letter-spacing:.1em] pl-0.5" },
  2,
  { size: 5, text: "←" },
  { size: 5, text: "→" },
  2,
  { size: 4, icon: faArrowPointer },
  2,
  { size: 10, text: "⏎" },
]

export const LAYOUT_ABC_SHIFT: Key[] = [
  ..."QWERTYUIOPASDFGHJKL".split(""),
  "\\tau",

  { size: 5, text: "⇧", active: true },
  1,
  ..."ZXCVBNM".split(""),
  1,
  { size: 5, text: "⌫" },

  { size: 5, latex: "\\digit{ABC}", clsx: "text-sm/[1]", active: true },
  { size: 5, latex: "\\digit{∑}f", clsx: "[letter-spacing:.1em] pl-0.5" },
  2,
  { size: 5, text: "←" },
  { size: 5, text: "→" },
  2,
  { size: 4, icon: faArrowPointer },
  2,
  { size: 10, text: "⏎" },
]

export const LAYOUT_SYMBOL: Key[] = [
  { latex: "\\wordprefix{sin}", size: 6 },
  { latex: "\\wordprefix{cos}", size: 6 },
  { latex: "\\wordprefix{tan}", size: 6 },
  { latex: "\\wordprefix{exp}", size: 6 },
  { latex: "10^a", size: 6 },
  { latex: "\\wordprefix{min}", size: 6 },
  null,

  { latex: "\\wordprefix{asin}", size: 6 },
  { latex: "\\wordprefix{acos}", size: 6 },
  { latex: "\\wordprefix{atan}", size: 6 },
  { latex: "\\wordprefix{ln}", size: 6 },
  { latex: "\\wordprefix{log}", size: 6 },
  { latex: "\\wordprefix{max}", size: 6 },
  null,

  // round mean stdev stdevp nPr nCr

  { size: 5, text: "⇧" },
  1,
  "\\infty",
  "\\digit{∑}",
  "\\digit{∫}",
  "\\frac{d}{dx}",
  null,
  null,
  null,
  1,
  { size: 5, text: "⌫" },

  { size: 5, latex: "\\digit{ABC}", clsx: "text-sm/[1]" },
  {
    size: 5,
    latex: "\\digit{∑}f",
    clsx: "[letter-spacing:.1em] pl-0.5",
    active: true,
  },
  2,
  { size: 5, text: "←" },
  { size: 5, text: "→" },
  2,
  { size: 4, icon: faArrowPointer },
  2,
  { size: 10, text: "⏎" },
]

export const LAYOUT_SYMBOL_SHIFT: Key[] = [
  { latex: "\\wordprefix{csc}", size: 6 },
  { latex: "\\wordprefix{sec}", size: 6 },
  { latex: "\\wordprefix{cot}", size: 6 },
  { latex: "\\wordprefix{sinh}", size: 6 },
  { latex: "\\wordprefix{cosh}", size: 6 },
  { latex: "\\wordprefix{tanh}", size: 6 },
  null,

  { latex: "\\wordprefix{acsc}", size: 6 },
  { latex: "\\wordprefix{asec}", size: 6 },
  { latex: "\\wordprefix{acot}", size: 6 },
  { latex: "\\wordprefix{mean}", size: 6 },
  { latex: "\\wordprefix{stdev}", size: 6 },
  { latex: "\\wordprefix{stdevp}", size: 10 },

  { size: 5, text: "⇧", active: true },
  1,
  { latex: "\\wordprefix{round}", size: 8 },
  { latex: "\\wordprefix{floor}", size: 6 },
  { latex: "\\wordprefix{ceil}", size: 6 },
  { latex: "\\wordprefix{nPr}", size: 4 },
  { latex: "\\wordprefix{nCr}", size: 4 },
  1,
  { size: 5, text: "⌫" },

  { size: 5, latex: "\\digit{ABC}", clsx: "text-sm/[1]" },
  {
    size: 5,
    latex: "\\digit{∑}f",
    clsx: "[letter-spacing:.1em] pl-0.5",
    active: true,
  },
  2,
  { size: 5, text: "←" },
  { size: 5, text: "→" },
  2,
  { size: 4, icon: faArrowPointer },
  2,
  { size: 10, text: "⏎" },
]

export const LAYOUTS = [
  LAYOUT,
  LAYOUT_SHIFT,
  LAYOUT_ABC,
  LAYOUT_ABC_SHIFT,
  LAYOUT_SYMBOL,
  LAYOUT_SYMBOL_SHIFT,
]
