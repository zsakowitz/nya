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

export function tag(prefix: string, text: string, suffix: string) {
  if (text.includes("\n") || text.length > 80) {
    return `${prefix}\n  ${text.replace(/\n/g, "\n  ")}\n${suffix}`
  } else {
    return prefix + text + suffix
  }
}

export function list(items: string[]) {
  if (items.join(", ").length > 80) {
    return items.join(",\n")
  } else {
    return items.join(", ")
  }
}

export function print(stream: Stream, a: Print): string {
  if (a == null) {
    return "null"
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
        .map(([k, v]) => `${k}: ${print(stream, v)}`),
    ),
    " }",
  )
}
