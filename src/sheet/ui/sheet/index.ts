import type { Regl } from "regl"
import regl from "regl"
import { GlslContext, GlslHelpers } from "../../../eval/lib/fn"
import { declareAddR64 } from "../../../eval/ops/op/add"
import { declareMulR64 } from "../../../eval/ops/op/mul"
import { num, real } from "../../../eval/ty/create"
import { splitRaw } from "../../../eval/ty/split"
import type { Options } from "../../../field/options"
import { h, hx } from "../../../jsx"
import { Scope } from "../../deps"
import type { Exts } from "../../ext"
import { doMatchReglSize } from "../../regl"
import { REMARK } from "../../remark"
import { Slider } from "../../slider"
import type { Expr } from "../expr"
import { createDrawAxes, makeInteractive, matchSize, Paper } from "../paper"
import { Handlers } from "./handler"

export class Sheet {
  readonly pixelRatio
  readonly setPixelRatio
  readonly glPixelRatio = new Slider()

  readonly paper = new Paper()
  readonly handlers = new Handlers(this)
  readonly helpers = new GlslHelpers()
  readonly scope: Scope
  readonly regl: Regl
  readonly exprs: Expr[] = []

  readonly el
  readonly elExpressions = h("flex flex-col")
  readonly elNextIndex = h(
    "font-sans text-[--nya-expr-index] text-[65%] leading-none",
    "1",
  )

  constructor(
    readonly options: Options,
    readonly exts: Exts,
  ) {
    this.scope = new Scope(options)

    // prepare js context
    this.paper.el.classList.add(
      "size-full",
      "touch-none",
      "inset-0",
      "absolute",
    )
    matchSize(this.paper)
    makeInteractive(this.paper, this.handlers)
    createDrawAxes(this.paper)
    this.paper.drawFns.push(() => {
      for (const e of this.exprs
        .filter((x) => x.state.ok && x.state.ext?.plot2d != null)
        .sort((a, b) => a.layer - b.layer)) {
        if (e.state.ok && e.state.ext?.plot2d) {
          e.state.ext.plot2d(e.state.data, this.paper)
        }
      }
    })

    // prepare glsl context
    const canvas = hx(
      "canvas",
      "absolute inset-0 size-full pointer-events-none [image-rendering:pixelated]",
    )
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: false })!
    this.regl = regl({ canvas, gl })

    // prepare slider
    ;[this.pixelRatio, this.setPixelRatio] = doMatchReglSize(canvas, this.regl)
    this.glPixelRatio.bounds(real(1), real(16))
    this.glPixelRatio.value = real(this.pixelRatio())
    this.glPixelRatio.onInput = () =>
      this.setPixelRatio(num(this.glPixelRatio.value))

    // dom
    this.glPixelRatio.el.className =
      "block w-48 bg-[--nya-bg] outline outline-[--nya-pixel-ratio] rounded-full p-1"
    this.el = h(
      "fixed inset-0 grid grid-cols-[400px_1fr] grid-rows-1 select-none",

      // sidebar
      h(
        "font-['Symbola','Times_New_Roman',sans-serif] flex flex-col overflow-y-auto",

        // title bar
        h(
          "sticky top-0 w-full flex flex-col bg-[--nya-bg-sidebar] border-b border-r border-[--nya-border] px-4 text-center text-[--nya-title] py-2 z-10",
          h("text-2xl leading-tight", "project nya"),
          h("italic text-sm leading-none", REMARK),
        ),

        // main expression list
        this.elExpressions,

        // fake expression
        h(
          "relative grid grid-cols-[2.5rem_auto] min-h-[3.625rem] border-r border-[--nya-border]",

          // grey side of expression
          h(
            "inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border]",
            this.elNextIndex,
          ),

          // main expression body
          // TODO: make this clickable

          // cover
          h("absolute inset-0 from-transparent to-[--nya-bg] bg-gradient-to-b"),
        ),

        // right border on remainder of the flexbox
        h("flex-1 border-r border-[--nya-border]"),
      ),

      // paper
      h(
        "relative",
        canvas,
        this.paper.el,
        h(
          "absolute block top-0 bottom-0 left-0 w-1 from-[--nya-sidebar-shadow] to-transparent bg-gradient-to-r",
        ),
        h("absolute flex flex-col top-2 right-2", this.glPixelRatio.el),
      ),
    )
    new ResizeObserver(() =>
      this.el.style.setProperty(
        "--nya-sidebar",
        this.elExpressions.clientWidth + "px",
      ),
    ).observe(this.elExpressions)

    this.startGlslLoop()
  }

  private checkIndices() {
    for (let i = 0; i < this.exprs.length; i++) {
      const expr = this.exprs[i]!
      expr.elIndex.textContent = i + 1 + ""
    }
    this.elNextIndex.textContent = this.exprs.length + 1 + ""
  }

  private _qdIndices = false
  queueIndices() {
    if (this._qdIndices) return
    setTimeout(() => {
      this._qdIndices = false
      this.checkIndices()
    })
    this._qdIndices = true
  }

  private startGlslLoop() {
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

    let cleared = false

    this.regl.frame(() => {
      // if (!cleared) {
      this.regl.clear({ color: [0, 0, 0, 0] })
      // cleared = true
      // }

      const program = this.program
      if (!program) return

      const { xmin, w, ymin, h } = this.paper.bounds()
      global(
        {
          u_scale: splitRaw(w / this.regl._gl.drawingBufferWidth),
          u_cx: splitRaw(xmin),
          u_cy: splitRaw(ymin),
          u_px_per_unit: [
            ...splitRaw(this.paper.el.clientWidth / w),
            ...splitRaw(this.paper.el.clientHeight / h),
          ],
        },
        () => program(),
      )
      cleared = false
    })
  }

  private program: regl.DrawCommand | undefined
  private checkGlsl() {
    const compiled = this.exprs
      .filter((x) => x.glsl != null)
      .sort((a, b) => a.layer - b.layer)
      .map((x) => x.glsl!)

    if (compiled.length == 0) {
      this.program = undefined
      return
    }

    declareAddR64(new GlslContext(this.scope.helpers))
    declareMulR64(new GlslContext(this.scope.helpers))
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
${compiled.map((x) => x[0].block).join("")}color = ${compiled.map((x) => x[1]).reduce((a, b) => `_nya_helper_compose(${a},${b})`)};
      }
      `
    this.program = this.regl({
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
  }

  private _qdGlsl = false
  queueGlsl() {
    if (this._qdGlsl) return
    setTimeout(() => {
      this._qdGlsl = false
      this.checkGlsl()
    })
    this._qdGlsl = true
  }
}
