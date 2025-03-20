import { FnDist } from "../../../../eval/ops/dist"
import { pt, real } from "../../../../eval/ty/create"
import { sub } from "../../../../eval/ty/ops"
import { arcLength, computeArcVal } from "../arc"
import { hypot } from "./distance"

export const FN_LENGTH = new FnDist(
  "length",
  "calculates the length of an object",
)
  .add(
    ["segment"],
    "r32",
    (a) =>
      hypot(
        pt(sub(a.value[0].x, a.value[1].x), sub(a.value[0].y, a.value[1].y)),
      ),
    (ctx, a) => {
      ctx.glsl`float _helper_length_segment(vec4 a) {
  return length(a.xy - a.zw);
}
`
      return `_helper_length_segment(${a.expr})`
    },
  )
  .add(
    ["vector"],
    "r32",
    (a) =>
      hypot(
        pt(sub(a.value[0].x, a.value[1].x), sub(a.value[0].y, a.value[1].y)),
      ),
    (ctx, a) => {
      ctx.glsl`float _helper_length_vector(vec4 a) {
  return length(a.xy - a.zw);
}
`
      return `_helper_length_vector(${a.expr})`
    },
  )
  .add(
    ["arc"],
    "r32",
    (a) => real(arcLength(computeArcVal(a.value))),
    () => {
      throw new Error("Cannot compute arc length in shaders yet.")
    },
  )
