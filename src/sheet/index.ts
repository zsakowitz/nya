import type { AstBinding } from "../eval/ast/token"
import { Bindings, id, name } from "../eval/binding"
import {
  defaultPropsGlsl,
  defaultPropsJs,
  glsl,
  js,
  type PropsGlsl,
  type PropsJs,
} from "../eval/eval"
import { declareAddR64 } from "../eval/ops/op/add"
import { declareMulR64 } from "../eval/ops/op/mul"
import { OP_PLOT } from "../eval/ops/op/plot"
import type { GlslValue, JsValue, SReal } from "../eval/ty"
import { display, outputBase } from "../eval/ty/display"
import { splitRaw } from "../eval/ty/split"
import { Field } from "../field/field"
import { FieldInert } from "../field/field-inert"
import { h, hx, p, svgx } from "../field/jsx"
import { D, L, R, U, type Dir, type VDir } from "../field/model"
import type { Exts, Options as FieldOptions } from "../field/options"
import {
  createDrawAxes,
  doDrawCycle,
  doMatchSize,
  onPointer,
  onScroll,
  onTouch,
  onWheel,
  Paper,
} from "./paper"
import { doMatchReglSize } from "./regl"
import regl = require("regl")

export interface Options {
  field: FieldOptions
}

class ExprField extends Field {
  constructor(readonly expr: Expr) {
    super(expr.sheet.exts, expr.sheet.options.field)

    this.el.classList.add(
      "border-[1rem]",
      "border-transparent",
      "min-w-full",
      "focus:outline-none",
    )

    this.el.addEventListener("focus", () => {
      this.expr.sheet.onExprFocus?.(expr)
    })
  }

  onAfterChange(wasChangeCanceled: boolean): void {
    super.onAfterChange(wasChangeCanceled)
    if (!wasChangeCanceled) {
      this.expr?.sheet.onExprChange?.(this.expr)
    }
  }

  onVertOut(towards: VDir): void {
    const next =
      this.expr.sheet.exprs[this.expr.index + (towards == U ? -1 : 1)]

    if (next) {
      next.field.el.focus()
    } else if (towards == D) {
      const expr = new Expr(this.expr.sheet)
      setTimeout(() => expr.field.el.focus())
    }
  }

  onDelOut(towards: Dir): void {
    if (!this.expr.field.block.isEmpty()) {
      return
    }

    const index = this.expr.index

    if (this.expr.removable) {
      this.expr.sheet.exprs.splice(index, 1)
      this.expr.el.remove()
      this.expr.sheet.checkIndices()
    }

    const nextIndex =
      !this.expr.removable ?
        towards == L ?
          Math.max(0, index - 1)
        : index + 1
      : towards == L ? Math.max(0, index - 1)
      : index

    const next = this.expr.sheet.exprs[nextIndex]

    if (next) {
      next.field.onBeforeChange()
      next.field.sel = next.field.block.cursor(towards == L ? R : L).selection()
      next.field.onAfterChange(false)
      next.field.el.focus()
    } else {
      const expr = new Expr(this.expr.sheet)
      setTimeout(() => expr.field.el.focus())
    }
  }
}

let k = 0
export function circle() {
  const KINDS = ["shader"] as const
  const kind = KINDS[k++ % KINDS.length]!
  switch (kind) {
    case "shader":
      // prettier-ignore
      return h(
        "relative block bg-white size-8 rounded-full mx-0.5 overflow-clip group-focus-within:outline outline-2 outline-blue-500",
        h("size-[27.27%] top-[00.00%] left-[00.00%] absolute bg-red-300 rounded-br-[25%]"),
        h("size-[27.27%] top-[00.00%] left-[36.36%] absolute bg-yellow-300 rounded-b-[25%]"),
        h("size-[27.27%] top-[00.00%] left-[72.72%] absolute bg-fuchsia-300 rounded-bl-[25%]"),
        h("size-[27.27%] top-[36.36%] left-[00.00%] absolute bg-blue-300 rounded-r-[25%]"),
        h("size-[27.27%] top-[36.36%] left-[36.36%] absolute bg-slate-400 rounded-[25%]"),
        h("size-[27.27%] top-[36.36%] left-[72.72%] absolute bg-green-300 rounded-l-[25%]"),
        h("size-[27.27%] top-[72.72%] left-[00.00%] absolute bg-slate-300 rounded-tr-[25%]"),
        h("size-[27.27%] top-[72.72%] left-[36.36%] absolute bg-purple-300 rounded-t-[25%]"),
        h("size-[27.27%] top-[72.72%] left-[72.72%] absolute bg-orange-300 rounded-tl-[25%]"),
      )
  }
}

