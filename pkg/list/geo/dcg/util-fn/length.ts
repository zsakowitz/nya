import { FnDist } from "@/eval/ops/dist"
import { int } from "@/lib/sreal"
import { arcLength, computeArcVal } from "../util-arc"

export const FN_LENGTH = new FnDist(
  "length",
  "calculates the length of an object",
)
  .add(
    ["segment"],
    "r32",
    (a) => a.value[0].sub(a.value[1]).hypot(),
    (ctx, a) => {
      ctx.glsl`float _helper_length_segment(vec4 a) {
  return length(a.xy - a.zw);
}
`
      return `_helper_length_segment(${a.expr})`
    },
    "length(segment((1,4),(-2,8)))=5",
  )
  .add(
    ["vector"],
    "r32",
    (a) => a.value[0].sub(a.value[1]).hypot(),
    (ctx, a) => {
      ctx.glsl`float _helper_length_vector(vec4 a) {
  return length(a.xy - a.zw);
}
`
      return `_helper_length_vector(${a.expr})`
    },
    "length(vector((1,4),(-2,8)))=5",
  )
  .add(
    ["arc"],
    "r32",
    (a) => int(arcLength(computeArcVal(a.value))),
    () => {
      throw new Error("Cannot compute arc length in shaders yet.")
    },
    String.raw`length(\operatorname{arc}\left(\left(-6,4\right),\left(3,2\right),\left(0,5\right)\right))≈29.1730`,
  )
