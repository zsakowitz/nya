import { each, type JsValue, type SPoint } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { defineHideable } from "../../../sheet/ext/hideable"
import { Colors, Order, Size } from "../../../sheet/ui/cv/consts"
import type { Expr } from "../../../sheet/ui/expr"

export const EXT_POLYGON = defineHideable<
  { value: JsValue<"polygon">; expr: Expr },
  readonly SPoint[]
>({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "polygon") {
      return {
        value: value as JsValue<"polygon">,
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
      data.expr.sheet.cv.polygon(
        val.map(unpt),
        Size.Line,
        Colors.Blue,
        1,
        0.3,
        true,
      )
    },
    // FIXME: polygon target
  },
})
