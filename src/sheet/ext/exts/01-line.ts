import { defineExt } from ".."
import { each, type JsValue, type Tys } from "../../../eval/ty"
import { num } from "../../../eval/ty/create"
import type { Paper, Point } from "../../ui/paper"

function getLineBounds(line: Tys["line"], paper: Paper): [Point, Point] {
  const x1 = num(line[0].x)
  const y1 = num(line[0].y)
  const x2 = num(line[1].x)
  const y2 = num(line[1].y)
  const { xmin, w, ymin, h } = paper.bounds()

  if (x1 == x2) {
    return [
      paper.paperToCanvas({ x: x1, y: ymin }),
      paper.paperToCanvas({ x: x1, y: ymin + h }),
    ]
  }

  const m = (y2 - y1) / (x2 - x1)

  return [
    paper.paperToCanvas({ x: xmin, y: m * (xmin - x1) + y1 }),
    paper.paperToCanvas({ x: xmin + w, y: m * (xmin + w - x1) + y1 }),
  ]
}

export const EXT_LINE = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "line") {
      return { value: value as JsValue<"line"> }
    }
  },
  plot2d(data, paper) {
    for (const segment of each(data.value)) {
      const x1 = num(segment[0].x)
      const y1 = num(segment[0].y)
      const x2 = num(segment[1].x)
      const y2 = num(segment[1].y)

      if (!(isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)))
        continue

      const [o1, o2] = getLineBounds(segment, paper)
      const { ctx, scale } = paper

      ctx.beginPath()
      ctx.lineWidth = 3 * scale
      ctx.strokeStyle = "#2d70b3"
      ctx.moveTo(o1.x, o1.y)
      ctx.lineTo(o2.x, o2.y)
      ctx.stroke()
    }
  },
  layer() {
    return 2
  },
})
