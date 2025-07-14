// +
// -
// *
// /
// ||
// x
// y
// ^2 √
// ^ √
// _
// ±
// ,
// ( )
// [ ]
// { }
// -> !
// ᴇ \infty
// 1
// 2
// 3
// 4
// 5
// 6
// 7
// 8
// 9
// 0
// i
// .
// pi
// e
// = !=
// < <=
// > >=
// '

// Desmos keyboard is 170px tall:
// x   y  ^2  ^b    7 8 9 ÷    functions
// (   )  <   >     4 5 6 *    left    right
// ||  ,  <=  >=    1 2 3 -    delete
// 🔤  🔊  √   a     0 . = +    enter

import { options } from "@/field/defaults"
import { LatexParser } from "@/field/latex"
import { fa, h } from "@/jsx"
import { faArrowPointer } from "@fortawesome/free-solid-svg-icons/faArrowPointer"
import { twMerge } from "tailwind-merge"

// ABC goes to:
// qwertyuiop
// asdfghjklθ
// shift zcvbnm backspace
// num sub !% [] {} ~: ,' enter

// Functions are:
// trig 6
// invtrig 6
// stats
// list ops
// visualizations
// probability distributions
// inference
// calculus
// trigh
// geometry
// rgb, hsv
// tone
// number theory

const parser = new LatexParser(options, null, "")

type Size = 1 | 2 | 4 | 5 | 10

type Contents =
  | { latex: string; text?: undefined }
  | { latex?: undefined; text: string }

type Key =
  | string // shortcut for 4-width, latex
  | (Contents & { size: Size; clsx?: string; active?: boolean }) // plain key
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
    return key(k)
  }
  if (typeof k == "number") {
    return h(span[k])
  }
  if (k.latex) {
    return key(k.latex, span[k.size ?? 4] + " " + k.clsx, k.active)
  }
  if (k.text) {
    return key(
      h("font-[system-ui]", k.text),
      span[k.size ?? 4] + " " + k.clsx,
      k.active,
    )
  }
}

function key(base?: string | Node, clsx?: string, active?: boolean) {
  const contents =
    typeof base == "string" ?
      h("font-['Symbola'] last:*:*:*:pr-0", parser.run(base).el)
    : (base ?? "")

  return h(
    twMerge(
      "flex text-[--nya-kbd-key-text] bg-[--nya-kbd-key-bg] rounded-sm h-[36px] text-center items-center justify-center col-span-4 [line-height:1]",
      clsx ? " " + clsx : "",
    ),
    h("font-['Symbola'] last:*:*:*:pr-0", contents),
  )
}

function keys(text: string) {
  return (text.includes("  ") ? text.split("  ") : text.split(" ")).map((x) =>
    key(x),
  )
}

const layout: Key[] = [
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
]

export function createKeyboard() {
  const kDigits = keys("1 2 3 4 5 6 7 8 9 0")

  const kShift = key(h("font-[system-ui]", "⇧"), "col-span-5")
  const kDel = key(h("font-[system-ui]", "⌫"), "col-span-5")
  const kLeft = key(h("font-[system-ui]", "←"), "col-span-5")
  const kRight = key(h("font-[system-ui]", "→"), "col-span-5")

  const kAlt1 = key(h("font-['Symbola'] text-sm/[1]", "ABC"), "col-span-5")
  const kAlt2 = key(
    h(
      "",
      h("font-['Symbola']", "∑"),
      h("font-['Times_New_Roman'] italic pl-1 pr-0.5", "f"),
    ),
    "col-span-5",
  )
  const kEnter = key(h("font-[system-ui]", "⏎"), "col-span-10")
  const kMouse = key(fa(faArrowPointer, "size-4"), "col-span-4")

  return h(
    "grid w-full grid-cols-[repeat(40,1fr)] gap-1 p-1 bg-[--nya-kbd-bg] [line-height:1]",

    ...kDigits,

    key("+"),
    key("-"),
    key("\\times"),
    key("÷"),
    key("a^2"),
    key("a^b"),
    key("\\digit{E}"),
    key("\\pi"),
    key("."),
    key(","),

    kShift,
    h(),
    key("(\\nyafiller)", "pt-0.5"),
    key("[\\nyafiller]", "pt-0.5"),
    key("<"),
    key("="),
    key(">"),
    key("x"),
    key("y"),
    h(),
    kDel,

    kAlt1,
    kAlt2,
    h("col-span-2"),
    kLeft,
    kRight,
    h("col-span-2"),
    kMouse,
    h("col-span-2"),
    kEnter,
  )
}
