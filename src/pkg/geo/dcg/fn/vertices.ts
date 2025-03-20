import type { Fn } from "../../../../eval/ops"
import { doc } from "../../../../eval/ops/dist"
import { ALL_DOCS, type WithDocs } from "../../../../eval/ops/docs"
import type { SPoint } from "../../../../eval/ty"

export const FN_VERTICES: Fn & WithDocs = {
  name: "vertices",
  label: "gets the vertices which make up a polygon",
  docs() {
    return [doc(["polygon"], "segment", true)]
  },
  js(args) {
    if (args.length != 1) {
      throw new Error("'vertices' expects a single polygon.")
    }
    const arg = args[0]!
    if (arg.list !== false) {
      throw new Error("'vertices' expects a single polygon.")
    }
    return {
      type: "point64",
      list: (arg.value as SPoint[]).length,
      value: arg.value as SPoint[],
    }
  },
  glsl() {
    throw new Error("Polygons are not supported in shaders.")
  },
}

ALL_DOCS.push(FN_VERTICES)
