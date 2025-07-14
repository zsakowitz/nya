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
import { h } from "@/jsx"
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

function key(base?: string | Node, clsx?: string) {
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

export function createKeyboard() {
  const kDigits = keys("1 2 3 4 5 6 7 8 9 0")

  const kShift = key(h("font-[system-ui]", "⇧"), "col-span-5")
  const kOps = keys("+ - \\times ÷")
  const kDel = key(h("font-[system-ui]", "⌫"), "col-span-5")

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
  const kSelect = key(h("font-[system-ui]", ""))

  return h(
    "grid w-full grid-cols-[repeat(40,1fr)] gap-1 p-1 bg-[--nya-kbd-bg] [line-height:1]",

    ...kDigits,

    h("col-span-2"),
    key("+"),
    key("-"),
    key("\\times"),
    key("÷"),
    key(),
    key(),
    key(),
    key(),
    key(),
    h("col-span-2"),

    kShift,
    h(),
    key("(\\nyafiller)", "pt-0.5"),
    key("[\\nyafiller]", "pt-0.5"),
    key(),
    key(),
    key(),
    key(),
    key(),
    h(),
    kDel,

    kAlt1,
    kAlt2,
    h("col-span-2"),
    key(),
    key(),
    key(),
    key(),
    h("col-span-2"),
    kEnter,
  )
}
