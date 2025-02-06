import type { Fn } from ".."
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../vars"

export const FN_FORCESHADER: Fn = {
  js() {
    throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
  },
  glsl(_, ...args) {
    if (args.length != 1) {
      throw new Error("'forceshader' should be passed a single argument.")
    }
    return args[0]!
  },
}
