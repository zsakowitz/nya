import type { Package } from "."
import { FnDist } from "../eval/ops/dist"
import { FN_DEBUGPOINT } from "../eval/ops/fn/debugpoint"
import { FN_UNSIGN } from "../eval/ops/fn/unsign"
import { FN_VALID } from "../eval/ops/fn/valid"
import { abs, abs64, OP_ABS } from "../eval/ops/op/abs"
import { add, addR64, OP_ADD } from "../eval/ops/op/add"
import { declareMulR64, mul } from "../eval/ops/op/mul"
import { neg, OP_NEG } from "../eval/ops/op/neg"
import { declareOdotC64, OP_ODOT } from "../eval/ops/op/odot"
import { OP_PLOT, plotJs } from "../eval/ops/op/plot"
import { OP_POINT } from "../eval/ops/op/point"
import { OP_POS } from "../eval/ops/op/pos"
import { OP_X } from "../eval/ops/op/x"
import { OP_Y } from "../eval/ops/op/y"
import { approx, num, pt, real } from "../eval/ty/create"
import { highRes, WRITE_POINT } from "../eval/ty/info"
import { h } from "../jsx"

declare module "../eval/ty/index.js" {
  interface Tys {
    point32: SPoint
    point64: SPoint
  }

  interface TyComponents {
    point32: "r32"
    point64: "r64"
  }
}

const FN_SCREENDISTANCE = new FnDist<"r32">(
  "screendistance",
  "calculates the distance between two points in terms of pixels on your screen, rather than graphpaper units",
).add(
  ["point32", "point32"],
  "r32",
  () => {
    throw new Error("Cannot calculate screendistance outside of shaders.")
  },
  (_, a, b) => {
    return `length((${a.expr} - ${b.expr}) * u_px_per_unit.xz)`
  },
)

export const PKG_GEO_POINT: Package = {
  id: "nya:geo-point",
  name: "geometric points",
  label: "adds geometric points",
  ty: {
    info: {
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
    },
  },
  eval: {
    fns: {
      screendistance: FN_SCREENDISTANCE,
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
