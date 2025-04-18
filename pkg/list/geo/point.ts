import type { Package } from "#/types"
import { FN_VALID } from "$/bool"
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
  OP_SUB,
  subR64,
} from "$/core/ops"
import { EXT_EVAL } from "$/eval"
import { FN_UNSIGN } from "$/num/real"
import { dragPoint, type DragResultPoint } from "@/eval/ast/tx"
import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "@/eval/ops/vars"
import { each, type JsValue, type SPoint } from "@/eval/ty"
import { approx, frac, gl, num, pt, real, SNANPT, unpt } from "@/eval/ty/create"
import { gl64 } from "@/eval/ty/create-r64"
import type { TyWrite } from "@/eval/ty/display"
import { highRes, TY_INFO, type TyGlide } from "@/eval/ty/info"
import { abs, add, div, mul, neg, sub } from "@/eval/ty/ops"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdVar } from "@/field/cmd/leaf/var"
import { CmdBrack } from "@/field/cmd/math/brack"
import { L, R } from "@/field/dir"
import { Block } from "@/field/model"
import { h } from "@/jsx"
import { defineHideable } from "@/sheet/ext/hideable"
import { TransitionProp } from "@/sheet/transition"
import type { Cv } from "@/sheet/ui/cv"
import { Color, Opacity, Order, Size } from "@/sheet/ui/cv/consts"
import { FN_GLIDER, FN_INTERSECTION, ref, val } from "@/sheet/ui/cv/item"
import type { Expr } from "@/sheet/ui/expr"
import { virtualStepExp, write, Writer } from "@/sheet/write"

declare module "@/eval/ty" {
  interface Tys {
    point32: SPoint
    point64: SPoint
  }
}

const tx = new TransitionProp(4)

const EXT_POINT = defineHideable<
  {
    value: JsValue<"point32" | "point64" | "c32" | "c64">
    expr: Expr
    drag: DragResultPoint | null
    cv: Cv
  },
  SPoint
>({
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
        expr,
        drag,
        cv: expr.sheet.cv,
      }
    }
  },
  el(data) {
    return EXT_EVAL.el!(EXT_EVAL.data(data.expr)!)
  },
  plot: {
    order() {
      return Order.Point
    },
    items(data) {
      return each(data.value)
    },
    draw({ drag, cv, expr }, val) {
      cv.point(unpt(val), tx.get(expr), Color.Purple)
      if (drag) {
        cv.point(unpt(val), Size.PointHaloWide, Color.Purple, Opacity.PointHalo)
      }
    },
    target: {
      hits(data, at, hint) {
        return (
          hint.allows(data.data.value.type) &&
          data.data.cv.hitsPoint(unpt(data.item), at)
        )
      },
      focus(data) {
        data.expr.focus()
      },
      val,
      ref,
      toggle(item, on, reason) {
        switch (reason) {
          case "drag":
            if (on) item.data.cv.cursor("grabbing")
            break
          case "pick":
            if (on) {
              tx.set(item.data.expr, Size.PointHaloThin, true)
              item.data.cv.cursor("pointer")
            } else {
              tx.set(item.data.expr, Size.Point, true)
              item.data.cv.cursor("default")
            }
            break
          case "hover":
            if (on && item.data.drag) {
              // TODO: transitions should be per-item
              tx.set(item.data.expr, Size.PointHaloWide)
              item.data.cv.cursor("grab")
            } else if (!on) {
              tx.set(item.data.expr, Size.Point)
              item.data.cv.cursor("default")
            }
            break
        }
      },
      dragOrigin(target) {
        if (target.data.drag) {
          return target.data.cv.toOffset(unpt(target.item))
        } else {
          return null
        }
      },
      drag({ data }, at) {
        const drag = data.drag!

        switch (drag.type) {
          case "split":
            if (drag.x) {
              new Writer(drag.x.span.remove().span()).set(
                at.x,
                data.cv.xPrecision,
                drag.x.signed,
              )
              drag.x.field.sel = drag.x.field.block.cursor(R).selection()
              drag.x.field.queueAstUpdate()
            }

            if (drag.y) {
              new Writer(drag.y.span.remove().span()).set(
                at.y,
                data.cv.yPrecision,
                drag.y.signed,
              )
              drag.y.field.sel = drag.y.field.block.cursor(R).selection()
              drag.y.field.queueAstUpdate()
            }

            break
          case "complex": {
            const x = at.x
            const xp = data.cv.xPrecision
            const y = at.y
            const yp = data.cv.yPrecision
            const cursor = drag.span.remove()
            write(cursor, real(x), frac(10, 1), virtualStepExp(xp, 10), false)
            write(cursor, real(y), frac(10, 1), virtualStepExp(yp, 10), true)
            new CmdVar("i", data.expr.field.options).insertAt(cursor, L)
            drag.field.sel = drag.field.block.cursor(R).selection()
            drag.field.queueAstUpdate()
            break
          }
          case "glider": {
            const { value, precision } = (
              TY_INFO[drag.shape.type].glide! as TyGlide<any>
            )({ cv: data.cv, point: at, shape: drag.shape.value })
            new Writer(drag.value.span.remove().span()).set(value, precision)
            drag.value.field.sel = drag.value.field.block.cursor(R).selection()
            drag.value.field.queueAstUpdate()
            break
          }
        }

        return true
      },
    },
  },
})

