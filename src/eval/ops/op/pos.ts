import { FnDist } from "../dist"

// prettier-ignore
export const OP_POS = new FnDist("+", "unary plus; ensures the expression is number-like")
  .add(["r64"], "r64", (a) => a.value, (_, a) => a.expr)
  .add(["r32"], "r32", (a) => a.value, (_, a) => a.expr)
  .add(["point64"], "point64", (a) => a.value, (_, a) => a.expr)
  .add(["point32"], "point32", (a) => a.value, (_, a) => a.expr)
