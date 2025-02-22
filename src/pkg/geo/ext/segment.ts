import { each, type JsValue, type SPoint } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Paper } from "../../../sheet/ui/paper"
import { segmentByPaper } from "../../../sheet/ui/paper2"
import { pick } from "./util"

export function drawSegment(
  segment: [SPoint, SPoint],
  paper: Paper,
  selected: boolean,
  dimmed: boolean,
) {
  const x1 = num(segment[0].x)
  const y1 = num(segment[0].y)
  const x2 = num(segment[1].x)
  const y2 = num(segment[1].y)

  const o1 = paper.paperToCanvas({ x: x1, y: y1 })
  const o2 = paper.paperToCanvas({ x: x2, y: y2 })
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const { ctx, scale } = paper

  if (dimmed) {
    ctx.globalAlpha = 0.3
  }

  if (selected) {
    ctx.beginPath()
    ctx.lineWidth = 8 * scale
    ctx.strokeStyle = "#2d70b360"
    ctx.moveTo(o1.x, o1.y)
    ctx.lineTo(o2.x, o2.y)
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.lineWidth = 3 * scale
  ctx.strokeStyle = "#2d70b3"
  ctx.moveTo(o1.x, o1.y)
  ctx.lineTo(o2.x, o2.y)
  ctx.stroke()

  if (dimmed) {
    ctx.globalAlpha = 1
  }
}

const DIMMED = new Prop(() => false)

export const EXT_SEGMENT = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "segment") {
      return {
        value: value as JsValue<"segment">,
        paper: expr.sheet.paper,
        expr,
      }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      segmentByPaper(paper, unpt(val[0]), unpt(val[1]), {
        dimmed: DIMMED.get(data.expr),
        pick: pick(val, "l", data),
      })
    }
  },
})
