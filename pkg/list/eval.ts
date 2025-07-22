import { FieldInert } from "@/field/field-inert"
import { h } from "@/jsx"
import { Store } from "@/sheet/ext"

export const STORE_EVAL = new Store((e) => {
  const field = new FieldInert(
    e.field.options,
    e.sheet.scope,
    "bg-(--nya-bg-sidebar) border border-(--nya-border) px-2 pt-[.35rem] pb-[.25rem] rounded-sm inline-block",
  )
  const el = h(
    "flex px-2 pb-2 -mt-2 w-[calc(var(--nya-sidebar)-2.5rem-1px)] overflow-x-auto [&::-webkit-scrollbar]:hidden items-baseline",
    h(
      "ml-auto inline-block pt-[.35rem] text-[1.265rem] pr-1.5 text-slate-400",
      "=",
    ),
    field.el,
  )
  return { field, el }
})
