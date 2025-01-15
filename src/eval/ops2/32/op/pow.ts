import { FnDist } from "../../../fn/dist"

export const OP_RAISE = new FnDist("^").add(
  ["c32", "c32"],
  "c32",
  () => {
    throw new Error("pow not yet")
  },
  () => {
    throw new Error("pow not yet")
  },
)
