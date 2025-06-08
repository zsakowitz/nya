import { createDrawAxes } from "#/list/gridlines"
import { h, hx, t } from "@/jsx"
import { Cv } from "@/sheet/ui/cv"
import { OrderMajor } from "@/sheet/ui/cv/consts"
import {
  registerPinchHandler,
  registerPointerHandler,
  registerWheelHandler,
} from "@/sheet/ui/cv/move"
import FuzzySearch from "fuzzy-search"
import { formatWithCursor } from "prettier"
import REGL from "regl"
import { Chunk, Issues, PosVirtual } from "../ast/issue"
import { parse, parseBlockContents } from "../ast/parse"
import { createStream } from "../ast/stream"
import { Block, Exits } from "../emit/decl"
import { emitBlock, emitItem, performCall } from "../emit/emit"
import { issue } from "../emit/error"
import { ident } from "../emit/id"
import { EmitProps, type Lang } from "../emit/props"
import { createStdlib } from "../emit/stdlib"
import type { Type } from "../emit/type"
import { Value } from "../emit/value"
import * as plugin from "../prettier/plugin"
import { mini, source } from "./source"

const cv = new Cv("absolute inset-0 size-full touch-none")

const area = hx("textarea", {
  class:
    "block resize-none h-full w-full border-r border-b border-[--nya-border] font-mono p-2 focus:border-[--nya-expr-focus] focus:ring-1 ring-[--nya-expr-focus] focus:outline-none bg-[--nya-bg] text-sm",
  spellcheck: "false",
})
const ret = hx(
  "output",
  "block resize-none h-full w-full border-r border-t border-[--nya-border] font-mono p-4 bg-[--nya-bg] text-xs whitespace-pre-wrap text-[--nya-prose]",
)
const lib = createAutocomplete()
createFormatter()

function createFormatter() {
  area.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && e.ctrlKey != e.metaKey) {
      format()
    }
  })

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
}

function createAutocomplete() {
  const issues = new Issues()
  const props = new EmitProps("js")
  const stdlib = createStdlib(props)
  for (const chunk of source) {
    const stream = createStream(chunk, issues, { comments: false })
    for (const item of parse(stream).items) emitItem(item, stdlib)
  }

  const allNames = stdlib.fns.map((x) => x[0]!.id.label)
  const search = new FuzzySearch(allNames, undefined, { sort: true })
  const libnow = t("")
  const lib = h(
    "overflow-y-auto absolute top-0 left-0 w-full h-full flex flex-col font-mono text-xs whitespace-pre-wrap text-[--nya-text-prose] py-4 pl-4",
    h("font-semibold text-[--nya-text]", libnow),
    ...stdlib.fns
      .mapEach(
        (fn) => [fn.id.label, h("-indent-4 pl-4", fn.toString())] as const,
      )
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map((x) => x[1]),
  )
  async function checkCurrentFn() {
    libnow.data = ""
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
      .map((x) => stdlib.fns.get(ident(x)))
      .filter((x) => x != null)
    if (fns.length) {
      libnow.data =
        fns
          .flat()
          .map((x) => x.toString())
          .join("\n") + "\n\n"
    }
  }
  area.addEventListener("selectionchange", checkCurrentFn)
  area.addEventListener("input", checkCurrentFn)
  return lib
}

function createRepl(lang: Lang) {
  const props = new EmitProps(lang)
  const decl = createStdlib(props)

  const issues = new Issues()
  const emit = source
    .flatMap((chunk) => {
      const stream = createStream(chunk, issues, { comments: false })
      const result = parse(stream)
      return result.items
    })
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
      const stream = createStream(new Chunk("<repl>", uc), new Issues(), {
        comments: false,
      })
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
        ret = performCall(
          ident("plot"),
          block,
          [ret],
          new PosVirtual("automatic plot call in repl"),
          new PosVirtual("automatic plot call in repl"),
        )
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
      return {
        emit: `${block.source}${r ? "return(" + r + ");" : ""}`,
        value: ret,
      }
    },
  }
}

interface CanvasJs {
  sx: number
  sy: number
  ox: number
  oy: number
  x0: number
  x1: number
  y0: number
  y1: number
  wx: number
  wy: number
}

function cvToCanvas(): CanvasJs {
  const { xmin, w, ymin, h } = cv.bounds()
  const { width, height } = cv
  const xs = width / w
  const ys = height
  return {
    sx: xs,
    sy: -ys / h,
    ox: -xmin * xs,
    oy: (ymin * ys) / h + ys,
    x0: xmin,
    x1: xmin + w,
    y0: ymin,
    y1: ymin + h,
    wx: w,
    wy: h,
  }
}

const glCanvas = hx(
  "canvas",
  "absolute w-full h-full top-0 left-0 pointer-events-none",
)
const gl = glCanvas.getContext("webgl2", { premultipliedAlpha: false })!
const regl = REGL({ canvas: glCanvas, gl })
cv.el.insertBefore(glCanvas, cv.el.firstChild)

