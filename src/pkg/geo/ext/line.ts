import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/point"
import type { DrawLineProps } from "../../../sheet/ui/paper"
import { segmentByOffset, type Paper } from "../../../sheet/ui/paper"
import { pick } from "./util"

function getLineBounds(
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
  paper: Paper,
): [Point, Point] {
  const { xmin, w, ymin, h } = paper.bounds()

  if (x1 == x2) {
    return [
      paper.toOffset({ x: x1, y: ymin }),
      paper.toOffset({ x: x1, y: ymin + h }),
    ]
  }

  const m = (y2 - y1) / (x2 - x1)

  return [
    paper.toOffset({ x: xmin, y: m * (xmin - x1) + y1 }),
    paper.toOffset({ x: xmin + w, y: m * (xmin + w - x1) + y1 }),
  ]
}

export function drawLine(
  paper: Paper,
  p1: Point,
  p2: Point,
  props: DrawLineProps,
) {
  const [o1, o2] = getLineBounds(p1, p2, paper)
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  segmentByOffset(paper, o1, o2, props)
}

export const EXT_LINE = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "line") {
      return { value: value as JsValue<"line">, expr }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      drawLine(paper, unpt(val[0]), unpt(val[1]), {
        pick: pick(val, data, data.expr.field.ctx),
        kind: "line",
      })
    }
  },
})
