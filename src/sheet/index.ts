import { glsl } from "../eval/glsl"
import { js } from "../eval/js"
import { hex } from "../eval/lib/binding"
import { declareAddR64 } from "../eval/ops/op/add"
import { declareMulR64 } from "../eval/ops/op/mul"
import { OP_PLOT } from "../eval/ops/op/plot"
import type { JsValue, SReal } from "../eval/ty"
import { frac, num, real } from "../eval/ty/create"
import { Display, display, outputBase } from "../eval/ty/display"
import { splitRaw } from "../eval/ty/split"
import { OpEq } from "../field/cmd/leaf/cmp"
import { CmdComma } from "../field/cmd/leaf/comma"
import { CmdVar } from "../field/cmd/leaf/var"
import { CmdBrack } from "../field/cmd/math/brack"
import { FieldInert } from "../field/field-inert"
import { h, hx, p, svgx } from "../field/jsx"
import { Block, D, L, R, U, type Dir, type VDir } from "../field/model"
import type { Exts, Options as FieldOptions } from "../field/options"
import { FieldComputed, Scope } from "./deps"
import {
  createDrawAxes,
  doDrawCycle,
  doMatchSize,
  onScroll,
  onWheel,
  Paper,
  registerPanAndZoom,
  type Point,
  type PointerHandlers,
} from "./paper"
import { doMatchReglSize } from "./regl"
import { Slider } from "./slider"
import regl = require("regl")

export interface Options {
  field: FieldOptions
}

class ExprField extends FieldComputed {
  constructor(readonly expr: Expr) {
    super(expr.sheet.scope)

    this.el.classList.add(
      "border-[1rem]",
      "border-transparent",
      "min-w-full",
      "focus:outline-none",
    )
  }

  recompute(): void {
    this.expr.debug()
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

export type CircleKind = "shader" | "empty"

export function circle(kind: CircleKind) {
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
    case "empty":
      return h(
        "relative block bg-slate-100 size-8 rounded-full mx-0.5 border-4 border-slate-300 group-focus-within:border-blue-500",
      )
  }
}

export class ExprSlider {
  private readonly slider = new Slider()

  private readonly fmin
  private readonly fmax
  readonly el

  constructor(readonly expr: Expr) {
    this.fmin = new FieldInert(
      this.expr.field.exts,
      this.expr.field.options,
      "pb-2 font-sans",
    )
    this.fmax = new FieldInert(
      this.expr.field.exts,
      this.expr.field.options,
      "pb-2 font-sans",
    )
    this.el = h(
      "flex text-[0.7rem] items-center text-slate-500 px-3 -mt-2",
      this.fmin.el,
      this.slider.el,
      this.fmax.el,
    )
    this.slider.el.className += " px-1 pb-2 pt-2 -mt-2 cursor-pointer"
    this.slider.onInput = () => {
      const value = this.slider.value
      if (this.expr.field.ast.type != "binding") return
      const v = this.expr.field.ast.name
      this.expr.field.block.clear()
      const cursor = this.expr.field.block.cursor(R)
      CmdVar.leftOf(cursor, v, expr.field.options)
      new OpEq(false).insertAt(cursor, L)
      new Display(cursor, frac(10, 1)).value(num(value))
      this.expr.field.dirtyAst = this.expr.field.dirtyValue = true
      this.expr.field.scope.queueUpdate()
    }
    this.display()
  }

  get min() {
    return this.slider.min
  }

  get max() {
    return this.slider.max
  }

  bounds(min: SReal, max: SReal) {
    this.slider.bounds(min, max)
    this.display()
  }

  private display() {
    new Display(this.fmin.sel.remove(), real(10)).value(num(this.slider.min))
    new Display(this.fmax.sel.remove(), real(10)).value(num(this.slider.max))
  }
}

export class Expr {
  static id = 0

  readonly field

  readonly el
  readonly elIndex
  readonly elCircle
  readonly elValue
  readonly elError
  readonly elScroller
  readonly slider

  readonly elDebugs
  readonly elPlots

  removable = true
  index

  private _kind: CircleKind = "empty"
  get circle() {
    return this._kind
  }
  set circle(v) {
    this._kind = v
    while (this.elCircle.firstChild) {
      this.elCircle.firstChild.remove()
    }
    this.elCircle.appendChild(circle(v))
    this.sheet.replot = true
  }

