import type { Regl } from "regl"
import regl from "regl"
import { GlslHelpers } from "../../../eval/lib/fn"
import { num, real } from "../../../eval/ty/create"
import { Exts, Options } from "../../../field/options"
import { h, hx } from "../../../jsx"
import { Scope } from "../../deps"
import { doMatchReglSize } from "../../regl"
import { REMARK } from "../../remark"
import { Slider } from "../../slider"
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

  readonly el
  readonly elExpressions = h("flex flex-col")
  readonly elNextIndex = h(
    "font-sans text-slate-500 text-[65%] leading-none",
    "1",
  )

  constructor(
    readonly exts: Exts,
    readonly options: Options,
  ) {
    this.scope = new Scope(exts, options)

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

    // prepare glsl context
    const canvas = hx(
      "canvas",
      "absolute inset-0 size-full pointer-events-none [image-rendering:pixelated]",
    )
    const gl = canvas.getContext("webgl2")!
    this.regl = regl({ canvas, gl })

    // prepare slider
    ;[this.pixelRatio, this.setPixelRatio] = doMatchReglSize(canvas, this.regl)
    this.glPixelRatio.bounds(real(1), real(16))
    this.glPixelRatio.value = real(this.pixelRatio())
    this.glPixelRatio.onInput = () =>
      this.setPixelRatio(num(this.glPixelRatio.value))

    // dom
    this.glPixelRatio.el.className =
      "block w-48 bg-white outline outline-black/30 rounded-full p-1"
    this.el = h(
      "fixed inset-0 grid grid-cols-[400px_1fr] grid-rows-1 select-none",

      // sidebar
      h(
        "font-['Symbola','Times_New_Roman',sans-serif] flex flex-col overflow-y-auto",

        // title bar
        h(
          "sticky top-0 w-full flex flex-col bg-slate-100 border-b border-r border-slate-200 px-4 text-center text-slate-500 py-2 z-10",
          h("text-2xl leading-tight", "project nya"),
          h("italic text-sm leading-none", REMARK),
        ),

        // main expression list
        this.elExpressions,

        // fake expression
        h(
          "relative grid grid-cols-[2.5rem_auto] min-h-[3.625rem] border-r border-slate-200",

          // grey side of expression
          h(
            "inline-flex bg-slate-100 flex-col p-0.5 border-r border-slate-200",
            this.elNextIndex,
          ),

          // main expression body
          // TODO: make this clickable

          // cover
          h("absolute inset-0 from-transparent to-white bg-gradient-to-b"),
        ),

        // right border on remainder of the flexbox
        h("flex-1 border-r border-slate-200"),
      ),

      // paper
      h(
        "relative",
        canvas,
        this.paper.el,
        h(
          "absolute block top-0 bottom-0 left-0 w-1 from-slate-950/10 to-transparent bg-gradient-to-r",
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
  }
}
