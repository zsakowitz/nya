import { defineExt, Store } from ".."
import { Display } from "../../../eval/ty/display"
import { FieldInert } from "../../../field/field-inert"
import { R } from "../../../field/model"
import { h } from "../../../jsx"

const store = new Store((e) => {
  const field = new FieldInert(
    e.field.options,
    "bg-[--nya-bg-sidebar] border border-[--nya-border] px-2 py-1 rounded ml-auto inline-block",
  )
  const el = h(
    "flex px-2 pb-2 -mt-2 w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] overflow-x-auto [&::-webkit-scrollbar]:hidden",
    field.el,
  )
  return { field, el }
})

export const EXT_EVAL = defineExt({
  data(expr) {
    if (!expr.js) {
      return
    }

    const { field, el } = store.get(expr)
    const { block } = field
    block.clear()
    new Display(block.cursor(R), expr.js.base).output(expr.js.value)
    return el
  },
  el(data) {
    return data
  },
})
