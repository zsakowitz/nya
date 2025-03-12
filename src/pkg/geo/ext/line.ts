import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/point"
import type { Cv } from "../../../sheet/ui/cv"
import { Colors, Order, Size } from "../../../sheet/ui/cv/consts"
import type { DrawLineProps } from "../../../sheet/ui/paper"
import { segmentByOffset, type Paper } from "../../../sheet/ui/paper"

// FIXME: make signature match ext/ray
export function getLineBounds(
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
  cv: Paper | Cv,
): [Point, Point] {
  const { xmin, w, ymin, h } = cv.bounds()

  if (x1 == x2) {
    return [
      cv.toOffset({ x: x1, y: ymin }),
      cv.toOffset({ x: x1, y: ymin + h }),
    ]
  }

  const m = (y2 - y1) / (x2 - x1)

  return [
    cv.toOffset({ x: xmin, y: m * (xmin - x1) + y1 }),
    cv.toOffset({ x: xmin + w, y: m * (xmin + w - x1) + y1 }),
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
  plot: {
    order: Order.Graph,
    draw(data) {
      for (const val of each(data.value)) {
        data.expr.sheet.cv.polygonByCanvas(
          getLineBounds(unpt(val[0]), unpt(val[1]), data.expr.sheet.cv),
          Size.Line,
          Colors.Blue,
        )
      }
    },
  },
})