export class Expr {
  static id = 0

  readonly field

  readonly el
  readonly elIndex
  readonly elCircle
  readonly elValue
  readonly elValueError
  readonly elGlslError
  readonly elScroller

  binding?: AstBinding

  removable = true
  index

  constructor(readonly sheet: Sheet) {
    this.sheet.exprs.push(this)
    this.field = new ExprField(this)
    this.el = h(
      "border-b border-slate-200 grid grid-cols-[2.5rem,auto] relative group focus-within:border-[color:--nya-focus] max-w-full",
      h(
        "inline-flex bg-slate-100 flex-col p-0.5 group-focus-within:bg-[color:--nya-focus] border-r border-slate-200 group-focus-within:border-transparent",
        (this.elIndex = h(
          "text-[65%] [line-height:1] text-slate-500 group-focus-within:text-white",
          "" + this.sheet.exprs.length,
        )),
        (this.elCircle = circle()),
      ),
      h(
        "flex flex-col w-full max-w-full",
        (this.elScroller = h(
          "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] max-w-[calc(var(--nya-sheet-sidebar)_-_2.5rem)]",
          this.field.el,
        )),
        (this.elValue = new FieldInert(this.field.exts, this.field.options)).el,
        (this.elValueError = h(
          "leading-tight block pb-1 -mt-2 mx-1 px-1 italic text-red-800 hidden whitespace-pre-wrap",
        )),
        (this.elGlslError = h(
          "leading-tight block pb-1 -mt-2 mx-1 px-1 italic text-yellow-800 hidden whitespace-pre-wrap",
        )),
      ),
      h(
        "absolute -inset-y-px right-0 left-0 border-2 border-[color:--nya-focus] hidden group-focus-within:block pointer-events-none [:first-child>&]:top-0",
      ),
    )
    this.field.el.addEventListener("keydown", (event) => {
      if (event.key == "Enter" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        const expr = new Expr(this.sheet)
        this.sheet.exprs.splice(expr.index, 1)
        this.sheet.exprs.splice(this.index + 1, 0, expr)
        this.sheet.checkIndices()
        const before =
          this.sheet.exprs[expr.index + 1]?.el ?? this.sheet.elNextExpr
        this.sheet.elExpressions.insertBefore(expr.el, before)
        setTimeout(() => before.scrollIntoView({ behavior: "instant" }))
        setTimeout(() => expr.field.el.focus())
      }
    })
    sheet.elExpressions.insertBefore(this.el, sheet.elExpressions.lastChild)
    this.sheet.checkNextIndex()
    this.index = this.sheet.exprs.length - 1
    this.elValue.el.classList.add(
      "block",
      "bg-slate-100",
      "border",
      "border-slate-200",
      "rounded",
      "px-2",
      "py-1",
      "mx-2",
      "mb-2",
      "-mt-2",
      "self-end",
    )
  }

  displayEval(value: JsValue, base: SReal) {
    this.elValue.el.classList.remove("hidden")
    this.elValueError.classList.add("hidden")
    display(this.elValue, value, base)
  }

  displayError(reason: Error) {
    this.elValue.el.classList.add("hidden")
    this.elValueError.classList.remove("hidden")
    this.elValueError.textContent = reason.message
  }

  checkIndex() {
    this.elIndex.textContent = "" + this.sheet.exprs.indexOf(this)
    this.index = this.sheet.exprs.length - 1
  }

  checkBinding() {
    try {
      var node = this.field.block.expr()
    } catch {
      this.binding = undefined
      return
    }

    if (node.type == "binding") {
      this.binding = node
    } else {
      this.binding = undefined
    }
  }

