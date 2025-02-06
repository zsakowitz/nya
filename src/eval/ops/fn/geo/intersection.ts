import type { GlslContext } from "../../../lib/fn"
import type { GlslVal, Tys, Val } from "../../../ty"
import { num, pt, real } from "../../../ty/create"
import { FnDist } from "../../dist"
import { div } from "../../op/div"
import { mul } from "../../op/mul"
import { sub } from "../../op/sub"

function js(
  [{ x: x1, y: y1 }, { x: x2, y: y2 }]: Val<"line32">,
  [{ x: x3, y: y3 }, { x: x4, y: y4 }]: Val<"line32">,
) {
  return pt(
    div(
      // (x1 y2 - y1 x2) (x3 - x4) - (x1 - x2) (x3 y4 - y3 x4)
      sub(
        // (x1 y2 - y1 x2) (x3 - x4)
        mul(sub(mul(x1, y2), mul(y1, x2)), sub(x3, x4)),
        // (x1 - x2) (x3 y4 - y3 x4)
        mul(sub(x1, x2), sub(mul(x3, y4), mul(y3, x4))),
      ),
      // (x1 - x2) (y3 - y4) - (y1 - y2) (x3 - x4)
      sub(mul(sub(x1, x2), sub(y3, y4)), mul(sub(y1, y2), sub(x3, x4))),
    ),

    div(
      // (x1 y2 - y1 x2) (y3 - y4) - (x1 - x2) (x3 y4 - y3 x4)
      sub(
        // (x1 y2 - y1 x2) (y3 - y4)
        mul(sub(mul(x1, y2), mul(y1, x2)), sub(y3, y4)),
        // (y1 - y2) (x3 y4 - y3 x4)
        mul(sub(y1, y2), sub(mul(x3, y4), mul(y3, x4))),
      ),
      // (x1 - x2) (y3 - y4) - (y1 - y2) (x3 - x4)
      sub(mul(sub(x1, x2), sub(y3, y4)), mul(sub(y1, y2), sub(x3, x4))),
    ),
  )
}

function glsl(ctx: GlslContext, ar: GlslVal, br: GlslVal): string {
  const a = ctx.cache(ar)
  const b = ctx.cache(br)

  const x1 = `${a}.x`
  const y1 = `${a}.y`
  const x2 = `${a}.z`
  const y2 = `${a}.w`
  const x3 = `${b}.x`
  const y3 = `${b}.y`
  const x4 = `${b}.z`
  const y4 = `${b}.w`

  return `vec2(
  (${x1} * ${y2} - ${y1} * ${x2}) * (${x3} - ${x4}) - (${x1} - ${x2}) * (${x3} * ${y4} - ${y3} - ${x4}),
  (${x1} * ${y2} - ${y1} * ${x2}) * (${y3} - ${y4}) - (${y1} - ${y2}) * (${x3} * ${y4} - ${y3} - ${x4})
) / ((${x1} - ${x2}) * (${y3} - ${y4}) - (${y1} - ${y2}) * (${x3} - ${x4}))`
}

export const FN_INTERSECTION = new FnDist(
  "intersection",
  "constructs the point where two objects intersect",
)

for (const a of ["line32", "ray32", "segment32", "vector32"] as const) {
  for (const b of ["line32", "ray32", "segment32", "vector32"] as const) {
    FN_INTERSECTION.add([a, b], "point32", (a, b) => js(a.value, b.value), glsl)
  }
}

function intersectJs(circ: Tys["circle32"], lin: Tys["line32"], index: -1 | 1) {
  // https://stackoverflow.com/a/37225895
  const cx = num(circ.center.x)
  const cy = num(circ.center.y)
  const r = num(circ.radius)
  const x1 = num(lin[0].x)
  const y1 = num(lin[0].y)
  const x2 = num(lin[1].x)
  const y2 = num(lin[1].y)
  const v1 = { x: x2 - x1, y: y2 - y1 }
  const v2 = { x: x1 - cx, y: y1 - cy }
  const b = -2 * (v1.x * v2.x + v1.y * v2.y)
  const c = 2 * (v1.x * v1.x + v1.y * v1.y)
  const d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - r * r))
  if (isNaN(d)) {
    return pt(real(NaN), real(NaN))
  }
  const u1 = (b + index * d) / c
  const returned = { x: x1 + v1.x * u1, y: y1 + v1.y * u1 }
  return pt(real(returned.x), real(returned.y))
}

function intersectGlsl(
  ctx: GlslContext,
  circ: string,
  lin: string,
  index: -1 | 1,
) {
  // https://stackoverflow.com/a/37225895
  const cx = `${circ}.x`
  const cy = `${circ}.y`
  const r = `${circ}.z`
  const x1 = `${lin}.x`
  const y1 = `${lin}.y`
  const x2 = `${lin}.z`
  const y2 = `${lin}.w`
  const v1 = ctx.cached("point32", `vec2(${x2}-${x1},${y2}-${y1})`)
  const v2 = ctx.cached("point32", `vec2(${x1}-${cx}, ${y1}-${cy})`)
  const b = ctx.cached("r32", `(-2. * (${v1}.x * ${v2}.x + ${v1}.y * ${v2}.y))`)
  const c = ctx.cached("r32", `(2. * (${v1}.x * ${v1}.x + ${v2}.y * ${v2}.y))`)
  const d = ctx.cached(
    "r32",
    `sqrt(${b}*${b} - 2.0*${c}*(${v2}.x*${v2}.x+${v2}.y*${v2}.y-${r}*${r}))`,
  )
  return `(vec2(${x1},${y1}) + ${v1} * ((${b}${index == -1 ? "-" : "+"}${d})/${c}))`
}

for (const b of ["line32", "ray32", "segment32", "vector32"] as const) {
  FN_INTERSECTION.add(
    ["circle32", b],
    "point32",
    (a, b) => intersectJs(a.value, b.value, 1),
    (ctx, a, b) => intersectGlsl(ctx, ctx.cache(a), ctx.cache(b), 1),
  )
  FN_INTERSECTION.add(
    [b, "circle32"],
    "point32",
    (a, b) => intersectJs(b.value, a.value, -1),
    (ctx, a, b) => intersectGlsl(ctx, ctx.cache(b), ctx.cache(a), -1),
  )
}
