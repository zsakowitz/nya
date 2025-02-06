import { FnDist } from "../dist"

export const OP_X = new FnDist(
  ".x",
  "accesses the x-coordinate of a point or complex number",
)
  .add(
    ["point64"],
    "r64",
    (a) => a.value.x,
    (_, a) => `${a.expr}.xy`,
  )
  .add(
    ["point32"],
    "r32",
    (a) => a.value.x,
    (_, a) => `${a.expr}.x`,
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
