import type { Package } from "."
import { dragPoint } from "../eval/ast/tx"
import type { GlslContext } from "../eval/lib/fn"
import { FnDist } from "../eval/ops/dist"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../eval/ops/vars"
import { each, type JsValue } from "../eval/ty"
import { approx, num, pt, SNANPT, unpt } from "../eval/ty/create"
import { highRes, WRITE_POINT } from "../eval/ty/info"
import { abs, add, div, mul, neg } from "../eval/ty/ops"
import { h, sx } from "../jsx"
import { defineHideable } from "../sheet/ext/hideable"
import { definePickTy, PICK_TY, toolbar } from "../sheet/pick-ty"
import type { Point } from "../sheet/point"
import { Colors, Order, Size } from "../sheet/ui/cv/consts"
import type { DrawProps, Paper } from "../sheet/ui/paper"
import { HANDLER_DRAG, HANDLER_PICK } from "../sheet/ui/paper/interact"
import { Sheet } from "../sheet/ui/sheet"
import { FN_VALID } from "./bool"
import { OP_PLOT, plotJs } from "./color-core"
import {
  abs64,
  addR64,
  declareMulR64,
  declareOdotC64,
  OP_ABS,
  OP_ADD,
  OP_CDOT,
  OP_DIV,
  OP_NEG,
  OP_ODOT,
  OP_POINT,
  OP_POS,
} from "./core-ops"
import { EXT_EVAL } from "./eval"
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

