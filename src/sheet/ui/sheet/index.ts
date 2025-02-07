import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { faBook } from "@fortawesome/free-solid-svg-icons/faBook"
import { faCopy } from "@fortawesome/free-solid-svg-icons/faCopy"
import { faListUl } from "@fortawesome/free-solid-svg-icons/faListUl"
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash"
import type { Regl } from "regl"
import regl from "regl"
import { GlslContext, GlslHelpers } from "../../../eval/lib/fn"
import { FNS } from "../../../eval/ops"
import { ALL_FNS } from "../../../eval/ops/dist"
import { declareAddR64 } from "../../../eval/ops/op/add"
import { declareMulR64 } from "../../../eval/ops/op/mul"
import { num, real } from "../../../eval/ty/create"
import { any, TY_INFO } from "../../../eval/ty/info"
import { splitRaw } from "../../../eval/ty/split"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdNum } from "../../../field/cmd/leaf/num"
import { OpRightArrow } from "../../../field/cmd/leaf/op"
import { CmdWord } from "../../../field/cmd/leaf/word"
import { CmdPiecewise } from "../../../field/cmd/logic/piecewise"
import { CmdBrack } from "../../../field/cmd/math/brack"
import { CmdSupSub } from "../../../field/cmd/math/supsub"
import { fa } from "../../../field/fa"
import type { Options } from "../../../field/options"
import { h, hx, t } from "../../../jsx"
import { Scope } from "../../deps"
import type { Exts } from "../../ext"
import { doMatchReglSize } from "../../regl"
import { REMARK } from "../../remark"
import { Slider } from "../../slider"
import { isDark } from "../../theme"
import { Expr } from "../expr"
import { createDrawAxes, makeInteractive, matchSize, Paper } from "../paper"
import { Handlers } from "./handler"

function createDocs(className: string, hide: () => void) {
  function makeDoc(fn: { name: string; label: string; docs(): Node[] }) {
    return h(
      "flex flex-col",
      h(
        "text-[1.265rem]/[1.15]",
        ...(fn.name.match(/[a-z]+|[^a-z]+/g) || []).map((x) =>
          x.match(/[a-z]/) ?
            h("font-['Times_New_Roman']", x)
          : h("font-['Symbola']", x),
        ),
      ),
      h("text-sm leading-tight text-slate-500", fn.label),
      h("flex flex-col pl-4 mt-1", ...fn.docs()),
    )
  }

  function title(label: string) {
    const btn = hx(
      "button",
      "bg-[--nya-bg] border border-[--nya-border] size-8 flex rounded-md mb-0.5 -mt-0.5 -mr-1.5",
      fa(faListUl, "size-4 m-auto fill-[--nya-title]"),
    )

    btn.addEventListener("click", hide)

    return h(
      "sticky top-0 z-10 bg-[--nya-bg] pt-2",
      h(
        "flex bg-[--nya-bg-sidebar] border border-[--nya-border] -mx-2 rounded-lg px-2 pt-1 font-['Symbola'] text-[1.265rem] text-center",
        h("flex-1", label),
        btn,
      ),
    )
  }

  function section(label: string, data: Node[]) {
    return h("flex flex-col gap-4", title(label), ...data)
  }

  function secAdvancedOperators() {
    let q

    return section("advanced operators", [
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                any(),
                new CmdWord("base", "infix").el,
                TY_INFO.r32.icon(),
              ),
            }),
            new OpRightArrow().el,
            any(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "interprets <left side> as being in base <right side>",
        ),
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                any(),
                new CmdWord("with", "infix").el,
                new CmdWord("a", undefined, true).el,
                new OpEq(false).el,
                any("text-[#2d70b3]"),
              ),
            }),
            new OpRightArrow().el,
            any(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "evaluates <left side> with <a> set to <right side>",
        ),
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdPiecewise.render([
              { el: any() },
              { el: TY_INFO.bool.icon() },
              { el: any() },
              { el: TY_INFO.bool.icon() },
              { el: any() },
              { el: (q = h("")) },
            ]),
            (q.parentElement?.classList.add("nya-has-empty"),
            new OpRightArrow().el),
            any(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "piecewise function; returns the first value whose “if” condition is true",
        ),
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h("", new CmdWord("forceshader", "prefix").el, any()),
            }),
            new OpRightArrow().el,
            any(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "forces the passed expression to be evaluated in a shader",
        ),
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                new CmdWord("iterate", "prefix").el,
                CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                new CmdWord("a", undefined, true).el,
                new OpRightArrow().el,
                TY_INFO.r32.icon(),
              ),
            }),
            new OpRightArrow().el,
            TY_INFO.r32.icon(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "sets <a> to some expression 50 times, starting with a=0, then returns <a>",
        ),
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                new CmdWord("iterate", "prefix").el,
                CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                new CmdWord("a", undefined, true).el,
                new OpRightArrow().el,
                any(),
                new CmdWord("from", "infix").el,
                any(),
              ),
            }),
            new OpRightArrow().el,
            any(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "sets <a> to some expression 50 times, starting with the expression after the word “from”, then returns <a>",
        ),
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                new CmdWord("iterate", "prefix").el,
                CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                new CmdWord("a", undefined, true).el,
                new OpRightArrow().el,
                TY_INFO.r32.icon(),
                new CmdWord("while", "infix").el,
                TY_INFO.bool.icon(),
              ),
            }),
            new OpRightArrow().el,
            TY_INFO.r32.icon(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "sets <a> to some expression 50 times, starting with a=0, then returns <a>; if the “while” clause is ever false, returns <a> immediately",
        ),
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                new CmdWord("iterate", "prefix").el,
                CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                new CmdWord("a", undefined, true).el,
                new OpRightArrow().el,
                TY_INFO.r32.icon(),
                new CmdWord("until", "infix").el,
                TY_INFO.bool.icon(),
              ),
            }),
            new OpRightArrow().el,
            TY_INFO.r32.icon(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "sets <a> to some expression 50 times, starting with a=0, then returns <a>; if the “until” clause is ever true, returns <a> immediately",
        ),
      ),
    ])
  }

  function secDataTypes() {
    return section("data types", [
      h(
        "flex flex-col",
        ...Object.entries(TY_INFO)
          .filter((x) => !x[0].endsWith("64"))
          .map(([, info]) => h("flex gap-1", info.icon(), info.name)),
        h("flex gap-1", any(), "any type"),
      ),
      hx(
        "p",
        "",
        "When running in shaders, most values are low-resolution, causing early pixelation. Some data types, however, support high-resolution variants:",
      ),
      h(
        "flex flex-col",
        ...Object.entries(TY_INFO)
          .filter((x) => x[0].endsWith("64"))
          .map(([, info]) =>
            h("flex gap-1", info.icon(), info.name + " (high-res)"),
          ),
      ),
    ])
  }

  function secNamedFunctions() {
    return section(
      "named functions",
      ALL_FNS.filter((x) => Object.values(FNS).includes(x))
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .map(makeDoc),
    )
  }

  function secUnnamedFunctions() {
    return section(
      "operators",
      ALL_FNS.filter((x) => !Object.values(FNS).includes(x))
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .map(makeDoc),
    )
  }

  return h(
    className,
    secDataTypes(),
    secAdvancedOperators(),
    secNamedFunctions(),
    secUnnamedFunctions(),
  )
}

