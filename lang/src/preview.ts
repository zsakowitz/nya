import { h, hx } from "@/jsx"
import { doc } from "prettier"
import REGL from "regl"
import source from "../examples/test.nya"
import { Code } from "./ast/issue"
import { ORAngle, ORBrace, ORBrack, ORParen } from "./ast/kind"
import { parse, parseBlockContents } from "./ast/parse"
import { print } from "./ast/print"
import { createStream, TokenGroup } from "./ast/stream"
import { Token } from "./ast/token"
import { many } from "./bench"
import {
  Block,
  createExports,
  emitExprBlock,
  emitItem,
  NYA_LANG_TEST_PRELUDE,
  performCall,
} from "./emit/emit"
import { issue } from "./emit/error"
import { name, names } from "./emit/id"
import { EmitProps, type Lang } from "./emit/props"
import { createStdlibDecls } from "./emit/stdlib"
import { printVanilla } from "./prettier"
import { UNPRINTED } from "./prettier/print"

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

function showEmit(lang: Lang) {
  try {
    console.time("emit " + lang)
    const decl = createStdlibDecls()
    const props = new EmitProps(lang)
    const exportsActual: Record<string, string[]> = Object.create(null)
    const exportsTypeOnly: Record<string, string[]> = Object.create(null)
    const res = result.items
      .map((x) => {
        const result = emitItem(x, decl, props)

        for (const exp of result?.exports?.actual ?? []) {
          ;(exportsActual[exp.exported] ??= []).push(exp.internal)
        }
        for (const exp of result?.exports?.typeOnly ?? []) {
          ;(exportsTypeOnly[exp.exported] ??= []).push(exp.internal)
        }

        if (result?.typeOnly) {
          return [
            h("opacity-30 select-none", result.typeOnly),
            "\n",
            result.actual,
          ]
        } else if (result?.actual) {
          return result.actual
        }

        return null
      })
      .filter((x) => x != null)
      .flatMap((x, i) => (i == 0 ? x : ["\n", ...x]))
    console.timeEnd("emit " + lang)
    const exports1 = Object.entries(exportsActual)
      .map(([as, of]) => createExports(of, as, false))
      .join("\n")
    const exports2 = Object.entries(exportsTypeOnly)
      .map(([as, of]) => createExports(of, as, true))
      .join("\n")
    const exports =
      exports2 ?
        [exports1, "\n", h("opacity-30 select-none", exports2)]
      : [exports1]
    if (exports) {
      res.push("\n")
      res.push(...exports)
    }
    hr()
    pre(h("", ...res))
  } catch (e) {
    hr()
    pre(String(e))
    console.error("[script emit]", e)
  }
}

function showEmitTestsGl(lang: "glsl") {
  let fragDebug
  try {
    console.time("emit " + lang)
    const decl = createStdlibDecls()
    const props = new EmitProps(lang)
    const emit = result.items
      .map((x) => emitItem(x, decl, props)?.actual)
      .filter((x) => x != null)
      .join("\n")
    console.timeEnd("emit " + lang)
    const cv = hx("canvas", {
      width: "800",
      height: "800",
      class: "size-[400px] ml-4",
    })
    const gl = cv.getContext("webgl2")!
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    const regl = REGL(gl)
    const mainFn = decl.fns.get(name`main`)?.[0]
    if (!mainFn) {
      throw new Error("No 'main' function was declared.")
    }
    if (mainFn.args.length != 1) {
      throw new Error("'main' should accept a single argument.")
    }
    const r1 = mainFn.args[0]!.type.repr
    if (!(r1.type == "vec" && r1.of == "float" && r1.count == 2)) {
      throw new Error("'main' should accept a struct of 2 'num'.")
    }
    const r2 = mainFn.ret.repr
    if (!(r2.type == "vec" && r2.of == "float" && r2.count == 4)) {
      throw new Error("'main' should return a struct of 4 'num'.")
    }
    const frag =
      "#version 300 es\nprecision highp float;\nin vec4 pos;\nout vec4 color;\n" +
      emit +
      `
void main() {
  color = ${mainFn.id.ident()}(pos.xy);
}`
    fragDebug = frag
      .split("\n")
      .map((x, i) => i.toString().padStart(3) + " " + x)
      .join("\n")
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
    show(cv)
    program()
  } catch (e) {
    if (fragDebug) {
      hr()
      pre(fragDebug)
    }
    hr()
    pre(String(e))
    console.error("[glsl emit]", e)
  }
}

