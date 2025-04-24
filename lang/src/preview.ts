import { hx } from "@/jsx"
import source from "../examples/test.nya"
import { Code } from "./ast/issue"
import { ORAngle, ORBrace, ORBrack, ORParen } from "./ast/kind"
import { parse } from "./ast/parse"
import { print } from "./ast/print"
import { createStream, TokenGroup } from "./ast/stream"
import { type Token } from "./ast/token"
import { EmitDecl } from "./emit/block"
import { ScopeProgram } from "./emit/scope"

console.time("stream")
const stream = createStream(source, { comments: false })
console.timeEnd("stream")

console.time("parse")
const result = parse(stream)
console.timeEnd("parse")

const scopeProgram = new ScopeProgram(true)
const scopeFile = scopeProgram.file(stream.source)
const emit = new EmitDecl("js", stream.issues)

try {
  for (const item of result.items) {
    item.emit(scopeFile, emit)
  }
} catch (e) {
  console.warn("[script emit]", e)
}

if (!stream.issues.ok()) {
  console.error("encountered some issue")
}

document.body.appendChild(
  hx(
    "pre",
    "p-4 text-xs",
    JSON.stringify(
      stream.issues.entries.map((v) => ({
        code: Object.entries(Code).find((x) => x[1] == v.code)?.[0],
        start: v.pos.start,
        end: v.pos.end,
        of: stream.content(v.pos),
      })),
      undefined,
      2,
    ),
  ),
)

document.body.appendChild(
  hx("hr", "border-[--nya-border] mx-4 border-0 border-t"),
)

const el = hx(
  "pre",
  "p-4 text-xs whitespace-normal w-screen",
  stream.tokens.map(flat).join(" "),
)
el.innerHTML = el.innerHTML.replace(
  /\((\d+)\)/g,
  `<sub class='opacity-30'>$1</sub>`,
)
document.body.appendChild(el)

document.body.appendChild(
  hx("hr", "border-[--nya-border] mx-4 border-0 border-t"),
)

document.body.appendChild(
  hx("pre", "p-4 text-xs whitespace-normal w-screen", emit.source),
)

document.body.appendChild(
  hx("hr", "border-[--nya-border] mx-4 border-0 border-t"),
)

const printed = print(stream, result)

document.body.appendChild(
  hx("pre", "p-4 text-xs text-[--nya-text-prose]", printed),
)

function flat(x: Token<number>): string {
  if (x instanceof TokenGroup) {
    return `${source.slice(
      x.lt.start,
      x.lt.end,
    )}(${x.lt.kind.toString()}) ${x.contents.tokens.map(flat).join(" ")} ${
      {
        [ORParen]: ")",
        [ORBrack]: "]",
        [ORBrace]: "}",
        [ORAngle]: ">",
      }[x.gt.kind]
    }(${x.gt.kind})`
  }

  return `${source.slice(x.start, x.end)}(${x.kind.toString()})`
}
