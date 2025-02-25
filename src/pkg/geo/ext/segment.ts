import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { defineHideable } from "../../../sheet/ext/hideable"
import { segmentByPaper } from "../../../sheet/ui/paper"
import { pick } from "./util"

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
  svg(data, paper) {
    for (const val of each(data.value)) {
      segmentByPaper(paper, unpt(val[0]), unpt(val[1]), {
        pick: pick(val, "l", data),
        kind: "segment",
      })
    }
  },
})
