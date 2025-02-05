import { defineExt } from ".."
import type { JsValue } from "../../../eval/ty"
import { num } from "../../../eval/ty/create"

export const EXT_POINT = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (
      value &&
      (value.type == "point32" ||
        value.type == "point64" ||
        value.type == "c32" ||
        value.type == "c64")
    ) {
      return { value: value as JsValue<"c32" | "c64" | "point32" | "point64"> }
    }
  },
  plot2d(data, paper) {
    for (const pt of data.value.list === false ?
      [data.value.value]
    : data.value.value) {
      const x = num(pt.x)
      const y = num(pt.y)
      if (!(isFinite(x) && isFinite(y))) continue

      const offset = paper.paperToCanvas({ x, y })
      const { ctx, scale } = paper

      ctx.beginPath()
      ctx.fillStyle = "#6042a659"
      ctx.arc(offset.x, offset.y, 12 * scale, 0, 2 * Math.PI)
      ctx.fill()

      ctx.beginPath()
      ctx.fillStyle = "#6042a6"
      ctx.arc(offset.x, offset.y, 4 * scale, 0, 2 * Math.PI)
      ctx.fill()
    }
  },
})