  debug() {
    try {
      var node = this.field.block.ast()
    } catch (e) {
      console.error(e)
      this.displayError(e instanceof Error ? e : new Error(String(e)))
      return
    }

    try {
      const props = this.sheet.propsJs()
      const value = js(node, props)
      const base = outputBase(node, props)
      this.displayEval(value, base)
    } catch (e) {
      console.error(e)
      this.elGlslError.classList.add("hidden")
      this.displayError(e instanceof Error ? e : new Error(String(e)))
    }

    try {
      const props = this.sheet.propsGlsl()
      const value = OP_PLOT.glsl(props.ctx, glsl(node, props))
      if (value.list) {
        throw new Error("Cannot draw a list of colors.")
      }
      declareAddR64(props.ctx)
      declareMulR64(props.ctx)
      const frag = `#version 300 es
precision highp float;
out vec4 color;
vec4 v_coords;
uniform vec2 u_scale;
uniform vec2 u_cx;
uniform vec2 u_cy;
uniform vec4 u_px_per_unit;
${props.ctx.helpers.helpers}void main() {
vec2 e_tx = vec2(gl_FragCoord.x, 0);
vec2 e_ty = vec2(gl_FragCoord.y, 0);
v_coords = vec4(
  _helper_add_r64(u_cx, _helper_mul_r64(e_tx, u_scale)),
  _helper_add_r64(u_cy, _helper_mul_r64(e_ty, u_scale))
);
${props.ctx.block}color = ${value.expr};
      }
      `
      this.sheet.regl.clear({
        color: [0, 0, 0, 1],
        depth: 1,
      })
      const program = this.sheet.regl({
        frag,

        vert: `#version 300 es
precision highp float;
in vec2 position;
void main() {
  gl_Position = vec4(position, 0, 1);
}
`,

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

        uniforms: {
          // @ts-expect-error regl requires generics in weird places
          u_scale: this.sheet.regl.prop("u_scale"),
          // @ts-expect-error
          u_cx: this.sheet.regl.prop("u_cx"),
          // @ts-expect-error
          u_cy: this.sheet.regl.prop("u_cy"),
          // @ts-expect-error
          u_px_per_unit: this.sheet.regl.prop("u_px_per_unit"),
        },

        count: 6,
      })
      const myId = ++Expr.id
      const draw = () => {
        if (myId != Expr.id) return
        const { xmax, xmin, ymin, ymax } = this.sheet.paper.bounds()
        program({
          u_scale: splitRaw(
            (xmax - xmin) / this.sheet.regl._gl.drawingBufferWidth,
          ),
          u_cx: splitRaw(xmin),
          u_cy: splitRaw(ymin),
          u_px_per_unit: [
            ...splitRaw(this.sheet.paper.el.clientWidth / (xmax - xmin)),
            ...splitRaw(this.sheet.paper.el.clientHeight / (ymax - ymin)),
          ],
        })
        requestAnimationFrame(draw)
      }
      draw()

      this.elGlslError.classList.add("hidden")
    } catch (e) {
      console.error(e)
      this.elGlslError.textContent = e instanceof Error ? e.message : String(e)
      this.elGlslError.classList.remove("hidden")
    }
  }
}

export class Sheet {
  readonly exprs: Expr[] = []
  readonly paper = new Paper()

  readonly el
  readonly elExpressions
  readonly elNextIndex
  readonly elNextExpr
  readonly elLogo
  readonly elShaderCanvas
  readonly elPixelRatio

  readonly regl

  readonly pixelRatio
  readonly setPixelRatio

