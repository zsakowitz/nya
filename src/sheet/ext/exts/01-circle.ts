import { defineExt } from ".."
import { each, type JsValue } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import type { Paper, Point } from "../../ui/paper"

export function drawCircle({ x, y }: Point, r: number, paper: Paper) {
  if (!(isFinite(x) && isFinite(y) && isFinite(r) && r > 0)) {
    return
  }

  const { ctx, scale } = paper
  ctx.beginPath()
  ctx.lineWidth = 3 * scale
  paper.circle({ x, y }, r)
  ctx.strokeStyle = "#388c46"
  ctx.stroke()
}

export const EXT_CIRCLE = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "circle") {
      return { value: value as JsValue<"circle"> }
    }
  },
  plot2d(data, paper) {
    for (const { center, radius } of each(data.value)) {
      drawCircle(unpt(center), num(radius), paper)
    }
  },
  layer() {
    return 2
  },
})
