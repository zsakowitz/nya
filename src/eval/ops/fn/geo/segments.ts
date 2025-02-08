import type { Fn } from "../.."
import type { SPoint } from "../../../ty"
import { doc } from "../../dist"
import { ALL_DOCS, type WithDocs } from "../../docs"

export const FN_SEGMENTS: Fn & WithDocs = {
  name: "segments",
  label: "gets the segments which make up a polygon",
  docs() {
    return [doc(["polygon"], "segment", true)]
  },
  js(...args) {
    if (args.length != 1) {
      throw new Error("'segments' needs a single polygon.")
    }
    const arg = args[0]!
    if (arg.list !== false) {
      throw new Error("'segments' needs a single polygon.")
    }
    const pts = arg.value as SPoint[]
    return {
      type: "segment",
      list: pts.length < 2 ? 0 : pts.length,
      value:
        pts.length < 2 ?
          []
        : pts.map((pt, i) => [pt, pts[(i + 1) % pts.length]!]),
    }
  },
  glsl() {
    throw new Error("Polygons are not supported in shaders.")
  },
}

ALL_DOCS.push(FN_SEGMENTS)
