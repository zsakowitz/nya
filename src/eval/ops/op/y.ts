import { FnDist } from "../dist"

export const OP_Y = new FnDist(
  ".y",
  "accesses the y-coordinate of a point or complex number",
)
  .add(
    ["point64"],
    "r64",
    (a) => a.value.y,
    (_, a) => `${a.expr}.zw`,
  )
  .add(
    ["point32"],
    "r32",
    (a) => a.value.y,
    (_, a) => `${a.expr}.y`,
  )
