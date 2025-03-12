import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { defineHideable } from "../../../sheet/ext/hideable"
import { Colors, Size } from "../../../sheet/ui/cv/consts"

export const EXT_POLYGON = defineHideable({
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
    order: 2,
    draw(data) {
      for (const val of each(data.value)) {
        data.expr.sheet.cv.polygon(
          val.map(unpt),
          Size.Line,
          Colors.Blue,
          1,
          0.3,
          true,
        )
      }
    },
  },
})
