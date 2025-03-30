import type { Fn } from "@/eval/ops"
import { ALL_DOCS, type WithDocs } from "@/eval/ops/docs"
import type { JsVal } from "@/eval/ty"

export const FN_SEGMENTS: Fn & WithDocs = {
  name: "segments",
  label: "gets the segments which make up a polygon",
  docs() {
    return [
      {
        params: [{ type: "polygon", list: false }],
        dots: false,
        ret: { type: "segment", list: true },
        usage: String.raw`segments(polygon\begin{list}(2,3)\\(9,-10)\\(5,7)\end{list})=\begin{list}segment((2,3),(9,-10))\\segment((9,-10),(5,7))\\segment((5,7),(2,3))\end{list}`,
      },
    ]
  },
  js(args) {
    if (
      !(
        args.length == 1 &&
        args[0]!.type == "polygon" &&
        args[0]!.list === false
      )
    ) {
      throw new Error("'segments' expects a single polygon.")
    }
    const pts = (args[0]! as JsVal<"polygon">).value
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
