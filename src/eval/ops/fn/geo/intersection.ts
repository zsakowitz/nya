import type { GlslContext } from "../../../lib/fn"
import type { GlslVal, Ty, Tys, Val } from "../../../ty"
import { pt } from "../../../ty/create"
import { FnDist, type FnDistOverload } from "../../dist"
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

export const FN_INTERSECTION = new (class extends FnDist {
  signature(args: Ty[]): FnDistOverload<keyof Tys> {
    if (
      args.length == 2 &&
      (args[0]!.type == "line32" ||
        args[0]!.type == "segment32" ||
        args[0]!.type == "vector32" ||
        args[0]!.type == "ray32") &&
      (args[1]!.type == "line32" ||
        args[1]!.type == "segment32" ||
        args[1]!.type == "vector32" ||
        args[1]!.type == "ray32")
    ) {
      return {
        params: [args[0]!.type, args[1]!.type],
        type: "point32",
        js(a, b) {
          return js(a.value as any, b.value as any)
        },
        glsl(ctx, a, b) {
          return glsl(ctx, a, b)
        },
      }
    }
    return super.signature(args)
  }
})("intersection", "calculates the intersection between two lines")
// TODO: update to "two shapes" once circles work
