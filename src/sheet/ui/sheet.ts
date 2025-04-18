import type { PackageId } from "#/index"
import type { ToolbarItem } from "#/types"
import { getAll } from "@/addons"
import { btn, btnSkin, btnSkin2 } from "@/docs/core"
import { JsContext } from "@/eval/lib/jsctx"
import { declareAddR64, declareMulR64 } from "@/eval/ops/r64"
import { SYM_180, SYM_PI, SYM_TAU, type Sym } from "@/eval/sym"
import type { JsVal, TyName } from "@/eval/ty"
import { num, real } from "@/eval/ty/create"
import { tidyCoercions } from "@/eval/ty/info"
import { splitRaw } from "@/eval/ty/split"
import type { Block } from "@/field/model"
import type { Options } from "@/field/options"
import { h, hx, px, t } from "@/jsx"
import { createAddons } from "@/sheet/ui/addons"
import { faBook } from "@fortawesome/free-solid-svg-icons/faBook"
import { faCopy } from "@fortawesome/free-solid-svg-icons/faCopy"
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash"
import type { Regl } from "regl"
import regl from "regl"
import { Scope } from "../deps"
import type { Exts } from "../ext"
import type { SheetFactory } from "../factory"
import { ItemListGlobal, type ItemRef } from "../items"
import type { Point } from "../point"
import { doMatchReglSize } from "../regl"
import { REMARK } from "../remark"
import { Slider } from "../slider"
import { isDark } from "../theme"
import { Cv } from "./cv"
import { Order, OrderMajor } from "./cv/consts"
import { Hint } from "./cv/item"
import {
  registerPinchHandler,
  registerPointerHandler,
  registerWheelHandler,
  type Handler,
  type ItemWithTarget,
  type VirtualPoint,
} from "./cv/move"
import { PickHandler2 } from "./cv/pick"
import { Expr } from "./expr"

export type RequireRadiansReason = "with a complex number"
export type RequireRadiansContext = `call '${string}' ${RequireRadiansReason}`

function renderDigits(n: number) {
  return h(
    "h-5 text-xl/[1] flex text-center items-center justify-center font-['Symbola']",
    n.toString(),
  )
}

export class Sheet {
  readonly cv = new Cv("absolute inset-0 size-full touch-none")
  readonly scope: Scope
  readonly list = new ItemListGlobal(this)

  private readonly pixelRatio
  private readonly setPixelRatio
  private readonly glPixelRatio = new Slider()

  private trigKind: "deg" | "rad" | "rot" = "rad"

  requireRadians(context: RequireRadiansContext) {
    if (this.trigKind != "rad") {
      throw new Error(
        `Cannot ${context} unless angles are measured in radians.`,
      )
    }
  }

  toRadians() {
    return (
      this.trigKind == "deg" ? Math.PI / 180
      : this.trigKind == "rot" ? 2 * Math.PI
      : 1
    )
  }

  toRadiansR32(): string {
    return (
      this.trigKind == "deg" ? `${(Math.PI / 180).toExponential()}`
      : this.trigKind == "rot" ? `${(2 * Math.PI).toExponential()}`
      : "1.0"
    )
  }

  toRadiansSym(): [num: Sym | null, denom: Sym | null] {
    switch (this.trigKind) {
      case "deg":
        return [SYM_PI, SYM_180]
      case "rad":
        return [null, null]
      case "rot":
        return [SYM_TAU, null]
    }
  }

  readonly pick
  private readonly regl: Regl

  readonly el
  readonly elExpressions = h("flex flex-col", this.list.el)
  readonly elNextIndex = h(
    "font-sans text-[--nya-expr-index] text-[65%] leading-none",
    this.list.nextIndex,
  )