export class Sheet {
  readonly paper = new Paper()
  readonly helpers = new GlslHelpers()
  readonly scope: Scope
  readonly exprs: Expr[] = []

  private readonly pixelRatio
  private readonly setPixelRatio
  private readonly glPixelRatio = new Slider()

  private readonly handlers = new Handlers(this)
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
  ) {
    this.scope = new Scope(options)
    Object.assign(globalThis, { scope: this.scope })

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
      this.paper.ctx.lineJoin = "round"
      this.paper.ctx.lineCap = "round"
      for (const e of this.exprs
        .filter((x) => x.state.ok && x.state.ext?.plot2d != null)
        .sort((a, b) => a.layer - b.layer)) {
        if (e.state.ok && e.state.ext?.plot2d) {
          try {
            e.state.ext.plot2d(e.state.data, this.paper)
          } catch {}
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

    function btn(
      icon: IconDefinition,
      label: Node | string,
      action: () => void,
    ) {
      const el = hx(
        "button",
        "flex flex-col h-full aspect-square [line-height:1] hover:bg-[--nya-sidebar-hover] hover:text-[--nya-title-dark] rounded",
        h(
          "flex flex-col m-auto",
          fa(icon, "mx-auto size-5 fill-current"),
          h("text-[80%]/[.5] mt-1.5 lowercase", label),
        ),
      )
      el.addEventListener("click", action)
      return el
    }

    const switchToDocs = btn(faBook, "Help", () => {
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
          copyAllLabel.data = "Copied! ✅"
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
      "relative text-left grid grid-cols-[2.5rem_auto] min-h-[3.625rem] border-r border-[--nya-border] mb-24",

      // grey side of expression
      h(
        "inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border]",
        this.elNextIndex,
      ),

      // main expression body
      // TODO: make this clickable

      // cover
      h("absolute inset-0 from-transparent to-[--nya-bg] bg-gradient-to-b"),
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
      h("flex-1 border-r border-[--nya-border]"),
    )

    const toolbar = h(
      "font-['Symbola','Times_New_Roman',sans-serif] flex overflow-x-auto h-12 min-h-12 bg-[--nya-bg-sidebar] border-b border-[--nya-border]",
      h("m-auto text-2xl text-[--nya-title]", "geometry tools coming soon!"),
    )

    const docs = createDocs(
      "flex flex-col overflow-y-auto px-4 pb-4 gap-2 border-r border-[--nya-border] hidden row-span-2",
      () => {
        docs.classList.add("hidden")
        sidebar.classList.remove("hidden")
      },
    )

    // dom
    this.glPixelRatio.el.className =
      "block w-48 bg-[--nya-bg] outline outline-[--nya-pixel-ratio] rounded-full p-1"
    this.el = h(
      "fixed inset-0 grid grid-cols-[400px_1fr] grid-rows-[3rem_1fr] grid-rows-1 select-none",

      sidebar,
      docs,
      toolbar,

      h(
        "relative",
        canvas,
        this.paper.el,
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
        // @ts-expect-error
        u_darkmul: this.regl.prop("u_darkmul"),
        // @ts-expect-error
        u_darkoffset: this.regl.prop("u_darkoffset"),
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
            ...splitRaw(this.paper.el.clientWidth / w),
            ...splitRaw(this.paper.el.clientHeight / h),
          ],
          u_darkmul: isDark() ? [-1, -1, -1, 1] : [1, 1, 1, 1],
          u_darkoffset: isDark() ? [1, 1, 1, 0] : [0, 0, 0, 0],
        },
        () => program(),
      )
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
uniform vec4 u_darkmul;
uniform vec4 u_darkoffset;
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

if (location.search.includes("?docsonly")) {
  const el = createDocs(
    "fixed inset-0 *:*:relative first:*:*:[grid-column:1_/_-1] *:grid *:grid-cols-[repeat(auto-fill,minmax(400px,1fr))] overflow-y-auto px-4 pb-4 gap-2 z-20 bg-[--nya-bg]",
    () => el.remove(),
  )

  document.body.appendChild(el)
}
