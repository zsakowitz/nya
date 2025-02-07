import { pt } from "../../../ty/create"
import { FnDist } from "../../dist"
import { neg } from "../../op/neg"

export const FN_CONJ = new FnDist(
  "conj",
  "takes the conjugate of a complex number or quaternion",
)
  .add(
    ["c64"],
    "c64",
    (a) => pt(a.value.x, neg(a.value.y)),
    (_, a) => `(${a} * vec4(1, 1, -1, -1))`,
  )
  .add(
    ["c32"],
    "c32",
    (a) => pt(a.value.x, neg(a.value.y)),
    (_, a) => `(${a} * vec2(1, -1))`,
  )
  .add(
    ["q32"],
    "q32",
    (a) => [a.value[0], neg(a.value[1]), neg(a.value[2]), neg(a.value[3])],
    (_, a) => `(${a} * vec4(1, -1, -1, -1))`,
  )
