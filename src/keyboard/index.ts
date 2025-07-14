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
    h("font-['Symbola'] last:*:*:*:pr-0", contents),
  )
}

type Size = 1 | 2 | 4 | 5 | 10

type Contents =
  | { latex: string; text?: undefined; icon?: undefined }
  | { latex?: undefined; text: string; icon?: undefined }
  | { latex?: undefined; text?: undefined; icon: IconDefinition }

type Key =
  | string // shortcut for 4-width, latex
  | (Contents & { size?: Size; clsx?: string; active?: boolean }) // plain key
  | Size // spacer

const span = {
  1: "col-span-1",
  2: "col-span-2",
  4: "col-span-4",
  5: "col-span-5",
  10: "col-span-10",
}

function keyFrom(k: Key) {
  if (typeof k == "string") {
    return key(k, "col-span-4")
  }

  if (typeof k == "number") {
    return h(span[k])
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

export const LAYOUT_STANDARD: Key[] = [
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
