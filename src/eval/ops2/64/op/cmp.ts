import type { PuncCmp } from "../../../ast/token"
import { FnDist } from "../../../fn/dist"
import { num } from "../../../ty/create"
import { FN_CMP } from "../fn/cmp"

export const OP_LT = new FnDist("<")
  .add(
    ["r64", "r64"],
    "bool",
    (a, b) => num(a.value) < num(b.value),
    (ctx, a, b) => `(${FN_CMP.glsl1(ctx, a, b).expr} == -1.0)`,
  )
  .add(
    ["r32", "r32"],
    "bool",
    (a, b) => num(a.value) < num(b.value),
    (_, a, b) => `(${a.expr} < ${b.expr})`,
  )

export function pickCmp(op: PuncCmp) {
  switch (op.dir) {
    case "<":
      if (!op.neg && !op.eq) {
        return OP_LT
      }
  }
  throw new Error("That comparison operator is not supported yet.")
}
