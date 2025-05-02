import { h, hx } from "@/jsx"
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
import { UNPRINTED } from "./prettier/print"

console.time("stream")
const stream = createStream(source, { comments: false })
console.timeEnd("stream")

console.time("parse")
const result = parse(stream)
console.timeEnd("parse")

show(hx("h2", "text-center pt-4 text-lg font-semibold", "nyalang debug window"))

function hr() {
  show(
    hx("hr", "border-[--nya-border] mx-4 border-0 border-t first-of-type:mt-4"),
  )
}

function show(el: Node) {
  document.body.appendChild(el)
}

function pre(el: Node | string) {
  const p = hx("pre", `p-4 text-xs w-screen text-[--nya-text-prose]`, el)
  show(p)
  return p
}

function showTokenStream() {
  const elTokenStream = hx(
    "pre",
    "p-4 text-xs whitespace-normal w-screen",
    stream.tokens.map(flat).join(" "),
  )
  elTokenStream.innerHTML = elTokenStream.innerHTML.replace(
    /\((\d+)\)/g,
    `<sub class='opacity-30'>$1</sub>`,
  )

  hr()
  show(elTokenStream)

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
}

function showPrinted() {
  const printed = print(stream, result)
  hr()
  pre(printed)
}

function showPrettier() {
  const { formatted } = doc.printer.printDocToString(printVanilla(result), {
    printWidth: 80,
    tabWidth: 2,
  })

  hr()
  pre([...UNPRINTED].join(", "))

  hr()
  const q = pre(formatted)
  q.classList.add("relative")
  q.appendChild(h("absolute left-[80ch] inset-y-4 bg-[--nya-border] w-px"))
}

function showIssues() {
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

  hr()
  show(elIssues)
}

function showEmit() {
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

  hr()
  pre(emit.source)
}

const parts = Object.entries({
  issues: showIssues,
  stream: showTokenStream,
  prettier: showPrettier,
  ast: showPrinted,
  emit: showEmit,
})

const chosen = new Set(
  new URL(location.href).searchParams.get("parts")?.split(","),
)

for (const [k] of parts) {
  const field = hx("input", { class: "size-4", type: "checkbox" })
  const el = hx("label", "flex items-center gap-2 px-4", field, k)
  field.checked = chosen.has(k)
  field.addEventListener("input", () => {
    if (field.checked) {
      chosen.add(k)
    } else {
      chosen.delete(k)
    }
    location.href =
      location.origin +
      "/?parts=" +
      [...chosen].map(encodeURIComponent).join(",")
  })
  show(el)
}

for (const [k, v] of parts) {
  if (chosen.has(k)) {
    v()
  }
}
