import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { defineHideable } from "../../../sheet/ext/hideable"
import { Colors, Order, Size } from "../../../sheet/ui/cv/consts"

export const EXT_SEGMENT = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "segment") {
      return {
        value: value as JsValue<"segment">,
        expr,
      }
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
      data.expr.sheet.cv.polygon(val.map(unpt), Size.Line, Colors.Blue)
    },
  },
})
