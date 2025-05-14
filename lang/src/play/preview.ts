import { h, hx, t } from "@/jsx"
import FuzzySearch from "fuzzy-search"
import { doc, formatWithCursor } from "prettier"
import REGL from "regl"
import { Code } from "../ast/issue"
import { ORAngle, ORBrace, ORBrack, ORParen } from "../ast/kind"
import { parse, parseBlockContents } from "../ast/parse"
import { print } from "../ast/print"
import { createStream, TokenGroup } from "../ast/stream"
import { Token } from "../ast/token"
import { Block, Exits } from "../emit/decl"
import { emitBlock, emitItem, performCall } from "../emit/emit"
import { issue } from "../emit/error"
import { ident } from "../emit/id"
import { EmitProps, type Lang } from "../emit/props"
import { createStdlib } from "../emit/stdlib"
import { Value } from "../emit/value"
import { printVanilla } from "../prettier"
import * as plugin from "../prettier/plugin"
import { UNPRINTED } from "../prettier/print"
import { source } from "./source"

console.time("stream")
export const stream = createStream(source, { comments: false })
console.timeEnd("stream")

console.time("parse")
export const result = parse(stream)
console.timeEnd("parse")

show(
  hx(
    "h2",
    "text-center pt-4 text-lg font-semibold",
    `nyalang debug window — ${Math.random().toString().slice(2, 6)}`,
  ),
)

function hr() {
  show(
    hx("hr", "border-[--nya-border] mx-4 border-0 border-t first-of-type:mt-4"),
  )
}

function show(el: Node) {
  document.body.appendChild(el)
}

function pre(el: Node | string) {
  const p = hx(
    "pre",
    `select-all p-4 text-xs w-screen text-[--nya-text-prose]`,
    el,
  )
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
  const { formatted } = doc.printer.printDocToString(
    printVanilla(result, source),
    { printWidth: 80, tabWidth: 2 },
  )

  if (UNPRINTED.size) {
    hr()
    pre([...UNPRINTED].join(", "))
  }

  hr()
  const q = pre(formatted)
  q.classList.add("relative")
  q.appendChild(h("absolute left-[80ch] inset-y-4 bg-[--nya-border] w-px"))
}

