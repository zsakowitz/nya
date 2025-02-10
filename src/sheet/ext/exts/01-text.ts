import { defineExt, Store } from ".."
import type { JsValue } from "../../../eval/ty"
import { LatexParser } from "../../../field/latex"
import { h, t } from "../../../jsx"

const store = new Store(() =>
  h(
    "block px-2 pb-1 -mt-2 w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] overflow-x-auto [&::-webkit-scrollbar]:hidden font-sans [.nya-expr:has(&):not(:focus-within)_.nya-display]:hidden [.nya-expr:has(&):not(:focus-within)_&]:px-4 [.nya-expr:has(&):not(:focus-within)_&]:py-3 [.nya-expr:has(&):not(:focus-within)_&]:mt-0",
  ),
)

export const EXT_TEXT = defineExt({
  data(expr) {
    if (expr.js?.value.type != "str" || expr.js.value.list !== false) {
      return
    }

    const value = expr.js.value as JsValue<"str", false>

    const el = store.get(expr)
    while (el.firstChild) {
      el.firstChild.remove()
    }

    if (value.list === false) {
      for (const segment of value.value) {
        if (segment.type == "plain") {
          el.append(t(segment.value))
        } else {
          try {
            const block = new LatexParser(
              expr.field.options,
              segment.value,
            ).parse()
            block.el.classList.add("font-['Symbola']")
            el.append(block.el)
          } catch {}
        }
      }
    }
    return el
  },
  el(data) {
    return data
  },
})
