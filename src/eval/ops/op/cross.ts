import { FnDist } from "../../fn/dist"
import { mul, mulR64 } from "./mul"

export const OP_CROSS = new FnDist("cross multiply")
  .add(
    ["r64", "r64"],
    "r64",
    (a, b) => mul(a.value, b.value),
    (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
  )
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => mul(a.value, b.value),
    (_, a, b) => `(${a.expr} * ${b.expr})`,
  )
