import { FnDist } from "../../fn/dist"

export const FN_IMAG = new FnDist("imag")
  .add(
    ["c64"],
    "r64",
    (a) => a.value.y,
    (_, a) => `${a.expr}.zw`,
  )
  .add(
    ["c32"],
    "r32",
    (a) => a.value.y,
    (_, a) => `${a.expr}.y`,
  )
