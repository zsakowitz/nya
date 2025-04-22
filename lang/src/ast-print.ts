import type { Stream } from "./ast"
import { TokenGroup } from "./group"
import * as Kind from "./kind"
import { Token } from "./token"

export type Print =
  | Token<number>
  | TokenGroup
  | { [x: string]: Print }
  | null
  | undefined
  | number

function tag(prefix: string, text: string, suffix: string, maxLen: number) {
  if (text.includes("\n") || text.length > maxLen) {
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

  if (a instanceof Token) {
    const kind =
      Object.entries(Kind).find((x) => x[1] === a.kind)?.[0] || "<unknown>"
    return `${kind} ${JSON.stringify(stream.content(a))}`
  }

  return tag(
    a.constructor.name + " { ",
    list(
      Object.entries(a)
        .filter(([k]) => k != "start" && k != "end")
        .map(([k, v]) => `${k}: ${print(stream, v, level + 1)}`),
      80 - 2 * level,
    ),
    " }",
    80 - 2 * level,
  )
}
