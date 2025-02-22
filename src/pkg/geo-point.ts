import type { Package } from "."
import { dragPoint } from "../eval/ast/tx"
import type { GlslContext } from "../eval/lib/fn"
import { FnDist } from "../eval/ops/dist"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../eval/ops/vars"
import { each, type JsValue } from "../eval/ty"
import { approx, frac, num, pt, real, unpt } from "../eval/ty/create"
import { highRes, TY_INFO, WRITE_POINT, type TyGlide2 } from "../eval/ty/info"
import { abs, add, mul, neg } from "../eval/ty/ops"
import { OpEq } from "../field/cmd/leaf/cmp"
import { CmdDot } from "../field/cmd/leaf/dot"
import { CmdVar } from "../field/cmd/leaf/var"
import { Block, L, R } from "../field/model"
import { h, sx } from "../jsx"
import { Prop } from "../sheet/ext"
import { defineHideable } from "../sheet/ext/hideable"
import type { Paper, Point } from "../sheet/ui/paper"
import type { Paper2 } from "../sheet/ui/paper2"
import {
  HANDLER_DRAG,
  HANDLER_PICK,
  type DragProps,
  type PickProps,
} from "../sheet/ui/paper2/interact"
import type { Sheet } from "../sheet/ui/sheet"
import { virtualStepExp, write, Writer } from "../sheet/write"
import { FN_VALID } from "./bool"
import { OP_PLOT, plotJs } from "./color-core"
import {
  abs64,
  addR64,
  declareMulR64,
  declareOdotC64,
  OP_ABS,
  OP_ADD,
  OP_NEG,
  OP_ODOT,
  OP_POINT,
  OP_POS,
} from "./core-ops"
import { EXT_EVAL } from "./eval"
import { createPickByTy, PICK_BY_TY, picker } from "./geo/pick-normal"
import { FN_UNSIGN, PKG_REAL } from "./num-real"

declare module "../eval/ty" {
  interface Tys {
    point32: SPoint
    point64: SPoint
  }

  interface TyComponents {
    point32: "r32"
    point64: "r64"
  }
}

declare module "../eval/ast/token" {
  interface PuncListSuffix {
    ".x": 0
    ".y": 0
  }
}

const SELECTED = new Prop(() => false)
const DIMMED = new Prop(() => false)

export function drawPoint(
  paper: Paper,
  at: Point,
  size = 4,
  halo?: boolean,
  dimmed?: boolean,
) {
  const offset = paper.paperToCanvas(at)
  if (!(isFinite(offset.x) && isFinite(offset.y))) return
  const { ctx, scale } = paper

  if (dimmed) {
    ctx.globalAlpha = 0.3
  }

  if (halo) {
    ctx.beginPath()
    ctx.fillStyle = "#6042a659"
    ctx.arc(offset.x, offset.y, 12 * scale, 0, 2 * Math.PI)
    ctx.fill()
  }

  ctx.beginPath()
  ctx.fillStyle = "#6042a6"
  ctx.arc(offset.x, offset.y, size * scale, 0, 2 * Math.PI)
  ctx.fill()

  if (dimmed) {
    ctx.globalAlpha = 1
  }
}

export function drawPoint2(
  paper: Paper2,
  props: {
    at: Point
    size?: number
    halo?: boolean
    dimmed?: boolean
    hover?: boolean
    drag?: DragProps
    pick?: PickProps
  },
) {
  const offset = paper.toOffset(props.at)
  if (!(isFinite(offset.x) && isFinite(offset.y))) return

  const center = sx("circle", {
    class: props.hover ? "transition-[r] group-hover:[r:12]" : "transition-[r]",
    cx: offset.x,
    cy: offset.y,
    r: props.size ?? 4,
    fill: "#6042a6",
    "fill-opacity": props.dimmed ? 0.3 : 1,
  })

  if (props.halo) {
    paper.append(
      "point",
      sx(
        "g",
        { class: "group cursor-move", drag: props.drag, pick: props.pick },
        sx("circle", {
          cx: offset.x,
          cy: offset.y,
          r: 12,
          fill: "#6042a659",
          "fill-opacity": props.dimmed ? 0.3 : 1,
        }),
        center,
      ),
    )
  } else {
    if (props.drag) {
      HANDLER_DRAG.set(center, props.drag)
    }
    if (props.pick) {
      HANDLER_PICK.set(center, props.pick)
    }
    paper.append("point", center)
  }
}

