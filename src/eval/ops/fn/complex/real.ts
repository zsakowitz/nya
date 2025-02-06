import { FnDist } from "../../dist"

export const FN_REAL = new FnDist(
  "real",
  "gets the real part of a complex number",
)
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
