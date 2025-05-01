import { hx } from "@/jsx"
import { doc } from "prettier"
import source from "../examples/ref.nya"
import { Code } from "./ast/issue"
import { ORAngle, ORBrace, ORBrack, ORParen } from "./ast/kind"
import { parse } from "./ast/parse"
import { print } from "./ast/print"
import { createStream, TokenGroup } from "./ast/stream"
import { type Token } from "./ast/token"
import { EmitDecl } from "./emit/block"
import { ScopeProgram } from "./emit/scope"
import { printVanilla } from "./prettier"

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

const elTokenStream = hx(
  "pre",
  "p-4 text-xs whitespace-normal w-screen",
  stream.tokens.map(flat).join(" "),
)
elTokenStream.innerHTML = elTokenStream.innerHTML.replace(
  /\((\d+)\)/g,
  `<sub class='opacity-30'>$1</sub>`,
)
const printed = print(stream, result)

const elIssues = hx(
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
)

const { formatted } = doc.printer.printDocToString(printVanilla(result), {
  printWidth: 80,
  tabWidth: 2,
})

pre(formatted)
hr()
show(elIssues)
hr()
show(elTokenStream)
hr()
// pre(emit.source)
// hr()
pre(printed)

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

function hr() {
  show(hx("hr", "border-[--nya-border] mx-4 border-0 border-t"))
}

function show(el: Node) {
  document.body.appendChild(el)
}

function pre(el: Node | string) {
  show(hx("pre", `p-4 text-xs w-screen text-[--nya-text-prose]`, el))
}
