import type { Package } from "#/types"
import type { SReal } from "@/eval/ty"
import { frac } from "@/eval/ty/create"
import { Display } from "@/eval/ty/display"
import { R } from "@/field/dir"
import { FieldInert } from "@/field/field-inert"
import { h } from "@/jsx"
import { Store, defineExt } from "@/sheet/ext"
import type { Expr } from "@/sheet/ui/expr"

export const STORE_EVAL = new Store((e) => {
  const field = new FieldInert(
    e.field.options,
    e.sheet.scope,
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

    const { field, el } = STORE_EVAL.get(expr)
    const { block } = field
    block.clear()
    new Display(block.cursor(R), expr.js.base).output(expr.js.value)
    return el
  },
  el(data) {
    return data
  },
})

export function createMultiEval(items: (Node | string)[]) {
  const store = new Store(() => {
    const labels = items.map((label) => {
      const fields = h("contents")
      return {
        el: h(
          "contents",
          h(""),
          h(
            "bg-[--nya-bg-sidebar] border border-[--nya-border] px-2 rounded-l inline-block [line-height:1] flex items-center",
            label,
          ),
          fields,
        ),
        fields,
      }
    })
    const el = h(
      "grid grid-cols-[1fr,auto] px-2 pb-2 -mt-2 w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] overflow-x-auto [&::-webkit-scrollbar]:hidden gap-y-1",
      ...labels.map((x) => x.el),
    )
    return { labels: labels.map((x) => x.fields), el }
  })

  function set(expr: Expr, values: SReal[][]) {
    const { el, labels } = store.get(expr)

    if (values.length == 0) {
      for (let i = 0; i < 5; i++) {
        const label = labels[i]!
        while (label.firstChild) {
          label.firstChild.remove()
        }

        const { el } = new FieldInert(
          expr.field.options,
          expr.sheet.scope,
          "bg-[--nya-bg-sidebar] border border-[--nya-border] px-2 py-1 border-l-0 last:rounded-r inline-block",
        )
        label.appendChild(el)
        el.classList.remove("text-[1.265em]")
        el.classList.add("italic")
        el.classList.remove("not-italic")
        el.textContent = "no lists"
      }

      el.style.gridTemplateColumns = `1fr auto auto`
      return el
    }

    for (let i = 0; i < 5; i++) {
      const label = labels[i]!
      while (label.firstChild) {
        label.firstChild.remove()
      }

      for (const x of values) {
        const field = new FieldInert(
          expr.field.options,
          expr.sheet.scope,
          "bg-[--nya-bg-sidebar] border border-[--nya-border] px-2 py-1 border-l-0 last:rounded-r inline-block",
        )
        const display = new Display(field.block.cursor(R), frac(10, 1))
        display.num(x[i]!)
        label.appendChild(field.el)
      }
    }

    el.style.gridTemplateColumns = `1fr auto${" auto".repeat(values.length)}`

    return el
  }

  return {
    el(expr: Expr) {
      return store.get(expr).el
    },
    set,
  }
}

export default {
  name: "evaluator",
  label: "displays computed expressions",
  category: "miscellaneous",
  deps: [],
  sheet: {
    exts: {
      2: [EXT_EVAL],
    },
  },
} satisfies Package