const EXT_POINT = defineHideable({
  data(expr) {
    const value = expr.js?.value

    let node = expr.field.ast
    if (node.type == "binding") node = node.value

    const drag = dragPoint(node, expr.sheet.scope.propsDrag(expr.field))

    if (
      value &&
      (value.type == "point32" ||
        value.type == "point64" ||
        value.type == "c32" ||
        value.type == "c64")
    ) {
      return {
        value: value as JsValue<"point32" | "point64" | "c32" | "c64">,
        paper: expr.sheet.paper,
        paper2: expr.sheet.paper2,
        expr,
        drag,
      }
    }
  },
  el(data) {
    return EXT_EVAL.el!(EXT_EVAL.data(data.expr)!)
  },
  svg(data, paper) {
    for (const pt of each(data.value)) {
      const { drag } = data
      const move =
        drag &&
        ((at: Point) => {
          switch (drag.type) {
            case "split":
              if (drag.x) {
                new Writer(drag.x.span.remove().span()).set(
                  at.x,
                  data.paper.el.width / data.paper.bounds().w,
                  drag.x.signed,
                )
                drag.x.field.sel = drag.x.field.block.cursor(R).selection()
                drag.x.field.queueAstUpdate()
              }

              if (drag.y) {
                new Writer(drag.y.span.remove().span()).set(
                  at.y,
                  data.paper.el.height / data.paper.bounds().h,
                  drag.y.signed,
                )
                drag.y.field.sel = drag.y.field.block.cursor(R).selection()
                drag.y.field.queueAstUpdate()
              }

              break
            case "complex":
              {
                const x = at.x
                const xp = data.paper.el.width / data.paper.bounds().w
                const y = at.y
                const yp = data.paper.el.height / data.paper.bounds().h
                const cursor = drag.span.remove()
                write(
                  cursor,
                  real(x),
                  frac(10, 1),
                  virtualStepExp(xp, 10),
                  false,
                )
                write(
                  cursor,
                  real(y),
                  frac(10, 1),
                  virtualStepExp(yp, 10),
                  true,
                )
                new CmdVar("i", data.expr.field.options).insertAt(cursor, L)
                drag.field.sel = drag.field.block.cursor(R).selection()
                drag.field.queueAstUpdate()
              }
              break
            case "glider":
              {
                const { value, precision } = (
                  TY_INFO[drag.shape.type].glide2! as TyGlide2<any>
                )({
                  paper: data.paper2,
                  point: at,
                  shape: drag.shape.value,
                })
                new Writer(drag.value.span.remove().span()).set(
                  value,
                  precision,
                )
                drag.value.field.sel = drag.value.field.block
                  .cursor(R)
                  .selection()
                drag.value.field.queueAstUpdate()
              }
              break
          }
        })
      drawPoint2(paper, {
        at: unpt(pt),
        dimmed: DIMMED.get(data.expr),
        size: SELECTED.get(data.expr) ? 6 : 4,
        halo: !!drag,
        hover: !!drag,
        drag: move ? () => move : undefined,
        pick: {
          val() {
            return {
              type:
                data.value.type == "c32" ? "point32"
                : data.value.type == "c64" ? "point64"
                : data.value.type,
              value: pt,
            }
          },
          ref() {
            if (data.expr.field.ast.type == "binding") {
              const block = new Block(null)
              CmdVar.leftOf(
                block.cursor(R),
                data.expr.field.ast.name,
                data.expr.field.options,
              )
              return block
            }

            const name = data.expr.sheet.scope.name("p")
            const c = data.expr.field.block.cursor(L)
            CmdVar.leftOf(c, name, data.expr.field.options)
            new OpEq(false).insertAt(c, L)
            data.expr.field.dirtyAst = data.expr.field.dirtyValue = true
            data.expr.field.trackNameNow()
            data.expr.field.scope.queueUpdate()

            const block = new Block(null)
            const cursor = block.cursor(R)
            CmdVar.leftOf(cursor, name, data.expr.field.options)
            if (data.value.type.startsWith("c")) {
              new CmdDot().insertAt(cursor, L)
              for (const c of "point") {
                new CmdVar(c, data.expr.field.options).insertAt(cursor, L)
              }
            }

            return block
          },
        },
      })
    }
  },
})