function showIssues() {
  if (!stream.issues.entries.length) {
    hr()
    pre("No issues found while parsing.")
    return
  }

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

// function showEmitTests(lang: Lang) {
//   try {
//     console.time("emit " + lang)
//     const decl = createStdlib()
//     const props = new EmitProps(lang)
//     const res =
//       NYA_LANG_TEST_PRELUDE +
//       result.items
//         .map((x) => emitItem(x, decl, props)?.actual)
//         .filter((x) => x != null)
//         .join("\n") +
//       "\nNYA_TEST.report();"
//     console.timeEnd("emit " + lang)
//     console.time("run tests")
//     const data: string[] = (0, eval)(res)
//     console.timeEnd("run tests")
//     hr()
//     pre(data.join("\n"))
//   } catch (e) {
//     hr()
//     pre(String(e))
//     console.error("[script emit]", e)
//   }
// }

// function showEmitBenchmark(lang: Lang) {
//   function once() {
//     const decl = createStdlib()
//     const props = new EmitProps(lang)
//     result.items.forEach((x) => emitItem(x, decl))
//   }
//
//   const m0 = performance.now()
//
//   once()
//   const m1 = performance.now()
//
//   for (let i = 0; i < 10; i++) once()
//   const m10 = performance.now()
//
//   for (let i = 0; i < 1000; i++) once()
//   const m1000 = performance.now()
//
//   for (let i = 0; i < 10000; i++) once()
//   const m10000 = performance.now()
//
//   hr()
//   pre(`Benchmark results for '${lang}'
//     1x: ${(m1 - m0).toFixed(4)}
//    10x: ${((m10 - m1) / 10).toFixed(4)}
//  1000x: ${((m1000 - m10) / 1000).toFixed(4)}
// 10000x: ${((m10000 - m1000) / 10000).toFixed(4)}
// `)
// }

function createRepl(lang: Lang) {
  const props = new EmitProps(lang)
  const decl = createStdlib(props)
  const emit = result.items
    .map((x) => emitItem(x, decl)?.decl)
    .filter((x) => x != null)
    .join("\n")

  const point = decl.types.get(ident("Point"))
  if (!point) {
    throw new Error("Expected struct 'Point' to be defined.")
  }
  if (
    !(
      point.repr.type == "vec" &&
      point.repr.count == 2 &&
      point.repr.of == "float"
    )
  ) {
    throw new Error("Expected struct 'Point' to have the layout of a vec2.")
  }

  const complex = decl.types.get(ident("complex"))
  if (!complex) {
    throw new Error("Expected struct 'complex' to be defined.")
  }
  if (
    !(
      complex.repr.type == "vec" &&
      complex.repr.count == 2 &&
      complex.repr.of == "float"
    )
  ) {
    throw new Error("Expected struct 'complex' to have the layout of a vec2.")
  }

  return {
    emit,
    decl,
    run(uc: string) {
      const stream = createStream(uc, { comments: false })
      if (stream.issues.entries.length) {
        issue(stream.issues.entries.join("\n"))
      }
      const expr = parseBlockContents(stream)
      if (stream.issues.entries.length) {
        issue(stream.issues.entries.join("\n"))
      }
      if (!expr) {
        issue("Unable to parse block contents.")
      }
      const block = new Block(decl, new Exits(null))
      if (lang == "glsl") {
        block.locals.init(ident("p"), new Value("POS", point))
        block.locals.init(ident("z"), new Value("POS", complex))
      }
      let ret = emitBlock(expr, block)
      if (lang == "glsl") {
        ret = performCall(ident("plot"), block, [ret])
        if (ret.value == null) {
          issue("A shader example must return a value.")
        }
        const r = ret.type.repr
        if (!(r.type == "vec" && r.count == 4 && r.of == "float")) {
          issue(
            "A shader example must return a vec4-like struct (e.g. a struct with four numeric fields).",
          )
        }
      }
      const r = ret.toRuntime()
      return `${block.source}${r ? "return(" + r + ");" : ""}`
    },
  }
}

function createCanvas() {
  const cv = hx("canvas", {
    width: "800",
    height: "800",
    class: "size-[400px]",
  })
  const gl = cv.getContext("webgl2", { premultipliedAlpha: false })!
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  const regl = REGL(gl)
  return {
    cv,
    go(emit: string, main: string) {
      const frag =
        "#version 300 es\nprecision highp float;\nin vec4 pos;\nout vec4 color;\n" +
        emit +
        `
vec4 actualMain(vec2 POS) {
  ${main}
}
void main() {
  color = actualMain(pos.xy);
}`
      const program = regl({
        vert: `#version 300 es
precision highp float;
in vec2 aVertexPosition;
out vec4 pos;
void main() {
  gl_Position = pos = vec4(aVertexPosition, 0, 1);
}`,
        frag,
        attributes: {
          aVertexPosition: [
            [-1, 1],
            [-1, -1],
            [1, 1],
            [1, -1],
            [-1, -1],
            [1, 1],
          ],
        },
        count: 6,
      })
      program()
    },
  }
}

function showJointRepl(lang: Exclude<Lang, "glsl">, langGl: "glsl") {
  const { emit: emitJs, run: runJs, decl } = createRepl(lang)
  const { emit: emitGl, run: runGl } = createRepl(langGl)
  const { cv, go: showGl } = createCanvas()
  const area = hx("textarea", {
    class:
      "block resize-y min-h-60 border border-[--nya-border] rounded font-mono p-2 focus:border-[--nya-expr-focus] focus:ring-1 ring-[--nya-expr-focus] focus:outline-none bg-[--nya-bg] text-sm",
    spellcheck: "false",
  })
  const ret = hx(
    "output",
    "block min-h-20 border border-[--nya-border] rounded-t font-mono px-2 py-1 bg-[--nya-bg] whitespace-pre-wrap text-sm",
  )
  const time = hx(
    "output",
    "block border border-[--nya-border] font-mono px-2 py-1 bg-[--nya-bg] text-sm border-y-0 -mt-4",
    "No timing available.",
  )
  const formatBtn = hx(
    "button",
    "block border border-[--nya-border] rounded-b font-mono px-2 py-1 bg-[--nya-bg] text-sm -mt-4 text-left",
    "Press Ctrl+Enter or click here to format code.",
  )
  const libnow = t("")
  const lib = h(
    "overflow-y-auto absolute top-0 left-0 w-full h-full flex flex-col font-mono text-xs whitespace-pre-wrap text-[--nya-text-prose]",
    h("font-semibold text-[--nya-text]", libnow),
    ...decl.fns.mapEach((fn) => fn.toString()).join("\n"),
  )
  hr()
  show(
    h(
      "flex pl-4 py-4 gap-4",
      h("flex flex-col h-full gap-4 w-[50ch]", area, ret, time, formatBtn),
      h("flex relative w-[20rem]", lib),
      cv,
    ),
  )
  cv.classList.add("opacity-0")
  area.addEventListener("input", () => {
    checkCurrentFn()
    const start = performance.now()
    try {
      if (area.value.replace(/\/\/[^\n]*/g, "").match(/\b[zp]\b/)) {
        cv.classList.remove("opacity-0")
        ret.value = "Previewing as shader since variable 'z' or 'p' was used."
        const value = runGl(area.value)
        showGl(emitGl, value)
      } else {
        cv.classList.add("opacity-0")
        const value = runJs(area.value)
        ret.value = JSON.stringify(
          (0, eval)(`${emitJs}\n;(()=>{${value}})()`),
          undefined,
          2,
        )
      }
    } catch (e) {
      ret.value = e instanceof Error ? e.message : String(e)
    }
    const ms = performance.now() - start
    time.value = ms.toFixed(1) + "ms"
  })
  area.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && e.ctrlKey != e.metaKey) {
      format()
    }
  })
  area.addEventListener("selectionchange", checkCurrentFn)
  formatBtn.addEventListener("click", format)
  formatBtn.addEventListener("pointerdown", format)
  async function format() {
    const cstart = area.selectionStart
    const { formatted, cursorOffset } = await formatWithCursor(area.value, {
      cursorOffset: cstart,
      plugins: [plugin],
      parser: "nya-parse-block-contents",
      printWidth: 50,
      tabWidth: 2,
    })
    area.value = formatted
    area.setSelectionRange(cursorOffset, cursorOffset, "none")
  }
  const allNames = decl.fns.map((x) => x[0]!.id.label)
  const search = new FuzzySearch(allNames, undefined, { sort: true })
  async function checkCurrentFn() {
    libnow.data = ""
    if (area.selectionStart != area.selectionEnd) {
      return
    }
    const c = area.selectionStart
    const s = area.value
      .slice(0, c)
      .match(/(?:[+\-*\/#~|&@\\=!<>%]+|\w+)\s*(?:\(\s*)?$/)?.[0]
    const e = area.value
      .slice(c)
      .match(/^\s*(?:\w+|[+\-*\/#~|&@\\=!<>%]+)/)?.[0]
    const word = ((s ?? "") + (e ?? "")).match(
      /[+\-*\/#~|&@\\=!<>%]+|[A-Za-z_]\w*/,
    )?.[0]
    if (!word) {
      return
    }
    const fns = search
      .search(word)
      .map((x) => decl.fns.get(ident(x)))
      .filter((x) => x != null)
    if (fns.length) {
      libnow.data =
        fns
          .flat()
          .map((x) => x.toString())
          .join("\n") + "\n\n"
    }
  }
}

const parts = Object.entries({
  Issues: showIssues,
  Playground: () => showJointRepl("js", "glsl"),

  stream: showTokenStream,
  prettier: showPrettier,
  ast: showPrinted,

  //   "bench-js:native": () => showEmitBenchmark("js:native"),
  //   "bench-js:native-tests": () => showEmitBenchmark("js:native-tests"),
  //   "bench-glsl": () => showEmitBenchmark("glsl"),
  //
  //   "emit-js:native": () => showEmit("js:native"),
  //   "emit-js:native-tests": () => showEmit("js:native-tests"),
  //   "emit-glsl": () => showEmit("glsl"),
  //
  //   "test-js:native-tests": () => showEmitTests("js:native-tests"),
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
      "/?nyalang&parts=" +
      [...chosen].map(encodeURIComponent).join(",")
  })
  show(el)
}

for (const [k, v] of parts) {
  if (chosen.has(k)) {
    v()
  }
}
