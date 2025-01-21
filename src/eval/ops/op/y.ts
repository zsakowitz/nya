import { FnDist } from "../../fn/dist"

export const OP_Y = new FnDist(".y")
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
