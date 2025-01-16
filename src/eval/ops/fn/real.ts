import { FnDist } from "../../fn/dist"

export const FN_REAL = new FnDist("real")
  .add(
    ["c64"],
    "r64",
    (a) => a.value.x,
    (_, a) => `${a.expr}.xy`,
  )
  .add(
    ["c32"],
    "r32",
    (a) => a.value.x,
    (_, a) => `${a.expr}.x`,
  )