function showEmitTests(lang: Lang) {
  try {
    console.time("emit " + lang)
    const decl = createStdlibDecls()
    const props = new EmitProps(lang)
    const res =
      NYA_LANG_TEST_PRELUDE +
      result.items
        .map((x) => emitItem(x, decl, props)?.actual)
        .filter((x) => x != null)
        .join("\n") +
      "\nNYA_TEST.report();"
    console.timeEnd("emit " + lang)
    console.time("run tests")
    const data: string[] = (0, eval)(res)
    console.timeEnd("run tests")
    hr()
    pre(data.join("\n"))
  } catch (e) {
    hr()
    pre(String(e))
    console.error("[script emit]", e)
  }
}

function showEmitBenchmark(lang: Lang) {
  function once() {
    const decl = createStdlibDecls()
    const props = new EmitProps(lang)
    result.items.forEach((x) => emitItem(x, decl, props))
  }

  const m0 = performance.now()

  once()
  const m1 = performance.now()

  for (let i = 0; i < 10; i++) once()
  const m10 = performance.now()

  for (let i = 0; i < 1000; i++) once()
  const m1000 = performance.now()

  for (let i = 0; i < 10000; i++) once()
  const m10000 = performance.now()

  hr()
  pre(`Benchmark results for '${lang}'
    1x: ${(m1 - m0).toFixed(4)}
   10x: ${((m10 - m1) / 10).toFixed(4)}
 1000x: ${((m1000 - m10) / 1000).toFixed(4)}
10000x: ${((m10000 - m1000) / 10000).toFixed(4)}
`)
}

function createRepl(lang: Lang) {
  const decl = createStdlibDecls()
  const props = new EmitProps(lang)
  const emit = result.items
    .map((x) => emitItem(x, decl, props)?.actual)
    .filter((x) => x != null)
    .join("\n")

  const complex = decl.types.get(names.of("complex"))
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
      const block = new Block(decl, props)
      if (lang == "glsl") {
        block.locals.init(names.of("z"), { value: "POS", type: complex })
      }
      let ret = emitExprBlock(expr, block)
      if (lang == "glsl") {
        ret = performCall(names.of("plot"), block, [ret])
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
      return `${block.source}${ret.value ? "return(" + ret.value + ");" : ""}`
    },
  }
}

function createCanvas() {
  const cv = hx("canvas", {
    width: "800",
    height: "800",
    class: "size-[400px]",
  })
  const gl = cv.getContext("webgl2")!
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
  const { emit: emitJs, run: runJs } = createRepl(lang)
  const { emit: emitGl, run: runGl } = createRepl(langGl)
  const { cv, go: showGl } = createCanvas()
  const area = hx("textarea", {
    class:
      "block resize-y w-96 min-h-40 border border-[--nya-border] rounded font-mono px-2 py-1 focus:border-[--nya-expr-focus] focus:ring-1 ring-[--nya-expr-focus] focus:outline-none bg-[--nya-bg]",
    spellcheck: "false",
  })
  const ret = hx(
    "output",
    "block w-96 min-h-40 border border-[--nya-border] rounded font-mono px-2 py-1 bg-[--nya-bg]",
  )
  const time = hx(
    "output",
    "block w-96 border border-[--nya-border] rounded font-mono px-2 py-1 bg-[--nya-bg]",
    "No timing available.",
  )
  hr()
  show(
    h(
      "flex pl-4 py-4 gap-4",
      h("flex flex-col h-full gap-4", area, ret, time),
      cv,
    ),
  )
  cv.classList.add("opacity-0")
  area.addEventListener("input", () => {
    const start = performance.now()
    try {
      if (area.value.replace(/\/\/[^\n]*/g, "").match(/\bz\b/)) {
        cv.classList.remove("opacity-0")
        ret.value = "Previewing as shader since variable 'z' was used."
        const value = runGl(area.value)
        showGl(emitGl, value)
      } else {
        cv.classList.add("opacity-0")
        const value = runJs(area.value)
        ret.value = JSON.stringify(
          (0, eval)(`${emitJs};(()=>{${value}})()`),
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
}

function showParseBenchmark(lang: Lang) {
  console.profile()
  hr()
  pre(many(lang, 5, 1e3).trim())
  console.profileEnd()
}

const parts = Object.entries({
  issues: showIssues,
  stream: showTokenStream,
  prettier: showPrettier,
  ast: showPrinted,

  "repl-js:native": () => showJointRepl("js:native", "glsl"),

  "parse-js:native": () => showParseBenchmark("js:native"),

  "bench-js:native": () => showEmitBenchmark("js:native"),
  "bench-js:native-tests": () => showEmitBenchmark("js:native-tests"),
  "bench-glsl": () => showEmitBenchmark("glsl"),

  "emit-js:native": () => showEmit("js:native"),
  "emit-js:native-tests": () => showEmit("js:native-tests"),
  "emit-glsl": () => showEmit("glsl"),

  "test-js:native-tests": () => showEmitTests("js:native-tests"),

  "preview-glsl": () => showEmitTestsGl("glsl"),
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
