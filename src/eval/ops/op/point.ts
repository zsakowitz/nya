import { FnDist } from "../../fn/dist"
import { pt } from "../../ty/create"

export const OP_POINT = new FnDist("point")
  .add(
    ["r64", "r64"],
    "point64",
    (x, y) => pt(x.value, y.value),
    (_, x, y) => `vec4(${x.expr}, ${y.expr})`,
  )
  .add(
    ["r32", "r32"],
    "point32",
    (x, y) => pt(x.value, y.value),
    (_, x, y) => `vec2(${x.expr}, ${y.expr})`,
  )