  constructor(readonly sheet: Sheet) {
    this.sheet.exprs.push(this)
    this.elDebugs = h("ml-auto", "")
    this.elPlots = h("ml-auto", "")
    this.field = new ExprField(this)
    this.slider = new ExprSlider(this)
    this.elValue = new FieldInert(this.field.exts, this.field.options)
    this.elError = h(
      "leading-tight block pb-1 -mt-2 mx-1 px-1 italic text-red-800 hidden whitespace-pre-wrap",
    )
    this.elScroller = h(
      "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem] max-w-[calc(var(--nya-sheet-sidebar)_-_2.5rem)]",
      this.field.el,
    )
    this.el = h(
      "border-b border-slate-200 grid grid-cols-[2.5rem,auto] relative group focus-within:border-[color:--nya-focus] max-w-full",
      h(
        "inline-flex bg-slate-100 flex-col p-0.5 group-focus-within:bg-[color:--nya-focus] border-r border-slate-200 group-focus-within:border-transparent text-[65%] [line-height:1] text-slate-500",
        h(
          "inline-flex group-focus-within:text-white",
          (this.elIndex = h("", "" + this.sheet.exprs.length)),
          this.elDebugs,
        ),
        (this.elCircle = h("contents", circle(this.circle))),
        h(
          "inline-flex group-focus-within:text-white",

          this.elPlots,
        ),
      ),
      h(
        "flex flex-col w-full max-w-full",
        this.elScroller,
        this.slider.el,
        this.elValue.el,
        this.elError,
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
      "overflow-x-auto",
      "[&::-webkit-scrollbar]:hidden",
      "max-w-[calc(var(--nya-sheet-sidebar)_-_3.5rem)]",
      "nya-expr-value",
    )
    this.elCircle.addEventListener("click", () => {
      if (this.circle == "empty") {
        this.circle = "shader"
      } else {
        this.circle = "empty"
      }
    })
  }

  displayEval(value: JsValue, base: SReal) {
    this.elValue.el.classList.remove("hidden")
    this.elError.classList.add("hidden")
    display(this.elValue, value, base)
  }

  displayError(reason: Error) {
    this.elValue.el.classList.add("hidden")
    this.elError.classList.remove("hidden")
    this.elError.textContent = reason.message
  }

  checkIndex() {
    this.elIndex.textContent = "" + this.sheet.exprs.indexOf(this)
    this.index = this.sheet.exprs.length - 1
  }

  debug() {
    if (this.circle == "shader") {
      this.sheet.replot = true
    }

    this.elValue.el.classList.add("hidden")
    this.elValue.el.classList.remove("!hidden")
    this.elError.classList.add("hidden")
    this.slider.el.classList.add("hidden")

    if (this.field.ast.type == "binding" && !this.field.ast.args) {
      this.slider.el.classList.remove("hidden")
      this.elValue.el.classList.add("!hidden")
    }

    if (
      this.field.deps.ids[hex("p")] ||
      this.field.deps.ids[hex("x")] ||
      this.field.deps.ids[hex("y")]
    ) {
      return
    }

    this.elDebugs.textContent = +this.elDebugs.textContent! + 1 + ""

    try {
      var node = this.field.block.expr()
      if (node.type == "binding") {
        node = node.value
      }
    } catch (e) {
      console.warn(e)
      this.displayError(e instanceof Error ? e : new Error(String(e)))
      return
    }

    try {
      const props = this.sheet.scope.propsJs
      const value = js(node, props)
      const base = outputBase(node, props)
      this.displayEval(value, base)
    } catch (e) {
      console.warn(e)
      if (
        String(e).includes(
          "Cannot access pixel coordinates outside of shaders.",
        )
      ) {
        this.elError.classList.add("hidden")
        this.elValue.el.classList.add("hidden")
      } else {
        this.displayError(e instanceof Error ? e : new Error(String(e)))
      }
    }
  }

  compilePlot(): [block: string, expr: string] | undefined {
    this.elPlots.textContent = +this.elPlots.textContent! + 1 + ""
    try {
      const node = this.field.block.ast()
      const props = this.sheet.scope.propsGlsl()
      const value = OP_PLOT.glsl(props.ctx, glsl(node, props))
      if (value.list) {
        throw new Error("Cannot draw a list of colors.")
      }
      declareAddR64(props.ctx)
      declareMulR64(props.ctx)
      return [props.ctx.block, value.expr]
    } catch (e) {
      console.error(e)
      try {
        this.displayError(e instanceof Error ? e : new Error(String(e)))
      } catch (e) {
        console.error(e)
      }
    }
  }

  get binding() {
    if (this.field.ast.type == "binding") {
      return this.field.ast
    }
  }
}

interface SheetHandlerData extends Expr {}

export class SheetHandlers
  implements PointerHandlers<SheetHandlerData, null | undefined>
{
  constructor(readonly sheet: Sheet) {}

  onDragStart(at: Point): SheetHandlerData | null | undefined {
    if (Math.hypot(at.x, at.y) < 5) {
      return this.sheet.exprs[0]
    }
  }

  onDragMove(to: Point, data: SheetHandlerData): void {
    const expr = data
    if (expr.field.ast.type != "binding") return
    const v = expr.field.ast.name
    expr.field.block.clear()
    const cursor = expr.field.block.cursor(R)
    CmdVar.leftOf(cursor, v, expr.field.options)
    new OpEq(false).insertAt(cursor, L)
    const contents = new Block(null)
    new CmdBrack("(", ")", null, contents).insertAt(cursor, L)
    new Display(contents.cursor(R), frac(10, 1)).value(to.x)
    new CmdComma().insertAt(contents.cursor(R), L)
    new Display(contents.cursor(R), frac(10, 1)).value(to.y)
    expr.field.dirtyAst = expr.field.dirtyValue = true
    expr.field.scope.queueUpdate()
  }

  onDragEnd(to: Point, data: SheetHandlerData): void {}

  onHover(at: Point): void {}
}

export class Sheet {
  readonly scope

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
  readonly handlers = new SheetHandlers(this)

