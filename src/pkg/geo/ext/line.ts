import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/point"
import type { Cv } from "../../../sheet/ui/cv"
import { Colors, Order, Size } from "../../../sheet/ui/cv/consts"
import type { Paper } from "../../../sheet/ui/paper"

export function getLineBounds(
  cv: Paper | Cv,
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
): [Point, Point] {
  const { xmin, w, ymin, h } = cv.bounds()

  if (x1 == x2) {
    return [
      cv.toCanvas({ x: x1, y: ymin }),
      cv.toCanvas({ x: x1, y: ymin + h }),
    ]
  }

  const m = (y2 - y1) / (x2 - x1)

  return [
    cv.toCanvas({ x: xmin, y: m * (xmin - x1) + y1 }),
    cv.toCanvas({ x: xmin + w, y: m * (xmin + w - x1) + y1 }),
  ]
}

export const EXT_LINE = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "line") {
      return { value: value as JsValue<"line">, expr }
    }
  },
  plot: {
    order() {
      return Order.Graph
    },
    items(data) {
      return each(data.value)
    },
    draw(data, val) {
      data.expr.sheet.cv.polygonByCanvas(
        getLineBounds(data.expr.sheet.cv, unpt(val[0]), unpt(val[1])),
        Size.Line,
        Colors.Blue,
      )
    },
  },
})