function createExecutor() {
  const { emit: emitJs, run: runJs, decl } = createRepl("js")
  const { emit: emitGl, run: runGl, decl: declGl } = createRepl("glsl")
  const plot = decl.fns.get(ident("plot")) ?? []
  const canvas = decl.types.get(ident("Canvas"))!
  const path = decl.types.get(ident("Path"))!

  type Path = {
    x: Path2D
    y: [number, number, number]
    z: [number, number, number] // stroke width, stroke opacity, fill opacity
  }

  type Result =
    | { ok: false; error: unknown }
    | { ok: true; lang: "glsl"; emit: string }
    | { ok: true; lang: "js"; value: unknown; type: Type }

  let canvasObjects: ((cv: CanvasJs) => Path)[] = []
  let programs: REGL.DrawCommand[] = []

  function go() {
    canvasObjects.length = 0
    programs.length = 0

    const results = area.value
      .trim()
      .split("\n\n")
      .map((v): Result => {
        try {
          if (/\b[zp]\b/.test(v)) {
            const emit = runGl(v).emit
            const draw = regl({
              attributes: {
                position: [
                  [-1, 1],
                  [-1, -1],
                  [1, 1],
                  [1, -1],
                  [-1, -1],
                  [1, 1],
                ],
              },
              count: 6,
              uniforms: {
                // @ts-expect-error regl requires generics in weird places
                u_scale: regl.prop("u_scale"),
                // @ts-expect-error regl requires generics in weird places
                u_shift: regl.prop("u_shift"),
              },
              vert: `#version 300 es
precision highp float;
in vec2 position;
void main() {
  gl_Position = vec4(position, 0, 1);
}
`,
              frag: `#version 300 es
precision highp float;
out vec4 color;
vec2 POS;
uniform vec2 u_scale;
uniform vec2 u_shift;
${declGl.globals()}
${emitGl}
vec4 get_main() {
  ${emit}
}
void main() {
  POS = gl_FragCoord.xy * u_scale + u_shift;
  color = get_main();
}
`,
            })
            programs.push(draw)
            return { ok: true, lang: "glsl", emit }
          }

          const { emit, value: rawValue } = runJs(v)
          const type = rawValue.type

          const plotFn = plot.find(
            (x) =>
              x.args.length == 2 &&
              x.args[0]!.type == canvas &&
              x.args[1]!.type.canConvertFrom(type) &&
              x.ret == path,
          )
          const plotBlock = new Block(decl, new Exits(null))
          const plotValue = plotFn?.run(
            [new Value("CANVAS", canvas), new Value("VALUE", type)],
            plotBlock,
            new PosVirtual("<canvas>"),
            new PosVirtual("<canvas>"),
          )
          const value = (0, eval)(
            `${decl.globals()}\n${emitJs}\n;(()=>{${emit}})()`,
          )

          if (plotValue) {
            const pv = plotValue.toRuntime()
            canvasObjects.push(
              (0, eval)(`${decl.globals()}${emitJs}
const VALUE=(()=>{${emit}})();
((CANVAS)=>{${plotBlock.source}${pv ? "return(" + pv + ");" : ""}})`),
            )
          }

          return {
            ok: true,
            lang: "js",
            value,
            type,
          }
        } catch (e) {
          return { ok: false, error: e }
        }
      })

    const log = results
      .map((x) =>
        x.ok == true && x.lang == "js" ? JSON.stringify(x.value)
        : x.ok == false ?
          x.error instanceof Error ?
            x.error.message
          : String(x.error)
        : null,
      )
      .filter((x) => x)
      .map((x) => h("block -indent-4 pl-4", x))

    while (ret.firstChild) ret.firstChild.remove()
    ret.append(...log)
    cv.queue()
  }

  function draw() {
    const canvas = cvToCanvas()
    const ctx = cv.ctx

    ctx.resetTransform()
    ctx.scale(cv.scale, cv.scale)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    for (const el of canvasObjects) {
      const path = el(canvas)

      if ((path.z[0] > 0 && path.z[1] > 0) || path.z[2] > 0) {
        ctx.strokeStyle =
          ctx.fillStyle = `rgb(${255 * path.y[0]} ${255 * path.y[1]} ${255 * path.y[2]})`
        ctx.lineWidth = path.z[0]
        ctx.globalAlpha = path.z[2]
        ctx.fill(path.x)
        ctx.globalAlpha = path.z[1]
        ctx.stroke(path.x)
      }
    }
    ctx.globalAlpha = 1
    ctx.resetTransform()
  }

  function drawShader() {
    glCanvas.width = cv.width * cv.scale
    glCanvas.height = cv.height * cv.scale
    regl.poll()
    regl.clear({ color: [0, 0, 0, 0] })
    const p = programs[0]!
    if (!p) return

    const { xmin, w, ymin, h } = cv.bounds()
    p({
      u_scale: [w / gl.drawingBufferWidth, h / gl.drawingBufferHeight],
      u_shift: [xmin, ymin],
    })
  }

  area.addEventListener("input", go)
  cv.fn(OrderMajor.Shader, drawShader)
  cv.fn(OrderMajor.Canvas, draw)
  area.value = mini
  setTimeout(go)
}

createDrawAxes(cv)
registerWheelHandler(cv)
registerPointerHandler(cv, {
  find(): undefined {},
  take() {},
})
registerPinchHandler(cv)

document.body.appendChild(
  h(
    "bg-[--nya-bg] fixed inset-0 grid grid-cols-[min(500px,40vw)_1fr] select-none",
    h(
      "grid grid-cols-1 grid-rows-[20rem_1fr_12rem]",
      area,
      h("flex relative h-full border-r border-[--nya-border]", lib),
      ret,
    ),
    h("relative", cv.el),
  ),
)

createExecutor()
