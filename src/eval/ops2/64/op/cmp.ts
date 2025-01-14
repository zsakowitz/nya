import { FnDist } from "../../../fn/dist"
import { num } from "../../../ty/create"
import { FN_CMP } from "../fn/cmp"

export const OP_LT = new FnDist("<")
  .add(
    ["r32", "r32"],
    "bool",
    (a, b) => num(a.value) < num(b.value),
    (_, a, b) => `(${a.expr} < ${b.expr})`,
  )
  .add(
    ["r64", "r64"],
    "bool",
    (a, b) => num(a.value) < num(b.value),
    (ctx, a, b) => `(${FN_CMP.glsl1(ctx, a, b)} == -1.0)`,
  )
