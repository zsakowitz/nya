import { FnDist } from "../../dist"

export const FN_POINT = new FnDist(
  "point",
  "converts a complex number into a point",
)
  .add(
    ["c64"],
    "point64",
    (a) => a.value,
    (_, a) => a.expr,
  )
  .add(
    ["c32"],
    "point32",
    (a) => a.value,
    (_, a) => a.expr,
  )
  .add(
    ["point64"],
    "point64",
    (a) => a.value,
    (_, a) => a.expr,
  )
  .add(
    ["point32"],
    "point32",
    (a) => a.value,
    (_, a) => a.expr,
  )
