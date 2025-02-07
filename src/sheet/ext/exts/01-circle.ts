import { defineExt } from ".."
import { each, type JsValue } from "../../../eval/ty"
import { num } from "../../../eval/ty/create"

export const EXT_CIRCLE = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "circle") {
      return { value: value as JsValue<"circle"> }
    }
  },
  plot2d(data, paper) {
    for (const { center, radius } of each(data.value)) {
      const x = num(center.x)
      const y = num(center.y)
      const r = num(radius)

      if (!(isFinite(x) && isFinite(y) && isFinite(r) && r > 0)) continue

      const { ctx, scale } = paper
      ctx.beginPath()
      ctx.lineWidth = 3 * scale
      paper.circle({ x, y }, r)
      ctx.strokeStyle = "#388c46cc"
      ctx.stroke()
    }
  },
  layer() {
    return 1
  },
})