  replot = false

  constructor(
    readonly exts: Exts,
    readonly options: Options,
  ) {
    this.scope = new Scope(this.exts, this.options.field)
    Object.assign(globalThis, { scope: this.scope })
    this.paper.el.classList.add("size-full")
    doMatchSize(this.paper)
    doDrawCycle(this.paper)
    onWheel(this.paper)
    onScroll(this.paper)
    this.paper.el.classList.add("touch-none")
    registerPanAndZoom(this.paper, this.handlers)
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
            "project nya ",
            h({ id: "debugcount" }, "0"),
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
          (this.elPixelRatio = new Slider()).el,
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
    this.elPixelRatio.el.className =
      "block w-48 bg-white outline outline-black/30 rounded-full p-1"
    this.elPixelRatio.bounds(real(1), real(16))
    this.elPixelRatio.value = real(this.pixelRatio())
    this.elPixelRatio.onInput = () => {
      this.setPixelRatio(num(this.elPixelRatio.value))
    }
    this.paper.el.classList.add("absolute", "inset-0")

    new ResizeObserver((entries) => {
      const entry = entries[0]!
      const { width } = entry.contentRect
      this.el.style.setProperty("--nya-sheet-sidebar", width + "px")
    }).observe(this.elExpressions)

    const global = this.regl({
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
        u_scale: this.regl.prop("u_scale"),
        // @ts-expect-error
        u_cx: this.regl.prop("u_cx"),
        // @ts-expect-error
        u_cy: this.regl.prop("u_cy"),
        // @ts-expect-error
        u_px_per_unit: this.regl.prop("u_px_per_unit"),
      },
    })

    let program: regl.DrawCommand | undefined
    let cleared = false
    let skip = false

    this.regl.frame(() => {
      const shaders = this.exprs.filter((x) => x.circle == "shader")
      if (!cleared) this.regl.clear({ color: [0, 0, 0, 0], depth: 1 })
      cleared = true
      if (shaders.length == 0) return

      const { xmax, xmin, ymin, ymax } = this.paper.bounds()
      const uniforms = {
        u_scale: splitRaw((xmax - xmin) / this.regl._gl.drawingBufferWidth),
        u_cx: splitRaw(xmin),
        u_cy: splitRaw(ymin),
        u_px_per_unit: [
          ...splitRaw(this.paper.el.clientWidth / (xmax - xmin)),
          ...splitRaw(this.paper.el.clientHeight / (ymax - ymin)),
        ],
      }
      if (!program || this.replot) {
        const compiled = this.exprs
          .map((x) => x.circle == "shader" && x.compilePlot())
          .filter((x) => x != null && x != false)
        if (compiled.length == 0) {
          skip = true
          this.replot = false
          return
        } else {
          skip = false
        }
        const frag = `#version 300 es
precision highp float;
out vec4 color;
vec4 v_coords;
uniform vec2 u_scale;
uniform vec2 u_cx;
uniform vec2 u_cy;
uniform vec4 u_px_per_unit;
vec4 _nya_helper_compose(vec4 base, vec4 added) {
  if (base.w == 0.) return added;
  if (added.w == 0.) return base;
  float w = 1. - (1. - added.w) * (1. - base.w);
  return vec4(
    ((added.xyz * added.w / w) + (base.xyz * base.w * (1. - added.w) / w)),
    w
  );
}
${this.scope.helpers.helpers}void main() {
vec2 e_tx = vec2(gl_FragCoord.x, 0);
vec2 e_ty = vec2(gl_FragCoord.y, 0);
v_coords = vec4(
  _helper_add_r64(u_cx, _helper_mul_r64(e_tx, u_scale)),
  _helper_add_r64(u_cy, _helper_mul_r64(e_ty, u_scale))
);
${compiled.map((x) => x[0]).join("")}color = ${compiled.map((x) => x[1]).reduce((a, b) => `_nya_helper_compose(${a},${b})`)};
      }`
        program = this.regl({
          frag,
          vert: `#version 300 es
precision highp float;
in vec2 position;
void main() {
  gl_Position = vec4(position, 0, 1);
}
`,
          count: 6,
        })
        this.replot = false
      }
      if (skip) return
      global(uniforms, () => program!())
    })
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
  "“you can choose LaTeX parsing or”— “THE SECOND ONE”",
  "copy-paste easy to implement: famous last words",
  "the error messages are doubled because why not",
  "experience the joy of floating point numbers",
  "lines are impossible",
]

const REMARK = REMARKS[Math.floor(REMARKS.length * Math.random())]!