// TODO: directly reference this so pkg/geo-point isn't a requirement
export { FN_GLIDER, FN_INTERSECTION }

const FN_SCREENDISTANCE = new FnDist<"r32">(
  "screendistance",
  "calculates the distance between two points in terms of pixels on your screen, rather than graphpaper units",
)

export const FN_DEBUGPOINT = new FnDist(
  "debugpoint",
  "given some point p, returns a color depending on which side of the currently active shader pixel that point p is on",
)

export const OP_X = new FnDist(".x", "gets the x-coordinate of a point")
export const OP_Y = new FnDist(".y", "gets the y-coordinate of a point")

export function declareDebugPoint(
  ctx: GlslContext,
  a: { type: "c32" | "point32"; expr: string },
): string {
  ctx.glsl`vec4 _helper_debugpoint_c32(vec2 z) {
  return vec4(
    sign(v_coords.x - z.x) / 2.0 + 0.5,
    sign(v_coords.z - z.y) / 2.0 + 0.5,
    1,
    .5
  );
}
`
  return `_helper_debugpoint_c32(${a.expr})`
}

export const WRITE_POINT: TyWrite<SPoint> = {
  isApprox(value) {
    return value.x.type == "approx" || value.y.type == "approx"
  },
  display(value, props) {
    const block = new Block(null)
    new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
    const inner = props.at(block.cursor(R))
    inner.num(value.x)
    new CmdComma().insertAt(inner.cursor, L)
    inner.num(value.y)
  },
}

export const FN_POINT = OP_POINT.with(
  "point",
  "constructs a point from multi-dimensional values",
)
  .add(
    ["r64"],
    "r64",
    (a) => a.value,
    (_, a) => a.expr,
    [],
  )
  .add(
    ["r32"],
    "r32",
    (a) => a.value,
    (_, a) => a.expr,
    "point(7)=7",
  )

