import { num } from "../../ty/create"
import { FnDist } from "../dist"

export const OP_TO_STR = new FnDist<"str">(
  "to string",
  "converts a value into a string",
)
  .add(["r32"], "str", (a) => num(a.value).toString(), glsl)
  .add(["str"], "str", (a) => a.value, glsl)

function glsl(): never {
  throw new Error("Arbitrary text is not supported in shaders.")
}
