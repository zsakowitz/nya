import { FnDist } from "../dist"

// prettier-ignore
export const OP_POS = new FnDist("+")
  .add(["r64"], "r64", (a) => a.value, (_, a) => a.expr)
  .add(["r32"], "r32", (a) => a.value, (_, a) => a.expr)
  .add(["c32"], "c32", (a) => a.value, (_, a) => a.expr)
  .add(["c64"], "c64", (a) => a.value, (_, a) => a.expr)
