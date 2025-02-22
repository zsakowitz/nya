import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import { Point } from "../../../sheet/ui/paper"
import {
  segmentByOffset,
  type DrawProps,
  type Paper2,
} from "../../../sheet/ui/paper2"
import { pick } from "./util"

function getRayBounds(
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
  paper: Paper2,
): [Point, Point] | null {
  const { xmin, w, ymin, h } = paper.bounds()

  if (x1 == x2) {
    if (y1 < y2) {
      if (y1 > ymin + h) {
        return null
      }
      return [
        paper.toOffset({ x: x1, y: y1 }),
        paper.toOffset({ x: x1, y: ymin + h }),
      ]
    }

    if (y1 < ymin) {
      return null
    }
    return [
      paper.toOffset({ x: x1, y: y1 }),
      paper.toOffset({ x: x1, y: ymin }),
    ]
  }

  const m = (y2 - y1) / (x2 - x1)

  if (x1 < x2) {
    if (x1 > xmin + w) {
      return null
    }

    return [
      paper.toOffset({ x: x1, y: y1 }),
      paper.toOffset({ x: xmin + w, y: m * (xmin + w - x1) + y1 }),
    ]
  }

  if (x1 < xmin) {
    return null
  }

  return [
    paper.toOffset({ x: x1, y: y1 }),
    paper.toOffset({ x: xmin, y: m * (xmin - x1) + y1 }),
  ]
}

export function drawRay(
  paper: Paper2,
  p1: Point,
  p2: Point,
  props?: DrawProps,
) {
  const { x: x1, y: y1 } = p1
  const { x: x2, y: y2 } = p2

  if (!(isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2))) {
    return
  }

  const bounds = getRayBounds(p1, p2, paper)
  if (!bounds) return

  const [o1, o2] = bounds
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  segmentByOffset(paper, o1, o2, props)
}

const DIMMED = new Prop(() => false)

export const EXT_RAY = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "ray") {
      return { value: value as JsValue<"ray">, expr }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      drawRay(paper, unpt(val[0]), unpt(val[1]), {
        dimmed: DIMMED.get(data.expr),
        pick: pick(val, "l", data),
      })
    }
  },
})
