import { faBook } from "@fortawesome/free-solid-svg-icons/faBook"
import { faCopy } from "@fortawesome/free-solid-svg-icons/faCopy"
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash"
import type { Regl } from "regl"
import regl from "regl"
import { GlslContext } from "../../../eval/lib/fn"
import type { JsVal, TyName } from "../../../eval/ty"
import { num, real } from "../../../eval/ty/create"
import { splitRaw } from "../../../eval/ty/split"
import type { Options } from "../../../field/options"
import { h, hx, t } from "../../../jsx"
import type { ToolbarItem } from "../../../pkg"
import { declareAddR64, declareMulR64 } from "../../../pkg/core-ops"
import { Scope } from "../../deps"
import type { Exts } from "../../ext"
import type { SheetFactory } from "../../factory"
import { doMatchReglSize } from "../../regl"
import { REMARK } from "../../remark"
import { Slider } from "../../slider"
import { isDark } from "../../theme"
import { Expr } from "../expr"
import { Paper, type Point } from "../paper"
import { HANDLER_PICK, type PickProps } from "../paper/interact"
import {
  registerDragHandler,
  registerPinchHandler,
  registerWheelHandler,
} from "../paper/move"
import { PickHandler } from "../paper/pick"
import { btn, createDocs, DEFAULT_TO_VISIBLE_DOCS } from "./docs"

export class Sheet {
  readonly paper = new Paper("absolute inset-0 size-full touch-none")
  readonly scope: Scope
  readonly exprs: Expr[] = []

  private readonly pixelRatio
  private readonly setPixelRatio
  private readonly glPixelRatio = new Slider()

  readonly pick
  private readonly regl: Regl

  readonly el
  readonly elExpressions = h("flex flex-col")
  readonly elNextIndex = h(
    "font-sans text-[--nya-expr-index] text-[65%] leading-none",
    "1",
  )

  constructor(
    readonly options: Options,
    readonly exts: Exts,
    toolbarItems: ToolbarItem[],
    keys: Record<string, (sheet: Sheet) => void>,
    readonly factory: SheetFactory,
  ) {
    addEventListener("keydown", (ev) => {
      if (
        ev.metaKey ||
        ev.ctrlKey ||
        ev.altKey ||
        document.activeElement?.classList.contains("nya-display")
      ) {
        return
      }

      const key = keys[ev.key]
      if (key) {
        key(this)
      }
    })

    this.scope = new Scope(options)

    // prepare js context
    registerWheelHandler(this.paper)
    registerDragHandler(this.paper)
    registerPinchHandler(this.paper)
    this.paper.fns.push(() => {
      for (const expr of this.exprs) {
        if (expr.state.ok && expr.state.ext?.svg) {
          try {
            expr.state.ext.svg(expr.state.data, this.paper)
          } catch (e) {
            console.warn("[draw]", e)
          }
        }
      }
    })
    this.pick = new PickHandler(this)

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

    const switchToDocs = btn(faBook, "Docs", () => {
      docs.classList.remove("hidden")
      sidebar.classList.add("hidden")
    })

    const clearAll = btn(faTrash, "Clear", () => {
      while (this.exprs[0]) {
        this.exprs[0].delete()
      }
    })

    const copyAllLabel = t("Copy")

    let copyId = 0
    const copyAll = btn(faCopy, copyAllLabel, async () => {
      copyAllLabel.data = "Copying..."
      const id = ++copyId
      try {
        await navigator.clipboard.writeText(
          this.exprs.map((x) => x.field.block.latex()).join("\n"),
        )
        if (copyId == id) {
          copyAllLabel.data = "Copied!"
          setTimeout(() => {
            if (copyId == id) {
              copyAllLabel.data = "Copy"
            }
          }, 3000)
        }
      } catch {
        if (copyId == id) {
          copyAllLabel.data = "Failed ❌"
          setTimeout(() => {
            if (copyId == id) {
              copyAllLabel.data = "Copy"
            }
          }, 3000)
        }
      }
    })

    const nextExpression = hx(
      "button",
      {
        class:
          "relative text-left grid grid-cols-[2.5rem_auto] min-h-[3.625rem] border-r border-[--nya-border]",
        tabindex: "-1",
      },

      // grey side of expression
      h(
        "inline-flex bg-gradient-to-b from-[--nya-bg-sidebar] to-transparent flex-col p-0.5 relative h-full",
        this.elNextIndex,
        h(
          "absolute right-0 inset-y-0 w-px from-[--nya-border] to-transparent bg-gradient-to-b",
        ),
      ),
    )

    nextExpression.addEventListener("click", () => {
      const expr = new Expr(this)
      setTimeout(() => nextExpression.scrollIntoView())
      setTimeout(() => expr.field.el.focus())
    })

    const sidebar = h(
      "font-['Symbola','Times_New_Roman',sans-serif] flex flex-col overflow-y-auto row-span-2",

      // title bar
      h(
        "sticky top-0 w-full p-1 h-12 min-h-12 max-h-12 flex bg-[--nya-bg-sidebar] border-b border-r border-[--nya-border] text-center text-[--nya-title] z-10",
        copyAll,
        clearAll,
        h("m-auto text-2xl", "project nya"),
        switchToDocs,
      ),

      // main expression list
      this.elExpressions,

      // fake expression
      nextExpression,

      // right border on remainder of the flexbox
      h("flex-1 border-r min-h-24 border-[--nya-border]"),
    )

    const toolbar =
      toolbarItems.length ?
        h(
          "font-['Symbola','Times_New_Roman',sans-serif] flex overflow-x-auto h-12 min-h-12 bg-[--nya-bg-sidebar] border-b border-[--nya-border] first:*:ml-auto last:*:mr-auto [&::-webkit-scrollbar]:hidden px-2",
          ...toolbarItems.map((x) => x(this)),
        )
      : null

    const docs = createDocs(
      btn(faBook, "Back", () => {
        docs.classList.add("hidden")
        sidebar.classList.remove("hidden")
      }),
      this.options,
      Object.values(factory.loaded),
    )

    if ("NYA_DEV" in globalThis && DEFAULT_TO_VISIBLE_DOCS) {
      docs.classList.remove("hidden")
      sidebar.classList.add("hidden")
    }

    // dom
    this.glPixelRatio.el.className =
      "block w-48 bg-[--nya-bg] outline outline-[--nya-pixel-ratio] rounded-full p-1"
    this.el = h(
      "fixed inset-0 grid grid-cols-[min(500px,40vw)_1fr] grid-rows-[3rem_1fr] grid-rows-1 select-none",

      sidebar,
      docs,
      toolbar,

      h(
        "relative" + (toolbar ? "" : " row-span-2"),
        canvas,
        this.paper.el,
        toolbar &&
          h(
            "absolute block top-0 left-0 right-0 h-1 from-[--nya-sidebar-shadow] to-transparent bg-gradient-to-b",
          ),
        h(
          "absolute block top-0 bottom-0 left-0 w-1 from-[--nya-sidebar-shadow] to-transparent bg-gradient-to-r",
        ),
        h("absolute flex flex-col top-2 right-2", this.glPixelRatio.el),
        h(
          "absolute flex flex-col bottom-2 right-2 text-right font-['Symbola'] text-[--nya-title] pointer-events-none [-webkit-text-stroke:2px_var(--nya-bg)] [paint-order:stroke] opacity-30",
          h("text-3xl/[1]", "project nya"),
          h("italic text-sm leading-none", REMARK),
        ),
      ),
    )
    new ResizeObserver(() =>
      this.el.style.setProperty(
        "--nya-sidebar",
        this.elExpressions.clientWidth + "px",
      ),
    ).observe(this.elExpressions)

    this.startGlslLoop()

    addEventListener("keydown", (event) => {
      if (
        this.pick.isActive() &&
        event.key == "Escape" &&
        !(event.metaKey || event.shiftKey || event.altKey || event.ctrlKey)
      ) {
        event.preventDefault()
        this.pick.cancel()
      }
    })
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
    queueMicrotask(() => {
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
        // @ts-expect-error
        u_unit_per_hpx: this.regl.prop("u_unit_per_hpx"),
        // @ts-expect-error
        u_darkmul: this.regl.prop("u_darkmul"),
        // @ts-expect-error
        u_darkoffset: this.regl.prop("u_darkoffset"),
        // @ts-expect-error
        u_is_dark: this.regl.prop("u_is_dark"),
      },
    })

