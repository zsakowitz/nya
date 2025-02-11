import { FnDistVar } from "../../../eval/ops/dist"

function glsl(): never {
  throw new Error("Cannot construct polygons in shaders.")
}

// TODO: use anything besides recursion
export const FN_POLYGON = new FnDistVar(
  "polygon",
  "constructs a polygon from a set of points",
)
  .add(["point32"], "polygon", (a) => [a.value], glsl)
  .add(["point32", "point32"], "polygon", (a, b) => [a.value, b.value], glsl)
  .add(["polygon", "point32"], "polygon", (a, b) => [...a.value, b.value], glsl)
