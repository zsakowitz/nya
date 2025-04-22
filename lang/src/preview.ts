import { hx } from "@/jsx"
import source from "../examples/test.nya"
import { parse } from "./ast"
import { print } from "./ast-print"
import { createStream } from "./stream"
import { Code } from "./token"

console.time("stream")
const s = createStream(source, { comments: false })
console.timeEnd("stream")
console.time("parse")
parse(s)
console.timeEnd("parse")

const stream = createStream(source, { comments: false })
const result = parse(stream)
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