  constructor(
    readonly options: Options,
    readonly exts: Exts,
    toolbarItems: ToolbarItem[],
    keys: Record<string, (sheet: Sheet) => void>,
    readonly factory: SheetFactory,
  ) {
    window.addEventListener("keydown", (ev) => {
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

    this.scope = new Scope(options, new JsContext(this))

    // prepare js context
    registerWheelHandler(this.cv)
    const handler = new SheetHandler(this)
    const pick = registerPointerHandler(this.cv, handler)
    this.pick = new PickHandler2(this, pick, handler)
    registerPinchHandler(this.cv)

    this.cv.fn(OrderMajor.Backdrop, () => {
      this.list.draw(-Infinity, Order.Backdrop) // backdrop images
    })

    this.cv.fn(OrderMajor.Canvas, () => {
      this.list.draw(Order.Grid, Infinity) // canvas items + pick preview
      pick.picked?.target.draw?.(
        pick.picked,
        !!pick.picking?.virtuals.includes(pick.picked as VirtualPoint),
      ) // currently active virtual point
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

    const radioName = "_nya_radio_" + Math.random().toString().slice(2)
    const trigLabel = (name: Sheet["trigKind"]) => {
      const input = hx("input", {
        type: "radio",
        name: radioName,
        value: "deg",
        class: "sr-only",
      })
      input.defaultChecked = this.trigKind == name
      input.addEventListener("input", () => {
        this.trigKind = name
        this.scope.queueGlobalRecompute()
      })
      const label = hx(
        "label",
        "contents cursor-pointer",
        input,
        h(
          "opacity-30 hover:opacity-100 [:checked+&]:opacity-100 inline-block [:checked+&]:bg-[--nya-bg-sidebar] px-2 text-center rounded-sm [:first-child>&]:rounded-l-full [:last-child>&]:rounded-r-full",
          name,
        ),
      )
      label.addEventListener("pointerdown", () => {
        input.value = name
        input.checked = true
        this.trigKind = name
        this.scope.queueGlobalRecompute()
      })
      return label
    }
    const trigKindEl = h(
      "block w-48 bg-[--nya-bg] outline outline-1 outline-[--nya-pixel-ratio] rounded-full p-0.5 text-[--nya-text-prose] font-['Symbola'] grid grid-cols-3",
      trigLabel("rad"),
      trigLabel("deg"),
      trigLabel("rot"),
    )

    const switchToDocs = btnSkin("a", faBook, "Docs")
    switchToDocs.href =
      location.origin +
      "/?/docs" +
      (location.search ? "&" + location.search.slice(1) : "")
    switchToDocs.target = "_blank"

    const addonsIcon = h("contents")
    const showAddons = btnSkin2("button", addonsIcon, "Addons")
    showAddons.addEventListener("click", () =>
      addons.classList.toggle("hidden"),
    )
    function checkIcon() {
      while (addonsIcon.firstChild) {
        addonsIcon.firstChild.remove()
      }
      addonsIcon.appendChild(renderDigits(getAll().length))
    }
    checkIcon()

    const clearAll = btn(faTrash, "Clear", () => {
      while (this.list.items[0]) {
        this.list.items[0].delete()
      }
    })

    const copyAllLabel = t("Copy")

    let copyId = 0
    const copyAll = btn(faCopy, copyAllLabel, async () => {
      copyAllLabel.data = "Copy"
      const id = ++copyId
      try {
        await navigator.clipboard.writeText(
          this.list.items
            .map(({ factory, data }) =>
              factory == this.factory.defaultItem ?
                factory.encode(data)
              : "#" + factory.id + "#" + factory.encode(data),
            )
            .join("\n"),
        )
        if (copyId == id) {
          copyAllLabel.data = "Copied"
          setTimeout(() => {
            if (copyId == id) {
              copyAllLabel.data = "Copy"
            }
          }, 3000)
        }
      } catch {
        if (copyId == id) {
          copyAllLabel.data = "Failed"
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
          "relative text-left grid grid-cols-[2.5rem_auto] min-h-[3.625rem] sm:border-r border-[--nya-border]",
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
      this.list.createDefault({ focus: true })
    })

    const titlebar = h(
      "font-['Symbola','Times_New_Roman',sans-serif] sticky top-0 w-full bg-[--nya-bg-sidebar] border-r border-[--nya-border] text-center text-[--nya-title] z-20 [grid-area:titlebar] border-t sm:border-t-0",
      h(
        "flex w-full h-12 min-h-12 max-h-12 p-1 border-b border-[--nya-border]",
        copyAll,
        clearAll,
        h("m-auto text-2xl", "project nya"),
        showAddons,
        switchToDocs,
      ),
    )

    const sidebar = h(
      "font-['Symbola','Times_New_Roman',sans-serif] flex flex-col overflow-y-auto [grid-area:sidebar] border-[--nya-border]",

      // title bar
      h(
        "sticky top-0 w-full bg-[--nya-bg-sidebar] sm:border-r border-[--nya-border] text-center text-[--nya-title] z-20",
        h(
          "grid grid-cols-[repeat(auto-fill,2.5rem)] p-1 border-b border-[--nya-border]",
          ...factory
            .itemFactories()
            .sort((a, b) =>
              a.id == this.factory.defaultItem.id ? -1
              : b.id == this.factory.defaultItem.id ? 1
              : a.name < b.name ? -1
              : a.name > b.name ? 1
              : 0,
            )
            .map((item) =>
              btn(item.icon, item.name, () =>
                this.list.create(item, { focus: true }),
              ),
            ),
        ),
      ),

      // main expression list
      this.elExpressions,

      // fake expression
      nextExpression,

      // right border on remainder of the flexbox
      h("flex-1 sm:border-r min-h-24 border-[--nya-border]"),
    )

    const hasToolbar = () => (toolbarItems.length ? true : null)
    const createToolbar = () =>
      h(
        "font-['Symbola','Times_New_Roman',sans-serif] flex overflow-x-auto h-12 min-h-12 bg-[--nya-bg-sidebar] border-b border-[--nya-border] first:*:ml-auto last:*:mr-auto [&::-webkit-scrollbar]:hidden px-2 [grid-area:toolbar]",
        ...toolbarItems.map((x) => x(this)),
      )

    const toolbarDependentCvGradient = h(
      "absolute block top-0 left-0 right-0 h-1 from-[--nya-sidebar-shadow] to-transparent bg-gradient-to-b",
    )

    const cv = h(
      "",
      canvas,
      this.cv.el,
      toolbarDependentCvGradient,
      h(
        "absolute block sm:top-0 bottom-0 left-0 sm:w-1 w-full h-1 sm:h-full from-[--nya-sidebar-shadow] to-transparent bg-gradient-to-t sm:bg-gradient-to-r",
      ),
      h(
        "absolute flex flex-col top-2 right-2 gap-2",
        this.glPixelRatio.el,
        trigKindEl,
      ),
      h(
        "absolute flex flex-col bottom-2 right-2 text-right font-['Symbola'] text-[--nya-title] pointer-events-none [-webkit-text-stroke:2px_var(--nya-bg)] [paint-order:stroke] opacity-30",
        h("text-3xl/[1]", "project nya"),
        h("italic text-sm leading-none", REMARK),
      ),
    )

    const closeAddons = h(
      "mb-2 px-[calc(0.75rem_+_1px)] text-[--nya-text-prose] flex flex-col gap-2",
      px`Addons extend project nya with extra functionality. They can add new functions, data types, and other constructs. Clicking the "Docs" icon will show additional guides after you've selected addons.`,
    )

    const toolbarDependentAddonGradient = h(
      "absolute block top-0 left-0 right-0 h-1 from-[--nya-sidebar-shadow] to-transparent bg-gradient-to-b",
    )

    const addons = h(
      "hidden relative [grid-area:cv] backdrop-blur flex h-full max-h-full",
      h("absolute top-0 left-0 h-full w-full bg-[--nya-bg-sidebar] opacity-80"),
      toolbarDependentAddonGradient,
      h(
        "absolute block sm:top-0 bottom-0 left-0 sm:w-1 w-full h-1 sm:h-full from-[--nya-sidebar-shadow] to-transparent bg-gradient-to-t sm:bg-gradient-to-r",
      ),
      h(
        "absolute top-0 left-0 w-full h-full overflow-y-auto p-4",
        h(
          "w-full flex flex-col gap-2 max-w-2xl mx-auto",
          closeAddons,
          ...createAddons(factory, this, checkIcon),
        ),
      ),
    )
    addons.classList.toggle("hidden", !location.search.includes("showaddons"))

    // dom
    this.glPixelRatio.el.className =
      "block w-48 bg-[--nya-bg] outline outline-1 outline-[--nya-pixel-ratio] rounded-full p-1"
    const toolbarEl = h("contents")
    this.el = h("", titlebar, sidebar, toolbarEl, cv, addons)

    const checkToolbar = (items?: ToolbarItem[]) => {
      if (items) {
        toolbarItems = items
      }

      this.el.classList =
        "bg-[--nya-bg] fixed inset-0 grid select-none grid-cols-[1fr] grid-rows-[3rem_1fr_calc(3rem_+_1px)_1fr] sm:grid-cols-[min(500px,40vw)_1fr] sm:grid-rows-[3rem_1fr] " +
        (hasToolbar() ?
          "[grid-template-areas:'toolbar'_'cv'_'titlebar'_'sidebar'] sm:[grid-template-areas:'titlebar_toolbar'_'sidebar_cv']"
        : "[grid-template-areas:'cv'_'cv'_'titlebar'_'sidebar'] sm:[grid-template-areas:'titlebar_cv'_'sidebar_cv']")
      toolbarDependentAddonGradient.classList.toggle("hidden", !hasToolbar())
      toolbarDependentAddonGradient.classList.toggle("block", !!hasToolbar())
      toolbarDependentCvGradient.classList.toggle("hidden", !hasToolbar())
      toolbarDependentCvGradient.classList.toggle("block", !!hasToolbar())
      cv.className =
        "relative [grid-area:cv]" + (hasToolbar() ? "" : " row-span-2")
      while (toolbarEl.firstChild) {
        toolbarEl.firstChild.remove()
      }
      if (hasToolbar()) {
        toolbarEl.appendChild(createToolbar())
      }
    }
    checkToolbar()

    new ResizeObserver(() => {
      this.el.style.setProperty(
        "--nya-sidebar-raw",
        this.elExpressions.clientWidth + "px",
      )
    }).observe(this.elExpressions)

    this.startGlslLoop()

    window.addEventListener("keydown", (event) => {
      if (
        this.pick.isActive() &&
        event.key == "Escape" &&
        !(event.metaKey || event.shiftKey || event.altKey || event.ctrlKey)
      ) {
        event.preventDefault()
        this.pick.cancel()
      }
    })

    this.checkToolbar = checkToolbar
  }
  private checkToolbar

  async load(id: PackageId) {
    await this.factory.load(id)
    this.factory.loaded[id]?.init?.fn(this) // package is never null by now, but extra checks don't hurt
    tidyCoercions()
    this.checkToolbar(
      Object.entries(this.factory.toolbar)
        .sort((a, b) => +a[0] - +b[0])
        .flatMap((x) => x[1]),
    )
    this.exts.set(
      Object.entries(this.factory.exts)
        .sort((a, b) => +a[0] - +b[0])
        .flatMap((x) => x[1].exts),
    )
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

    // TODO: switch to manually rendering frames
    this.regl.frame(() => {
      this.regl.clear({ color: [0, 0, 0, 0] })

      const program = this.program
      if (!program) return

      const { xmin, w, ymin, h } = this.cv.bounds()
      global(
        {
          // TODO: check that all of these work on canvases where buffer width is smaller than canvas width
          u_scale: splitRaw(w / this.regl._gl.drawingBufferWidth),
          u_cx: splitRaw(xmin),
          u_cy: splitRaw(ymin),
          u_px_per_unit: [
            ...splitRaw(this.cv.width / w),
            ...splitRaw(this.cv.height / h),
          ],
          u_unit_per_hpx: [
            ...splitRaw(1 / this.cv.xPrecision),
            ...splitRaw(1 / this.cv.yPrecision),
          ],
          u_darkmul: isDark() ? [-1, -1, -1, 1] : [1, 1, 1, 1],
          u_darkoffset: isDark() ? [1, 1, 1, 0] : [0, 0, 0, 0],
          u_is_dark: isDark(),
        },

        // this is wrapped because TS errors if you don't wrap it
        () => program(),
      )
    })
  }

  private program: regl.DrawCommand | undefined
  private checkGlsl() {
    const compiled = this.list.glsl()

    if (compiled.length == 0) {
      this.program = undefined
      return
    }

    const ctx = this.scope.propsGlsl().ctx
    declareAddR64(ctx)
    declareMulR64(ctx)
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
    if (globalThis.location?.search.includes("logfrag")) {
      console.log(frag)
    }
    try {
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
    } catch {
      this.program = undefined
    }
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

  createExpr(geo?: boolean) {
    return Expr.of(this, geo)
  }

  // used to avoid circular dependency from src/sheet/factory-expr.ts
  // @ts-expect-error unused
  private _createExprWithRef(ref: ItemRef<Expr>) {
    return new Expr(this, ref)
  }
}

class SheetHandler implements Handler {
  constructor(readonly sheet: Sheet) {}

  find(at: Point, hint: Hint) {
    const record: Record<number, ItemWithTarget[]> = Object.create(null)
    this.sheet.list.find(record, this.sheet.cv.toPaper(at), hint)
    const items = Object.entries(record)
      .sort(([a], [b]) => +b - +a)
      .flatMap((x) => x[1])
    return hint.pick(this.sheet, at, items)
  }

  take(_item: ItemWithTarget | null): void {}
}

export interface Selected<K extends TyName = TyName> {
  val: JsVal<K>
  ref(): Block
}
