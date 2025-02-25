import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { sx } from "../../../jsx"
import { defineHideable } from "../../../sheet/ext/hideable"
import { normSegment, type Paper, type Point } from "../../../sheet/ui/paper"

const LINE = 32
const ARC = 20

export function drawAngle(
  paper: Paper,
  p1: Point,
  p2: Point,
  p3: Point,
  props: { draft?: boolean; type: "angle" | "directedangle" },
) {
  const angle =
    (Math.atan2(p1.x - p2.x, p1.y - p2.y) -
      Math.atan2(p3.x - p2.x, p3.y - p2.y) +
      4 * Math.PI) %
    (2 * Math.PI)
  if (angle > Math.PI) {
    ;[p1, p3] = [p3, p1]
  }

  const o1 = paper.toOffset(p1)
  const o2 = paper.toOffset(p2)
  const o3 = paper.toOffset(p3)
  const s1 = normSegment(o2, o1, LINE)
  const s3 = normSegment(o2, o3, LINE)
  const a1 = normSegment(o2, o1, ARC)
  const a3 = normSegment(o2, o3, ARC)

  for (const s of [s1, s3]) {
    paper.append(
      "angleline",
      sx("line", {
        x1: o2.x,
        y1: o2.y,
        x2: s.x,
        y2: s.y,
        "stroke-width": 1.5,
        stroke: "#ccc",
        "stroke-linecap": "round",
        class:
          props?.draft ? "" : (
            "picking-any:opacity-30 picking-angle:opacity-100"
          ),
      }),
    )
  }

  paper.append(
    "anglearc",
    sx("path", {
      d: `M ${a1.x} ${a1.y} A ${ARC} ${ARC} 0 0 0 ${a3.x} ${a3.y}`,
      "stroke-width": 3,
      stroke: "black",
      "stroke-linecap": "round",
      class:
        props?.draft ? "" : "picking-any:opacity-30 picking-angle:opacity-100",
    }),
  )

  paper.append(
    "anglearc",
    sx("path", {
      d: `M ${a1.x} ${a1.y} A ${ARC} ${ARC} 0 0 0 ${a3.x} ${a3.y} L ${o2.x} ${o2.y} Z`,
      fill: "black",
      "fill-opacity": 0.3,
      class:
        props?.draft ? "" : "picking-any:opacity-30 picking-angle:opacity-100",
    }),
  )
}

export const EXT_ANGLE = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && (value.type == "angle" || value.type == "directedangle")) {
      return {
        value: value as JsValue<"angle" | "directedangle">,
        expr,
      }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      drawAngle(paper, unpt(val[0]), unpt(val[1]), unpt(val[2]), {
        type: data.value.type,
      })
    }
  },
})
