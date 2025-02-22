import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import { segmentByPaper } from "../../../sheet/ui/paper2"
import { pick } from "./util"

const DIMMED = new Prop(() => false)

export const EXT_SEGMENT = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "segment") {
      return {
        value: value as JsValue<"segment">,
        paper: expr.sheet.paper,
        expr,
      }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      segmentByPaper(paper, unpt(val[0]), unpt(val[1]), {
        dimmed: DIMMED.get(data.expr),
        pick: pick(val, "l", data),
      })
    }
  },
})
