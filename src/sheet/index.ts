import { display, getOutputBase } from "../eval/display"
import { defaultPropsGlsl, defaultPropsJs, glsl, js } from "../eval/eval"
import { INTOCOLOR } from "../eval/ops"
import type { JsValue, SReal } from "../eval/ty"
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

export class Expr {
  readonly field

  readonly el
  readonly elIndex
  readonly elValue
  readonly elValueError
  readonly elScroller

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

  static id = 0

  debug() {
    const node = this.field.block.ast()

    this.sheet.elTokens.textContent = JSON.stringify(node, undefined, 2)

    try {
      const props = defaultPropsJs()
      const value = js(node, props)
      const base = getOutputBase(node, props)
      this.displayEval(value, base)
    } catch (e) {
      this.displayError(e instanceof Error ? e : new Error(String(e)))
    }

    try {
      const props = defaultPropsGlsl()
      const value = INTOCOLOR.glsl(props.ctx, glsl(node, props))
      if (value.list) {
        throw new Error("Cannot draw a list of colors.")
      }
      const frag = `#version 300 es
precision highp float;

float times_frc(float a, float b) {
  return mix(0.0, a * b, b != 0.0 ? 1.0 : 0.0);
}

float plus_frc(float a, float b) {
  return mix(a, a + b, b != 0.0 ? 1.0 : 0.0);
}

float minus_frc(float a, float b) {
  return mix(a, a - b, b != 0.0 ? 1.0 : 0.0);
}

// Double emulation based on GLSL Mandelbrot Shader by Henry Thasler (www.thasler.org/blog)
//
// Emulation based on Fortran-90 double-single package. See http://crd.lbl.gov/~dhbailey/mpdist/
// Substract: res = ds_add(a, b) => res = a + b
vec2 add (vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float t1, t2, e;

  t1 = plus_frc(dsa.x, dsb.x);
  e = minus_frc(t1, dsa.x);
  t2 = plus_frc(plus_frc(plus_frc(minus_frc(dsb.x, e), minus_frc(dsa.x, minus_frc(t1, e))), dsa.y), dsb.y);
  dsc.x = plus_frc(t1, t2);
  dsc.y = minus_frc(t2, minus_frc(dsc.x, t1));
  return dsc;
}

// Substract: res = ds_sub(a, b) => res = a - b
vec2 sub (vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float e, t1, t2;

  t1 = minus_frc(dsa.x, dsb.x);
  e = minus_frc(t1, dsa.x);
  t2 = minus_frc(plus_frc(plus_frc(minus_frc(minus_frc(0.0, dsb.x), e), minus_frc(dsa.x, minus_frc(t1, e))), dsa.y), dsb.y);

  dsc.x = plus_frc(t1, t2);
  dsc.y = minus_frc(t2, minus_frc(dsc.x, t1));
  return dsc;
}

// Compare: res = -1 if a < b
//              = 0 if a == b
//              = 1 if a > b
float cmp(vec2 dsa, vec2 dsb) {
  if (dsa.x < dsb.x) {
    return -1.;
  }
  if (dsa.x > dsb.x) {
    return 1.;
  }
  if (dsa.y < dsb.y) {
    return -1.;
  }
  if (dsa.y > dsb.y) {
    return 1.;
  }
  return 0.;
}

// Multiply: res = ds_mul(a, b) => res = a * b
vec2 mul (vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float c11, c21, c2, e, t1, t2;
  float a1, a2, b1, b2, cona, conb, split = 8193.;

  cona = times_frc(dsa.x, split);
  conb = times_frc(dsb.x, split);
  a1 = minus_frc(cona, minus_frc(cona, dsa.x));
  b1 = minus_frc(conb, minus_frc(conb, dsb.x));
  a2 = minus_frc(dsa.x, a1);
  b2 = minus_frc(dsb.x, b1);

  c11 = times_frc(dsa.x, dsb.x);
  c21 = plus_frc(times_frc(a2, b2), plus_frc(times_frc(a2, b1), plus_frc(times_frc(a1, b2), minus_frc(times_frc(a1, b1), c11))));

  c2 = plus_frc(times_frc(dsa.x, dsb.y), times_frc(dsa.y, dsb.x));

  t1 = plus_frc(c11, c2);
  e = minus_frc(t1, c11);
  t2 = plus_frc(plus_frc(times_frc(dsa.y, dsb.y), plus_frc(minus_frc(c2, e), minus_frc(c11, minus_frc(t1, e)))), c21);

  dsc.x = plus_frc(t1, t2);
  dsc.y = minus_frc(t2, minus_frc(dsc.x, t1));

  return dsc;
}

// create double-single number from float
vec2 set(float a) {
  return vec2(a, 0.0);
}

vec4 mul(vec4 A, vec4 B) {
  // (a+bi) * (c+di)
  // ac-bd + i(bc+ad)
  vec2 a = A.xy;
  vec2 b = A.zw;
  vec2 c = B.xy;
  vec2 d = B.zw;
  return vec4(
    sub(mul(a,c), mul(b,d)),
    add(mul(b,c), mul(a,d))
  );
}

uniform vec2 u_scale;
uniform vec2 u_cx;
uniform vec2 u_cy;
out vec4 color;
vec4 v_coords;
void main() {
  vec2 e_tx = set(gl_FragCoord.x);
  vec2 e_ty = set(gl_FragCoord.y);

  // compute position in complex plane from current pixel
  vec2 cx = add(u_cx, mul(e_tx, u_scale));
  vec2 cy = add(u_cy, mul(e_ty, u_scale));
  vec2 px = cx;
  vec2 py = cy;

  int n = 0;
  for (int i=0;i<200;i++) {
    if (add(mul(cx, cx), mul(cy, cy)).x > 4.0) {
      break;
    }
    n++;
    vec4 c = mul(vec4(cx, cy), vec4(cx, cy));
    cx = add(c.xy, px);
    cy = add(c.zw, py);
  }

if (n == 50) {
  color = vec4(1);
} else {
  color = vec4(vec3(1.0 - float(n) / 50.0, 0, 0),1);
  }
}
`
      // const frag = `#version 300 es
      // precision highp float;
      // in vec2 v_coords;
      // out vec4 color;
      // ${props.ctx.helpers.helpers}void main() {
      // ${props.ctx.block}color = ${value.expr};
      // }
      // `
      this.sheet.elGlsl.textContent = frag
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
          u_scale: this.sheet.regl.prop("u_scale"),
          u_cx: this.sheet.regl.prop("u_cx"),
          u_cy: this.sheet.regl.prop("u_cy"),
        },

        count: 6,
      })
      const myId = ++Expr.id
      const draw = () => {
        if (myId != Expr.id) return
        const { xmax, xmin, ymin } = this.sheet.paper.bounds()
        program({
          u_scale: split((xmax - xmin) / this.sheet.paper.el.width),
          u_cx: split(xmin),
          u_cy: split(ymin),
        })
        requestAnimationFrame(draw)
      }
      draw()

      this.sheet.elGlsl.classList.remove(
        "text-red-800",
        "font-sans",
        "text-base",
        "italic",
        "whitespace-pre-wrap",
      )
    } catch (e) {
      this.sheet.elGlsl.textContent = e instanceof Error ? e.message : String(e)
      this.sheet.elGlsl.classList.add(
        "text-red-800",
        "font-sans",
        "text-base",
        "italic",
        "whitespace-pre-wrap",
      )
    }
  }
}