export const FN_GLIDER = new FnDist<"point32">(
  "glider",
  "constructs a point on an object",
)

export const FN_INTERSECTION = new FnDist<"point32">(
  "intersection",
  "constructs the point where two objects intersect",
)

const FN_SCREENDISTANCE = new FnDist<"r32">(
  "screendistance",
  "calculates the distance between two points in terms of pixels on your screen, rather than graphpaper units",
)

const PICK_POINT = createPickByTy("p", null, [["point32", "point64"]], () => {})

export const FN_DEBUGPOINT = new FnDist(
  "debugpoint",
  "given some point p, returns a color depending on which side of the currently active shader pixel that point p is on",
)

const OP_X = new FnDist(
  ".x",
  "accesses the x-coordinate of a point or complex number",
)

const OP_Y = new FnDist(
  ".y",
  "accesses the y-coordinate of a point or complex number",
)

export function declareDebugPoint(
  ctx: GlslContext,
  a: { type: "c32" | "point32"; expr: string },
): string {
  ctx.glsl`vec4 _helper_debugpoint_c32(vec2 z) {
  return vec4(
    sign(v_coords.x - z.x) / 2.0 + 0.5,
    sign(v_coords.z - z.y) / 2.0 + 0.5,
    1,
    1
  );
}
`
  return `_helper_debugpoint_c32(${a.expr})`
}

