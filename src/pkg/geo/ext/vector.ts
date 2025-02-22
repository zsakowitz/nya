import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { sx } from "../../../jsx"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { DrawProps, Paper, Point } from "../../../sheet/ui/paper"

export function drawVector(
  paper: Paper,
  p1: Point,
  p2: Point,
  props?: Pick<DrawProps, "ghost">,
) {
  const o1 = paper.toOffset(p1)
  const o2 = paper.toOffset(p2)
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const dx = o2.x - o1.x
  const dy = o2.y - o1.y
  const nx = (14 * dx) / Math.hypot(dx, dy)
  const ny = (14 * dy) / Math.hypot(dx, dy)
  const ox = o2.x - nx
  const oy = o2.y - ny
  const w = 0.4

  paper.append(
    "line",
    sx("line", {
      x1: o1.x,
      y1: o1.y,
      x2: o2.x,
      y2: o2.y,
      "stroke-width": 3,
      stroke: "#2d70b3",
      "stroke-linecap": "round",
      class: props?.ghost ? "pointer-events-none" : "",
    }),
  )

  paper.append(
    "line",
    sx("path", {
      d: `M ${o2.x} ${o2.y} L ${ox + w * ny} ${oy - w * nx} L ${ox - w * ny} ${oy + w * nx} Z`,
      "stroke-width": 3,
      stroke: "#2d70b3",
      fill: "#2d70b3",
      "stroke-linejoin": "round",
      class: props?.ghost ? "pointer-events-none" : "",
    }),
  )
}

export const EXT_VECTOR = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "vector") {
      return { value: value as JsValue<"vector"> }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      drawVector(paper, unpt(val[0]), unpt(val[1]))
    }
  },
})
