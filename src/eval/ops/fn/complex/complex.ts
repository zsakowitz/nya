import { FnDist } from "../../dist"

export const FN_COMPLEX = new FnDist(
  "complex",
  "converts a point into a complex number",
)
  .add(
    ["c64"],
    "c64",
    (a) => a.value,
    (_, a) => a.expr,
  )
  .add(
    ["c32"],
    "c32",
    (a) => a.value,
    (_, a) => a.expr,
  )
  .add(
    ["point64"],
    "c64",
    (a) => a.value,
    (_, a) => a.expr,
  )
  .add(
    ["point32"],
    "c32",
    (a) => a.value,
    (_, a) => a.expr,
  )