export function iconPoint(hd: boolean) {
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

export default {
  name: "geometric points",
  label: "geometric points in 2D",
  category: "geometry",
  deps: ["num/real"],
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
      "screendistance((2,3),(4,-5))",
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
      [],
    ).add(
      ["point32", "point32"],
      "point32",
      (a, b) => pt(add(a.value.x, b.value.x), add(a.value.y, b.value.y)),
      (_, a, b) => `(${a.expr} + ${b.expr})`,
      "(2,3)+(4,-7)=(8,-4)",
    )

    OP_SUB.add(
      ["point64", "point64"],
      "point64",
      (a, b) => pt(sub(a.value.x, b.value.x), sub(a.value.y, b.value.y)),
      (ctx, ar, br) => {
        const a = ctx.cache(ar)
        const b = ctx.cache(br)
        return `vec4(${subR64(ctx, `${a}.xy`, `${b}.xy`)}, ${subR64(ctx, `${a}.zw`, `${b}.zw`)})`
      },
      [],
    ).add(
      ["point32", "point32"],
      "point32",
      (a, b) => pt(sub(a.value.x, b.value.x), sub(a.value.y, b.value.y)),
      (_, a, b) => `(${a.expr} - ${b.expr})`,
      "(2,3)-(4,-7)=(-2,10)",
    )

    FN_UNSIGN.add(
      ["point64"],
      "point64",
      (a) => pt(abs(a.value.x), abs(a.value.y)),
      (ctx, a) => {
        const name = ctx.cache(a)
        return `vec4(${abs64(ctx, `${name}.xy`)}, ${abs64(ctx, `${name}.zw`)})`
      },
      [],
    ).add(
      ["point32"],
      "point32",
      (a) => pt(abs(a.value.x), abs(a.value.y)),
      (_, a) => `abs(${a.expr})`,
      "unsign((4,-7))=(4,7)",
    )

    OP_X.add(
      ["point64"],
      "r64",
      (a) => a.value.x,
      (_, a) => `${a.expr}.xy`,
      [],
    ).add(
      ["point32"],
      "r32",
      (a) => a.value.x,
      (_, a) => `${a.expr}.x`,
      "(2,3).x=2",
    )

    OP_Y.add(
      ["point64"],
      "r64",
      (a) => a.value.y,
      (_, a) => `${a.expr}.zw`,
      [],
    ).add(
      ["point32"],
      "r32",
      (a) => a.value.y,
      (_, a) => `${a.expr}.y`,
      "(2,3).y=3",
    )

    OP_ABS.add(
      ["point32"],
      "rabs32",
      // TODO: this is exact for some values
      (a) => approx(Math.hypot(num(a.value.x), num(a.value.y))),
      (_, a) => `length(${a.expr})`,
      "|(3,-4)|=5",
    )

    OP_NEG.add(
      ["point64"],
      "point64",
      (a) => pt(neg(a.value.x), neg(a.value.y)),
      (_, a) => `(-${a.expr})`,
      [],
    ).add(
      ["point32"],
      "point32",
      (a) => pt(neg(a.value.x), neg(a.value.y)),
      (_, a) => `(-${a.expr})`,
      "-(7,-9)=(-7,9)",
    )

    FN_VALID.add(
      ["point32"],
      "bool",
      (a) => isFinite(num(a.value.x)) && isFinite(num(a.value.y)),
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `(!isnan(${a}.x) && !isinf(${a}.x) && !isnan(${a}.y) && !isinf(${a}.y))`
      },
      "valid((5,\\frac{7}{0}))=false",
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
      [],
    ).add(
      ["point32", "point32"],
      "point32",
      (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
      (_, a, b) => {
        return `(${a.expr} * ${b.expr})`
      },
      "(2,3)\\odot(5,-7)=(10,-21)",
    )

    OP_POINT.add(
      ["r64", "r64"],
      "point64",
      (x, y) => pt(x.value, y.value),
      (_, x, y) => `vec4(${x.expr}, ${y.expr})`,
      [],
    ).add(
      ["r32", "r32"],
      "point32",
      (x, y) => pt(x.value, y.value),
      (_, x, y) => `vec2(${x.expr}, ${y.expr})`,
      "(4,7)",
    )

    OP_POS.add(
      ["point64"],
      "point64",
      (a) => a.value,
      (_, a) => a.expr,
      [],
    ).add(
      ["point32"],
      "point32",
      (a) => a.value,
      (_, a) => a.expr,
      "+(4,-7)=(4,-7)",
    )

    FN_DEBUGPOINT.add(
      ["point32"],
      "color",
      () => {
        throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
      },
      (ctx, a) => declareDebugPoint(ctx, a),
      "debugpoint((9,-2))",
    )

    OP_CDOT.add(
      ["point64", "r64"],
      "point64",
      (a, b) => pt(mul(a.value.x, b.value), mul(a.value.y, b.value)),
      (ctx, ar, br) => {
        declareMulR64(ctx)
        const a = ctx.cache(ar)
        const b = ctx.cache(br)
        return `vec4(_helper_mul_r64(${a}.xy, ${b}), _helper_mul_r64(${a}.zw, ${b}))`
      },
      [],
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
        [],
      )
      .add(
        ["point32", "r32"],
        "point32",
        (a, b) => pt(mul(a.value.x, b.value), mul(a.value.y, b.value)),
        (_, a, b) => `(${a.expr} * ${b.expr})`,
        [],
      )
      .add(
        ["r32", "point32"],
        "point32",
        (b, a) => pt(mul(a.value.x, b.value), mul(a.value.y, b.value)),
        (_, a, b) => `(${a.expr} * ${b.expr})`,
        "7\\cdot(8,-3)=(56,-21)",
      )

    OP_DIV.add(
      ["point32", "r32"],
      "point32",
      (a, b) => pt(div(a.value.x, b.value), div(a.value.y, b.value)),
      (_, a, b) => `(${a.expr} / ${b.expr})`,
      "(8,-6)/2=(4,-3)",
    )
  },
  ty: {
    info: {
      point64: {
        name: "point",
        namePlural: "points",
        glsl: "vec4",
        toGlsl({ x, y }) {
          return `vec4(${gl64(x)}, ${gl64(y)})`
        },
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
        order: Order.Point,
        point: true,
        icon() {
          return iconPoint(true)
        },
        token: null,
        glide: null,
        preview(cv, val) {
          cv.point(unpt(val), Size.Point, Color.Purple)
        },
        extras: null,
      },
      point32: {
        name: "point",
        namePlural: "points",
        glsl: "vec2",
        toGlsl({ x, y }) {
          return `vec2(${gl(x)}, ${gl(y)})`
        },
        garbage: { js: SNANPT, glsl: "vec2(0.0/0.0)" },
        coerce: {},
        write: WRITE_POINT,
        order: Order.Point,
        point: true,
        icon() {
          return iconPoint(false)
        },
        token: null,
        glide: null,
        preview(cv, val) {
          cv.point(unpt(val), Size.Point, Color.Purple)
        },
        extras: null,
      },
    },
  },
  eval: {
    fn: {
      "point": FN_POINT,
      "screendistance": FN_SCREENDISTANCE,
      "debugpoint": FN_DEBUGPOINT,
      ".x": OP_X,
      ".y": OP_Y,
    },
  },
  sheet: {
    exts: {
      1: [EXT_POINT],
    },
  },
} satisfies Package
