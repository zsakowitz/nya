import { FnDist } from "../dist"
import { approx, num } from "../../ty/create"

export const OP_MOD = new FnDist(
  "mod",
  "gets the remainder when dividing one value by another",
).add(
  ["r32", "r32"],
  "r32",
  (ar, br) => {
    const a = num(ar.value)
    const b = num(br.value)
    return approx(((a % b) + b) % b)
  },
  (ctx, a, b) => {
    ctx.glsl`float _helper_mod_r32(float a, float b) {
  return mod(mod(a, b) + b, b);
}
`
    return `_helper_mod_r32(${a.expr}, ${b.expr})`
  },
)