  constructor(
    readonly exts: Exts,
    readonly options: Options,
  ) {
    this.paper.el.classList.add("size-full")
    doMatchSize(this.paper)
    doDrawCycle(this.paper)
    onWheel(this.paper)
    onScroll(this.paper)
    onPointer(this.paper)
    onTouch(this.paper)
    createDrawAxes(this.paper)

    const elExpressions = (this.elExpressions = h(
      "block",
      (this.elNextExpr = h(
        "grid grid-cols-[2.5rem,auto] relative pointernya-cursor",
        h(
          "inline-flex bg-slate-100 flex-col p-0.5",
          (this.elNextIndex = h(
            "text-[65%] [line-height:1] text-slate-500",
            "1",
          )),
        ),
        h(
          "font-['Symbola','Times_New_Roman',sans-serif] [line-height:1] min-h-[3.265rem]",
        ),
        h(
          "absolute inset-0 size-full from-transparent to-white bg-gradient-to-b",
        ),
      )),
    ))

    this.elNextExpr.addEventListener("mousedown", () => {
      const expr = new Expr(this)
      setTimeout(() => expr.field.el.focus())
    })

    this.el = h(
      "block fixed inset-0 grid grid-cols-[600px_1fr] grid-rows-1 select-none [--nya-focus:theme(colors.blue.400)]",
      h(
        "block overflow-y-auto relative border-r border-slate-200",
        h(
          "flex flex-col h-16 w-full bg-slate-100 border-b border-slate-200 sticky top-0 z-10 items-center justify-center",
          h(
            "font-['Symbola','Times_New_Roman',serif] text-2xl leading-tight text-slate-500",
            "project nya",
          ),
          h(
            "font-['Symbola','Times_New_Roman',serif] text-sm leading-none italic text-slate-500",
            REMARK,
          ),
        ),
        elExpressions,
      ),
      h(
        "relative",
        (this.elShaderCanvas = hx(
          "canvas",
          "absolute inset-0 size-full pointer-events-none [image-rendering:pixelated]",
        )),
        this.paper.el,
        h(
          "absolute block top-0 bottom-0 left-0 w-1 from-slate-950/10 to-transparent bg-gradient-to-r",
        ),
        h(
          "absolute flex flex-col top-2 right-2",
          h(
            "flex w-48 bg-white h-8 outline outline-black/10 rounded shadow",
            (this.elPixelRatio = hx("input", {
              type: "range",
              min: "1",
              max: "16",
              step: "any",
              class: "flex-1 m-auto mx-4",
            })),
          ),
          // h(
          //   "flex size-8 border shadow border-slate-300 bg-slate-100 rounded",
          //   fa(faHomeLg, "m-auto size-4 fill-slate-500"),
          // ),
        ),
      ),
      (this.elLogo = hx(
        "button",
        "absolute bottom-0 right-0 p-2",
        svgx(
          "0 0 20 16",
          "w-8 fill-slate-400",
          p(
            "M7 0 5 0A1 1 0 004 1L4 3A1 1 0 005 4L7 4A1 1 0 008 3L8 1A1 1 0 007 0ZM3 8 1 8A1 1 0 000 9L0 11A1 1 0 001 12L3 12A1 1 0 014 13L4 15A1 1 0 005 16L7 16 7 16A1 1 0 008 15L8 13A1 1 0 019 12L11 12A1 1 0 0112 13L12 15A1 1 0 0013 16L15 16A1 1 0 0016 15L16 13A1 1 0 0117 12L19 12A1 1 0 0020 11L20 9A1 1 0 0019 8L17 8A1 1 0 0016 9L16 11A1 1 0 0115 12L13 12A1 1 0 0112 11L12 9A1 1 0 0011 8L9 8A1 1 0 008 9L8 11A1 1 0 017 12L5 12A1 1 0 014 11L4 9A1 1 0 003 8ZM15 0 13 0A1 1 0 0012 1L12 3A1 1 0 0013 4L15 4A1 1 0 0016 3L16 1A1 1 0 0015 0Z",
          ),
        ),
      )),
    )

    this.regl = regl({
      canvas: this.elShaderCanvas,
      gl: this.elShaderCanvas.getContext("webgl2")!,
      pixelRatio: 1,
    })
    ;[this.pixelRatio, this.setPixelRatio] = doMatchReglSize(
      this.elShaderCanvas,
      this.regl,
    )
    this.elPixelRatio.value = "" + this.pixelRatio()
    this.elPixelRatio.addEventListener("input", () => {
      this.setPixelRatio(+this.elPixelRatio.value)
    })
    this.paper.el.classList.add("absolute", "inset-0")

    new ResizeObserver((entries) => {
      const entry = entries[0]!
      const { width } = entry.contentRect
      this.el.style.setProperty("--nya-sheet-sidebar", width + "px")
    }).observe(this.elExpressions)
  }