    this.regl.frame(() => {
      this.regl.clear({ color: [0, 0, 0, 0] })

      const program = this.program
      if (!program) return

      const { xmin, w, ymin, h } = this.paper.bounds()
      global(
        {
          u_scale: splitRaw(w / this.regl._gl.drawingBufferWidth),
          u_cx: splitRaw(xmin),
          u_cy: splitRaw(ymin),
          u_px_per_unit: [
            ...splitRaw(this.paper.width / w),
            ...splitRaw(this.paper.height / h),
          ],
          u_unit_per_hpx: [
            ...splitRaw(1 / this.paper.xPrecision),
            ...splitRaw(1 / this.paper.yPrecision),
          ],
          u_darkmul: isDark() ? [-1, -1, -1, 1] : [1, 1, 1, 1],
          u_darkoffset: isDark() ? [1, 1, 1, 0] : [0, 0, 0, 0],
          u_is_dark: isDark(),
        },
        () => program(),
      )
    })
  }

  private program: regl.DrawCommand | undefined
  private checkGlsl() {
    const compiled = this.exprs
      .filter((x) => x.glsl != null)
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
uniform vec4 u_darkmul;
uniform vec4 u_darkoffset;
uniform bool u_is_dark;
uniform vec2 u_scale;
uniform vec2 u_cx;
uniform vec2 u_cy;
uniform vec4 u_px_per_unit;
uniform vec4 u_unit_per_hpx;
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
    queueMicrotask(() => {
      this._qdGlsl = false
      this.checkGlsl()
    })
    this._qdGlsl = true
  }

  select<const K extends readonly TyName[]>(
    at: Point,
    tys: K,
  ): Selected<K[number]>[] {
    const o = this.paper.toOffset(at)
    const rect = this.paper.el.createSVGRect()
    rect.x = o.x
    rect.y = o.y
    rect.width = 0.1
    rect.height = 0.1
    const picks = Array.from(
      this.paper.el.getIntersectionList(rect, this.paper.el),
    )
      .map((v) => HANDLER_PICK.get(v))
      .filter((x) => x != null)
      .filter((x) => tys.includes(x.val().type))
    return picks.map((x) => ({ ...x, val: x.val() }))
  }
}

export interface Selected<K extends TyName = TyName>
  extends Omit<PickProps<K>, "val"> {
  val: JsVal<K>
}