export function drawPoint(
  paper: Paper,
  props: {
    at: Point
    halo?: boolean
    hover?: boolean
    cursor?: "auto" | "pointer"
  } & Omit<DrawProps, "kind">,
) {
  const offset = paper.toOffset(props.at)
  if (!(isFinite(offset.x) && isFinite(offset.y))) return

  const ghost =
    props.ghost ? " pointer-events-none"
    : props.cursor == "pointer" ? " cursor-pointer"
    : props.cursor == "auto" ? ""
    : props.drag ? " cursor-move"
    : ""

  const center = sx("circle", {
    class:
      (props.hover ?
        "transition-[r] group-hover:[r:12] picking-any:group-hover:[r:4]"
      : "transition-[r]") +
      (props.ghost ? " pointer-events-none" : "") +
      " picking-any:opacity-30 picking-point:opacity-100",
    cx: offset.x,
    cy: offset.y,
    r: 4,
    fill: "#6042a6",
  })

  if (props.halo || props.drag || props.pick) {
    paper.append(
      "point",
      sx(
        "g",
        { class: "group" + ghost },
        center,
        sx("circle", {
          cx: offset.x,
          cy: offset.y,
          r: 12,
          fill: props.halo ? "#6042a659" : "transparent",
          class: "picking-any:opacity-30 picking-point:opacity-100",
          drag: props.drag,
          pick: props.pick,
        }),
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

  return center
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
        expr,
        drag,
        cv: expr.sheet.cv,
      }
    }
  },
  el(data) {
    return EXT_EVAL.el!(EXT_EVAL.data(data.expr)!)
  },
  // FIXME: remove this after using it as a reference
  //   svg(data, paper) {
  //     for (const pt of each(data.value)) {
  //       const { drag } = data
  //       const move =
  //         drag &&
  //         ((at: Point) => {
  //           switch (drag.type) {
  //             case "split":
  //               if (drag.x) {
  //                 new Writer(drag.x.span.remove().span()).set(
  //                   at.x,
  //                   data.paper.xPrecision,
  //                   drag.x.signed,
  //                 )
  //                 drag.x.field.sel = drag.x.field.block.cursor(R).selection()
  //                 drag.x.field.queueAstUpdate()
  //               }
  //
  //               if (drag.y) {
  //                 new Writer(drag.y.span.remove().span()).set(
  //                   at.y,
  //                   data.paper.yPrecision,
  //                   drag.y.signed,
  //                 )
  //                 drag.y.field.sel = drag.y.field.block.cursor(R).selection()
  //                 drag.y.field.queueAstUpdate()
  //               }
  //
  //               break
  //             case "complex":
  //               {
  //                 const x = at.x
  //                 const xp = data.paper.xPrecision
  //                 const y = at.y
  //                 const yp = data.paper.yPrecision
  //                 const cursor = drag.span.remove()
  //                 write(
  //                   cursor,
  //                   real(x),
  //                   frac(10, 1),
  //                   virtualStepExp(xp, 10),
  //                   false,
  //                 )
  //                 write(
  //                   cursor,
  //                   real(y),
  //                   frac(10, 1),
  //                   virtualStepExp(yp, 10),
  //                   true,
  //                 )
  //                 new CmdVar("i", data.expr.field.options).insertAt(cursor, L)
  //                 drag.field.sel = drag.field.block.cursor(R).selection()
  //                 drag.field.queueAstUpdate()
  //               }
  //               break
  //             case "glider":
  //               {
  //                 const { value, precision } = (
  //                   TY_INFO[drag.shape.type].glide! as TyGlide<any>
  //                 )({
  //                   paper: data.paper,
  //                   point: at,
  //                   shape: drag.shape.value,
  //                 })
  //                 new Writer(drag.value.span.remove().span()).set(
  //                   value,
  //                   precision,
  //                 )
  //                 drag.value.field.sel = drag.value.field.block
  //                   .cursor(R)
  //                   .selection()
  //                 drag.value.field.queueAstUpdate()
  //               }
  //               break
  //           }
  //         })
  //
  //       const center = drawPoint(paper, {
  //         at: unpt(pt),
  //         halo: !!drag,
  //         hover: !!drag,
  //         drag: move ? () => move : undefined,
  //         pick: {
  //           val() {
  //             return {
  //               type:
  //                 data.value.type == "c32" ? "point32"
  //                 : data.value.type == "c64" ? "point64"
  //                 : data.value.type,
  //               value: pt,
  //             }
  //           },
  //           ref() {
  //             if (data.expr.field.ast.type == "binding") {
  //               const block = new Block(null)
  //               const cursor = block.cursor(R)
  //               CmdVar.leftOf(
  //                 cursor,
  //                 data.expr.field.ast.name,
  //                 data.expr.field.options,
  //                 data.expr.field.ctx,
  //               )
  //               if (data.value.type.startsWith("c")) {
  //                 new CmdDot().insertAt(cursor, L)
  //                 for (const c of "point") {
  //                   new CmdVar(c, data.expr.field.options).insertAt(cursor, L)
  //                 }
  //               }
  //               return block
  //             }
  //
  //             const c = data.expr.field.block.cursor(L)
  //             const token = CmdToken.new(data.expr.field.scope.ctx)
  //             token.insertAt(c, L)
  //             new OpEq(false).insertAt(c, L)
  //             data.expr.field.dirtyAst = data.expr.field.dirtyValue = true
  //             data.expr.field.trackNameNow()
  //             data.expr.field.scope.queueUpdate()
  //
  //             const block = new Block(null)
  //             const cursor = block.cursor(R)
  //             token.clone().insertAt(cursor, L)
  //             if (data.value.type.startsWith("c")) {
  //               new CmdDot().insertAt(cursor, L)
  //               for (const c of "point") {
  //                 new CmdVar(c, data.expr.field.options).insertAt(cursor, L)
  //               }
  //             }
  //
  //             return block
  //           },
  //           draw() {
  //             center!.style.transition = "none"
  //             center!.style.r = "6"
  //             center!.parentElement!.style.cursor = "pointer"
  //           },
  //           focus() {
  //             requestAnimationFrame(() => data.expr.focus())
  //           },
  //         },
  //       })
  //     }
  //   },
  plot: {
    order: Order.Point,
    draw({ drag, cv, value }) {
      for (const val of each(value)) {
        cv.point(unpt(val), Size.Point, Colors.Purple)
        if (drag) {
          cv.point(unpt(val), Size.PointHaloWide, Colors.Purple, 0.3)
        }
      }
    },
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

const PICK_POINT = definePickTy(null, [["point32", "point64"]], () => {})

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
  load() {
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

    OP_CDOT.add(
      ["point32", "r32"],
      "point32",
      (a, b) => pt(mul(a.value.x, b.value), mul(a.value.y, b.value)),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
    )
      .add(
        ["r32", "point32"],
        "point32",
        (b, a) => pt(mul(a.value.x, b.value), mul(a.value.y, b.value)),
        (_, a, b) => `(${a.expr} * ${b.expr})`,
      )
      .add(
        ["point64", "r64"],
        "point64",
        (a, b) => pt(mul(a.value.x, b.value), mul(a.value.y, b.value)),
        (ctx, ar, br) => {
          declareMulR64(ctx)
          const a = ctx.cache(ar)
          const b = ctx.cache(br)
          return `vec4(_helper_mul_r64(${a}.xy, ${b}), _helper_mul_r64(${a}.zw, ${b}))`
        },
      )
      .add(
        ["r64", "point64"],
        "point64",
        (b, a) => pt(mul(a.value.x, b.value), mul(a.value.y, b.value)),
        (ctx, br, ar) => {
          declareMulR64(ctx)
          const a = ctx.cache(ar)
          const b = ctx.cache(br)
          return `vec4(_helper_mul_r64(${a}.xy, ${b}), _helper_mul_r64(${a}.zw, ${b}))`
        },
      )

    OP_DIV.add(
      ["point32", "r32"],
      "point32",
      (a, b) => pt(div(a.value.x, b.value), div(a.value.y, b.value)),
      (_, a, b) => `(${a.expr} / ${b.expr})`,
    )
  },
  ty: {
    info: {
      point64: {
        name: "point",
        namePlural: "points",
        glsl: "vec4",
        garbage: { js: SNANPT, glsl: "vec4(0.0/0.0)" },
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
        preview(cv, val) {
          cv.point(unpt(val), Size.Point, Colors.Purple)
        },
      },
      point32: {
        name: "point",
        namePlural: "points",
        glsl: "vec2",
        garbage: { js: SNANPT, glsl: "vec2(0.0/0.0)" },
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
        preview(cv, val) {
          cv.point(unpt(val), Size.Point, Colors.Purple)
        },
      },
    },
  },
  eval: {
    fn: {
      screendistance: FN_SCREENDISTANCE,
      debugpoint: FN_DEBUGPOINT,
      ".x": OP_X,
      ".y": OP_Y,
    },
  },
  sheet: {
    exts: {
      1: [EXT_POINT],
    },
    toolbar: {
      1: [toolbar(() => iconPoint(false), PICK_POINT, "p")],
    },
    keys: {
      p: (sheet: Sheet) => sheet.pick.set(PICK_TY, PICK_POINT),
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
