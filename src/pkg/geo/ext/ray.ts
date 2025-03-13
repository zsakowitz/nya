import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/point"
import type { Cv } from "../../../sheet/ui/cv"
import { Colors, Order, Size } from "../../../sheet/ui/cv/consts"
import type { Paper } from "../../../sheet/ui/paper"

export function getRayBounds(
  cv: Paper | Cv,
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
): [Point, Point] | null {
  if (x1 == y1 && x2 == y2) {
    return null
  }

  const { xmin, w, ymin, h } = cv.bounds()

  if (x1 == x2) {
    if (y1 < y2) {
      if (y1 > ymin + h) {
        return null
      }
      return [
        cv.toCanvas({ x: x1, y: y1 }),
        cv.toCanvas({ x: x1, y: ymin + h }),
      ]
    }

    if (y1 < ymin) {
      return null
    }
    return [cv.toCanvas({ x: x1, y: y1 }), cv.toCanvas({ x: x1, y: ymin })]
  }

  const m = (y2 - y1) / (x2 - x1)

  if (x1 < x2) {
    if (x1 > xmin + w) {
      return null
    }

    return [
      cv.toCanvas({ x: x1, y: y1 }),
      cv.toCanvas({ x: xmin + w, y: m * (xmin + w - x1) + y1 }),
    ]
  }

  if (x1 < xmin) {
    return null
  }

  return [
    cv.toCanvas({ x: x1, y: y1 }),
    cv.toCanvas({ x: xmin, y: m * (xmin - x1) + y1 }),
  ]
}

export const EXT_RAY = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "ray") {
      return { value: value as JsValue<"ray">, expr }
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
      const bounds = getRayBounds(
        data.expr.sheet.cv,
        unpt(val[0]),
        unpt(val[1]),
      )

      if (bounds) {
        data.expr.sheet.cv.polygonByCanvas(bounds, Size.Line, Colors.Blue)
      }
    },
  },
})
