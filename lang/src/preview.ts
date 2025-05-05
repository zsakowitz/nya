import { h, hx } from "@/jsx"
import { doc } from "prettier"
import REGL from "regl"
import source from "../examples/test.nya"
import { Code } from "./ast/issue"
import { ORAngle, ORBrace, ORBrack, ORParen } from "./ast/kind"
import { parse } from "./ast/parse"
import { print } from "./ast/print"
import { createStream, TokenGroup } from "./ast/stream"
import type { Token } from "./ast/token"
import { many } from "./bench"
import { createExports, emitItem, NYA_LANG_TEST_PRELUDE } from "./emit/emit"
import { name } from "./emit/id"
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

        return [h("opacity-30 select-none", "// <null>")]
      })
      .flatMap((x, i) => (i == 0 ? x : ["\n\n", ...x]))
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
      res.push("\n\n")
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