export const PKG_GEO_POINT: Package = {
  id: "nya:geo-point",
  name: "geometric points",
  label: "geometric points in 2D",
  deps: [() => PKG_REAL],
  init() {
    FN_SCREENDISTANCE.add(
      ["point32", "point32"],
      "r32",
      () => {
        throw new Error("Cannot calculate screendistance outside of shaders.")
      },
      (_, a, b) => {
        return `length((${a.expr} - ${b.expr}) * u_px_per_unit.xz)`
      },
    )

    OP_ADD.add(
      ["point64", "point64"],
      "point64",
      (a, b) => pt(add(a.value.x, b.value.x), add(a.value.y, b.value.y)),
      (ctx, ar, br) => {
        const a = ctx.cache(ar)
        const b = ctx.cache(br)
        return `vec4(${addR64(ctx, `${a}.xy`, `${b}.xy`)}, ${addR64(ctx, `${a}.zw`, `${b}.zw`)})`
      },
    ).add(
      ["point32", "point32"],
      "point32",
      (a, b) => pt(add(a.value.x, b.value.x), add(a.value.y, b.value.y)),
      (_, a, b) => `(${a.expr} + ${b.expr})`,
    )

    FN_UNSIGN.add(
      ["point64"],
      "point64",
      (a) => pt(abs(a.value.x), abs(a.value.y)),
      (ctx, a) => {
        const name = ctx.cache(a)
        return `vec4(${abs64(ctx, `${name}.xy`)}, ${abs64(ctx, `${name}.zw`)})`
      },
    ).add(
      ["point32"],
      "point32",
      (a) => pt(abs(a.value.x), abs(a.value.y)),
      (_, a) => `abs(${a.expr})`,
    )

    OP_X.add(
      ["point64"],
      "r64",
      (a) => a.value.x,
      (_, a) => `${a.expr}.xy`,
    ).add(
      ["point32"],
      "r32",
      (a) => a.value.x,
      (_, a) => `${a.expr}.x`,
    )

    OP_Y.add(
      ["point64"],
      "r64",
      (a) => a.value.y,
      (_, a) => `${a.expr}.zw`,
    ).add(
      ["point32"],
      "r32",
      (a) => a.value.y,
      (_, a) => `${a.expr}.y`,
    )

    OP_PLOT.add(
      ["point32"],
      "color",
      plotJs,
      (ctx, a) => FN_DEBUGPOINT.glsl1(ctx, a).expr,
    )

    OP_ABS.add(
      ["point32"],
      "r32",
      // TODO: this is exact for some values
      (a) => approx(Math.hypot(num(a.value.x), num(a.value.y))),
      (_, a) => `length(${a.expr})`,
    )

    OP_NEG.add(
      ["point64"],
      "point64",
      (a) => pt(neg(a.value.x), neg(a.value.y)),
      (_, a) => `(-${a.expr})`,
    ).add(
      ["point32"],
      "point32",
      (a) => pt(neg(a.value.x), neg(a.value.y)),
      (_, a) => `(-${a.expr})`,
    )

    FN_VALID.add(
      ["point32"],
      "bool",
      (a) => isFinite(num(a.value.x)) && isFinite(num(a.value.y)),
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `(!isnan(${a}.x) && !isinf(${a}.x) && !isnan(${a}.y) && !isinf(${a}.y))`
      },
    )

    OP_ODOT.add(
      ["point64", "point64"],
      "point64",
      (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
      (ctx, a, b) => {
        declareMulR64(ctx)
        declareOdotC64(ctx)
        return `_helper_odot_c64(${a.expr}, ${b.expr})`
      },
    ).add(
      ["point32", "point32"],
      "point32",
      (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
      (_, a, b) => {
        return `(${a.expr} * ${b.expr})`
      },
    )

    OP_POINT.add(
      ["r64", "r64"],
      "point64",
      (x, y) => pt(x.value, y.value),
      (_, x, y) => `vec4(${x.expr}, ${y.expr})`,
    ).add(
      ["r32", "r32"],
      "point32",
      (x, y) => pt(x.value, y.value),
      (_, x, y) => `vec2(${x.expr}, ${y.expr})`,
    )

    OP_POS.add(
      ["point64"],
      "point64",
      (a) => a.value,
      (_, a) => a.expr,
    ).add(
      ["point32"],
      "point32",
      (a) => a.value,
      (_, a) => a.expr,
    )

    FN_DEBUGPOINT.add(
      ["point32"],
      "color",
      () => {
        throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
      },
      (ctx, a) => declareDebugPoint(ctx, a),
    )
  },
  ty: {
    info: {
      point64: {
        name: "point",
        namePlural: "points",
        glsl: "vec4",
        garbage: { js: pt(real(NaN), real(NaN)), glsl: "vec4(0.0/0.0)" },
        coerce: {
          point32: {
            js(self) {
              return self
            },
            glsl(self) {
              return `${self}.xz`
            },
          },
        },
        write: WRITE_POINT,
        icon() {
          return iconPoint(true)
        },
        components: {
          ty: "r64",
          at: [
            [(x) => x.x, (x) => `${x}.xy`],
            [(x) => x.y, (x) => `${x}.zw`],
          ],
        },
      },
      point32: {
        name: "point",
        namePlural: "points",
        glsl: "vec2",
        garbage: { js: pt(real(NaN), real(NaN)), glsl: "vec2(0.0/0.0)" },
        coerce: {},
        write: WRITE_POINT,
        icon() {
          return iconPoint(false)
        },
        components: {
          ty: "r32",
          at: [
            [(x) => x.x, (x) => `${x}.x`],
            [(x) => x.y, (x) => `${x}.y`],
          ],
        },
      },
    },
  },
  eval: {
    fns: {
      screendistance: FN_SCREENDISTANCE,
      debugpoint: FN_DEBUGPOINT,
    },
    op: {
      unary: {
        ".x": OP_X,
        ".y": OP_Y,
      },
    },
  },
  sheet: {
    exts: {
      1: [EXT_POINT],
    },
    toolbar: {
      1: [picker(() => iconPoint(false), PICK_POINT)],
    },
    keys: {
      p: (sheet: Sheet) => sheet.setPick(PICK_BY_TY, PICK_POINT),
    },
  },
}

function iconPoint(hd: boolean) {
  return h(
    "",
    h(
      "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px]" +
        (hd ? " border-double border-[3px]" : " border-2"),
      h(
        "opacity-25 block bg-current absolute " +
          (hd ? " -inset-[2px] rounded-[2px]" : "inset-0"),
      ),
      h(
        "size-[7px] bg-current absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      ),
      hd ? highRes() : null,
    ),
  )
}
