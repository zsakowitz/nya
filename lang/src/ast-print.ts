import { h } from "@/jsx"
import * as Kind from "./kind"
import { TokenGroup, type Stream } from "./stream"
import { Token } from "./token"

export type Print =
  | Token<number>
  | TokenGroup
  | { [x: string]: Print }
  | null
  | undefined
  | number
  | Print[]

const bg = [
  "border-blue-500",
  "border-pink-500",
  "border-green-500",
  "border-purple-500",
]

function tag(prefix: Element, text: Element, suffix: string, level: number) {
  if (text.innerHTML.includes("\n")) {
    prefix.innerHTML = prefix.innerHTML.trimEnd()
    text.innerHTML = text.innerHTML.replace(
      /\n/g,
      `\n<span class='${bg[level % bg.length]} relative'>  <span class='block absolute h-[calc(100%_+_0.5ch)] -top-[0.5ch] left-0 border-l border-inherit'></span></span>`,
    )
    return h(
      "nya-ast-group",
      prefix,
      "\n",
      h(bg[level % bg.length] + " border-l", "  "),
      text,
      "\n",
      suffix.trimStart(),
    )
  } else {
    return h("nya-ast-group", prefix, text, suffix)
  }
}

function list(items: Element[], maxLen: number): Element {
  if (items.map((x) => x.textContent).join(", ").length > maxLen) {
    return h("", ...items.flatMap((x, i) => [i == 0 ? null : ",\n", x]))
  } else {
    return h("", ...items.flatMap((x, i) => [i == 0 ? null : ", ", x]))
  }
}

export function print(stream: Stream, a: Print, level = 0): Element {
  if (a == null) {
    return h("text-slate-500", "null")
  }

  if (typeof a == "number") {
    return h("text-blue-500", a.toString())
  }

  if (a instanceof TokenGroup) {
    const kind =
      Object.entries(Kind).find((x) => x[1] === a.kind)?.[0] || "<unknown>"
    return h(
      "nya-amber-500",
      h("", kind),
      " ",
      JSON.stringify(stream.content(a.lt) + stream.content(a.gt)),
    )
  }

  if (a instanceof Token) {
    const kind =
      Object.entries(Kind).find((x) => x[1] === a.kind)?.[0] || "<unknown>"
    return h("", `${kind} ${JSON.stringify(stream.content(a))}`)
  }

  if (Array.isArray(a)) {
    if (a.length == 0) return h("", "(0) []")

    const els = a.map((x) => print(stream, x, level + 1))

    return tag(
      h("", `(${a.length}) [`),
      list(els, els.length >= 2 ? 0 : 80 - 2 * level),
      "]",
      level,
    )
  }

  const els = Object.entries(a)
    .filter(([k]) => k != "start" && k != "end")
    .map(([k, v]) => h("", k, ": ", print(stream, v, level + 1)))

  return tag(
    h("", h("text-[--nya-text] font-semibold", a.constructor.name), " { "),
    list(els, els.length >= 2 ? 0 : 80 - 2 * level),
    " }",
    level,
  )
}
