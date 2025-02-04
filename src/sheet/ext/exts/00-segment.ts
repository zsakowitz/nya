import { defineExt } from ".."
import type { JsValue } from "../../../eval/ty"
import { num } from "../../../eval/ty/create"

export const EXT_SEGMENT = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "segment32") {
      return { value: value as JsValue<"segment32"> }
    }
  },
  plot2d(data, paper) {
    for (const segment of data.value.list === false ?
      [data.value.value]
    : data.value.value) {
      const x1 = num(segment[0].x)
      const y1 = num(segment[0].y)
      const x2 = num(segment[1].x)
      const y2 = num(segment[1].y)

      if (!(isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)))
        continue

      const o1 = paper.paperToCanvas({ x: x1, y: y1 })
      const o2 = paper.paperToCanvas({ x: x2, y: y2 })
      const { ctx, scale } = paper

      ctx.beginPath()
      ctx.lineWidth = 3 * scale
      ctx.strokeStyle = "#00c000cc"
      ctx.moveTo(o1.x, o1.y)
      ctx.lineTo(o2.x, o2.y)
      ctx.stroke()
    }
  },
})
