import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { defineHideable } from "../../../sheet/ext/hideable"
import { Color, Order, Size } from "../../../sheet/ui/cv/consts"
import { vectorPath } from "../vector"

export const EXT_VECTOR = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "vector") {
      return { value: value as JsValue<"vector">, expr }
    }
  },
  plot: {
    order() {
      return Order.Graph
    },
    items(data) {
      return each(data.value)
    },
    draw(data, [p1, p2]) {
      const { cv } = data.expr.sheet
      const d = vectorPath(cv, unpt(p1), unpt(p2))
      if (d) cv.path(new Path2D(d), Size.Line, Color.Blue, 1, 1)
    },
  },
})
