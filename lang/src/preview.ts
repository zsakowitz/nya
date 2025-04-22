import { hx } from "@/jsx"
import source from "../examples/test.nya"
import { parse } from "./ast"
import { print } from "./ast-print"
import { OGt, ORBrace, ORBrack, ORParen } from "./kind"
import { createStream, TokenGroup } from "./stream"
import { Code, type Token } from "./token"

console.time("stream")
const stream = createStream(source, { comments: false })
console.timeEnd("stream")

console.time("parse")
const result = parse(stream)
console.timeEnd("parse")

if (stream.issues.length) {
  console.error("encountered some issue")
}
const printed = print(stream, result)

document.body.appendChild(
  hx("pre", "px-4 pt-4 text-xs text-[--nya-text-prose]", printed),
)

document.body.appendChild(
  hx("hr", "border-[--nya-border] mx-4 my-4 border-0 border-t"),
)

function flat(x: Token<number>): string {
  if (x instanceof TokenGroup) {
    return (
      source.slice(x.lt.start, x.lt.end) +
      " " +
      x.contents.tokens.map(flat).join(" ") +
      " " +
      {
        [ORParen]: ")",
        [ORBrack]: "]",
        [ORBrace]: "}",
        [OGt]: ">",
      }[x.gt.kind]
    )
  }

  return source.slice(x.start, x.end)
}

document.body.appendChild(
  hx("pre", "px-4 text-xs", stream.tokens.map(flat).join(" ")),
)

document.body.appendChild(
  hx("hr", "border-[--nya-border] mx-4 my-4 border-0 border-t"),
)

document.body.appendChild(
  hx(
    "pre",
    "px-4 text-xs",
    JSON.stringify(
      stream.issues.map((v) => ({
        code: Object.entries(Code).find((x) => x[1] == v.code)?.[0],
        start: v.start,
        end: v.end,
        of: stream.content(v),
      })),
      undefined,
      2,
    ),
  ),
)