  propsJs() {
    const map: Record<string, JsValue | undefined> = Object.create(null)
    const bindings = new Bindings(map)
    const props: PropsJs = { ...defaultPropsJs(), bindings }
    for (const expr of this.exprs) {
      if (!expr.binding || expr.binding.args) {
        continue
      }

      const myId = id(expr.binding.name)
      const myName = name(expr.binding.name)
      const value = expr.binding.value
      Object.defineProperty(map, myId, {
        configurable: true,
        enumerable: true,
        get() {
          try {
            return js(value, props)
          } catch (e) {
            if (e instanceof RangeError && e.message.includes("stack")) {
              throw new Error(`Cycle detected when accessing ${myName}.`)
            } else {
              throw e
            }
          }
        },
      })
    }
    return props
  }

  propsGlsl() {
    const map: Record<string, GlslValue | undefined> = Object.create(null)
    const bindings = new Bindings(map)
    const props: PropsGlsl = { ...defaultPropsGlsl(), bindings }
    for (const expr of this.exprs) {
      if (!expr.binding || expr.binding.args) {
        continue
      }

      const myId = id(expr.binding.name)
      const myName = name(expr.binding.name)
      const value = expr.binding.value
      Object.defineProperty(map, myId, {
        configurable: true,
        enumerable: true,
        get() {
          try {
            return glsl(value, props)
          } catch (e) {
            if (e instanceof RangeError && e.message.includes("stack")) {
              throw new Error(`Cycle detected when accessing ${myName}.`)
            } else {
              throw e
            }
          }
        },
      })
    }
    return props
  }

  checkIndices() {
    for (let i = 0; i < this.exprs.length; i++) {
      this.exprs[i]!.elIndex.textContent = i + 1 + ""
      this.exprs[i]!.index = i
    }
    this.checkNextIndex()
  }

  checkNextIndex() {
    this.elNextIndex.textContent = this.exprs.length + 1 + ""
  }

  onExprFocus(expr: Expr): void {
    expr.debug()
  }

  queued: Expr | undefined

  queue(expr: Expr) {
    if (this.queued) {
      this.queued = expr
      return
    } else {
      this.queued = expr
    }
    setTimeout(() => {
      this.exprs.forEach((x) => x.checkBinding())
      this.exprs.forEach((x) => x.debug())
      this.queued!.debug()
    })
  }

  onExprChange(expr: Expr): void {
    expr.debug()
    this.queue(expr)
  }
}

const REMARKS = [
  "the graphpaper is only for aesthetics",
  "it turned my laptop into molten metal!",
  "sounds like a rhythm game",
  "how to type hex digits 10-15? just don't!",
  "oh god why doesn't it round 10^-16 to zero",
  "nobody knows what the sidebar does",
  "because you wanted desmos to be open source",
  "its developers thought ≱ was useful",
  "what is the logo hiding",
  "the ‘go to sleep’ node type is not implemented yet",
  "nya? like the cat noise? (yes)",
  "what even does ⊙ do",
  "it can write decimals in base 5, but not read them",
  "it has uscript support",
  "easier to extend than a tungsten cube",
  "variables are for silly people",
  "my favorite color palette: modern house",
  "i still don't know why it exists",
  "they added \\over before y=2",
  "mrrp meow",
  "how even do you grow the piecewise function",
  "it’s like ithkuil decomposer, but totally different",
  "it’s shaders for the rest of us",
  "tbh it’s only so sakawi can say ‘nya’ more",
  "car <3",
  "where bedtime is 29:00",
  "brought to you by sleep deprivation",
  "sponsored by zSnout",
  "in awe of the desmos team tbh",
  "we once defined eˣ to just be x 😭",
  "its order of operations is so cursed",
  "now with vertical lists!",
  "first class support for typing matrices",
  "oklch >>> hsv",
  "our fractals are so good it’s silly",
  "currently on type system #3",
  "where numbers come in three precision levels",
  "even our colors can be approximate",
]

const REMARK = REMARKS[Math.floor(REMARKS.length * Math.random())]!
