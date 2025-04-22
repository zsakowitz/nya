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

function tag(prefix: string, text: string, suffix: string) {
  if (text.includes("\n")) {
    return `${prefix.trimEnd()}\n  ${text.replace(/\n/g, "\n  ")}\n${suffix.trimStart()}`
  } else {
    return prefix + text + suffix
  }
}

function list(items: string[], maxLen: number) {
  if (items.join(", ").length > maxLen) {
    return items.join(",\n")
  } else {
    return items.join(", ")
  }
}

export function print(stream: Stream, a: Print, level = 0): string {
  if (a == null) {
    return "null"
  }

  if (typeof a == "number") {
    return a.toString()
  }

  if (a instanceof TokenGroup) {
    const kind =
      Object.entries(Kind).find((x) => x[1] === a.kind)?.[0] || "<unknown>"
    return `${kind} ${JSON.stringify(stream.content(a.lt) + stream.content(a.gt))}`
  }

  if (a instanceof Token) {
    const kind =
      Object.entries(Kind).find((x) => x[1] === a.kind)?.[0] || "<unknown>"
    return `${kind} ${JSON.stringify(stream.content(a))}`
  }

  if (Array.isArray(a)) {
    if (a.length == 0) return "(0) []"

    const els = a.map((x) => print(stream, x, level + 1))

    return tag(
      `(${a.length}) [`,
      list(els, els.length >= 2 ? 0 : 80 - 2 * level),
      "]",
    )
  }

  const els = Object.entries(a)
    .filter(([k]) => k != "start" && k != "end")
    .map(([k, v]) => `${k}: ${print(stream, v, level + 1)}`)

  return tag(
    a.constructor.name + " { ",
    list(els, els.length >= 2 ? 0 : 80 - 2 * level),
    " }",
  )
}
