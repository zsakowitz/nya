import { FnDist } from "../dist"

export const OP_X = new FnDist(".x")
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
