import { OP_CDOT } from "./mul"
import { OP_TO_STR } from "./tostr"

export const OP_JUXTAPOSE = OP_CDOT.withName(
  "juxtapose",
  "multiplies two values which aren't separated by an operator",
).add(
  ["str", "str"],
  "str",
  (a, b) => [...a.value, ...b.value],
  () => {
    throw new Error("Text cannot be created in shaders.")
  },
)

for (const o of OP_TO_STR.o) {
  if (o.params.length != 1) continue
  if (o.params[0] == "str") continue
  OP_JUXTAPOSE.add(
    ["str", o.params[0]!],
    "str",
    (a, b) => {
      const next = o.js(b)
      return [...a.value, ...next]
    },
    () => {
      throw new Error("Text cannot be created in shaders.")
    },
  )
}

for (const o of OP_TO_STR.o) {
  if (o.params.length != 1) continue
  if (o.params[0] == "str") continue
  OP_JUXTAPOSE.add(
    [o.params[0]!, "str"],
    "str",
    (a, b) => {
      const next = o.js(a)
      return [...next, ...b.value]
    },
    () => {
      throw new Error("Text cannot be created in shaders.")
    },
  )
}