function split(x: number): [number, number] {
  const high = new Float16Array([x])[0]
  return [high, x - high]
}

export class Sheet {
  readonly exprs: Expr[] = []
  readonly paper = new Paper()

  readonly el
  readonly elExpressions
  readonly elNextIndex
  readonly elNextExpr
  readonly elLogo
  readonly elTokens
  readonly elGlsl
  readonly elShaderCanvas

  readonly regl

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

    this.elTokens = hx(
      "pre",
      "overflow-y-auto text-sm border-l border-slate-200 px-2 py-2 border-t",
    )

    this.elGlsl = hx(
      "pre",
      "overflow-y-auto text-sm border-l border-slate-200 px-2 py-2",
    )

    this.el = h(
      "block fixed inset-0 grid grid-cols-[600px_1fr_200px] grid-rows-1 select-none [--nya-focus:theme(colors.blue.400)]",
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
          "absolute inset-0 size-full pointer-events-none",
        )),
        this.paper.el,
        h(
          "absolute block top-0 bottom-0 left-0 w-1 from-slate-950/10 to-transparent bg-gradient-to-r",
        ),
        h(
          "absolute block top-0 bottom-0 right-0 w-1 from-slate-950/10 to-transparent bg-gradient-to-l",
        ),
      ),
      h("grid grid-rows-2", this.elGlsl, this.elTokens),
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
    doMatchReglSize(this.elShaderCanvas, this.regl)
    this.paper.el.classList.add("absolute", "inset-0")

    new ResizeObserver((entries) => {
      const entry = entries[0]!
      const { width } = entry.contentRect
      this.el.style.setProperty("--nya-sheet-sidebar", width + "px")
    }).observe(this.elExpressions)
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

  onExprFocus?(expr: Expr): void {
    expr.debug()
  }

  onExprChange?(expr: Expr): void {
    expr.debug()
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
]

const REMARK = REMARKS[Math.floor(REMARKS.length * Math.random())]!
