import type { GlslContext } from "../../../lib/fn"
import type { GlslVal, Val } from "../../../ty"
import { pt } from "../../../ty/create"
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
  "calculates the intersection between two lines",
)

for (const a of ["line32", "ray32", "segment32", "vector32"] as const) {
  for (const b of ["line32", "ray32", "segment32", "vector32"] as const) {
    FN_INTERSECTION.add([a, b], "point32", (a, b) => js(a.value, b.value), glsl)
  }
}
