import { h } from "../../../jsx"
import { defineTyExt } from "../ty"

export const TY_EXT_POINT = defineTyExt({
  data({ value }) {
    if (
      value.type == "point32" ||
      value.type == "point64" ||
      value.type == "c32" ||
      value.type == "c64"
    ) {
      return 0
    }
  },
  el() {
    return h("", "hai")
  },
})
