import { Block, R } from "../../../field/model"
import { frac, num } from "../../ty/create"
import { Display } from "../../ty/display"
import { FnDist } from "../dist"

export const OP_TO_STR = new FnDist<"str">(
  "to string",
  "converts a value into a string",
)
  .add(
    ["r32"],
    "str",
    (a) => {
      const b = new Block(null)
      new Display(b.cursor(R), frac(10, 1)).value(num(a.value))
      return [{ type: "latex", value: b.latex() }]
    },
    glsl,
  )
  .add(
    ["c32"],
    "str",
    (a) => {
      const b = new Block(null)
      new Display(b.cursor(R), frac(10, 1)).nums([
        [a.value.x, ""],
        [a.value.y, "i"],
      ])
      return [{ type: "latex", value: b.latex() }]
    },
    glsl,
  )
  .add(["str"], "str", (a) => a.value, glsl)

function glsl(): never {
  throw new Error("Arbitrary text is not supported in shaders.")
}
