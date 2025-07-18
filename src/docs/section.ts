import { fa, h, hx } from "@/jsx"
import { faCaretRight } from "@fortawesome/free-solid-svg-icons/faCaretRight"

export function title(label: string, rlabel: string | null) {
  const el = h("flex-1 pl-1.5 pr-2", label)
  const elr = h("flex-1 pl-1.5 pr-0 text-right", rlabel)
  return {
    el: hx(
      "summary",
      "in-[[open]]:sticky top-0 z-20 bg-(--nya-bg) pt-2 list-none",
      h(
        "flex bg-(--nya-bg-sidebar) border border-(--nya-border) pt-0.5 -mx-2 rounded-lg px-2 font-['Symbola'] text-[1.265rem] items-center in-data-[nya-disabled=true]:opacity-30",
        h(
          "",
          fa(
            faCaretRight,
            "size-4 fill-(--nya-title) in-[[open]]:rotate-90 -mt-0.5 transition-transform",
          ),
        ),
        el,
        rlabel && elr,
      ),
    ),
    label: el,
    rlabel: elr,
  }
}

export function sectionEls(
  label: string,
  rlabel: string | null,
  data: Node | (Node | null)[],
  open?: boolean,
) {
  const titleEl = title(label, rlabel)

  return {
    el: hx(
      "details",
      {
        class: "flex flex-col open:gap-4 -mb-2 open:-mb-2",
        open: open ? "open" : null,
      },
      titleEl.el,
      h("flex flex-col gap-4 pb-2", ...(Array.isArray(data) ? data : [data])),
    ),
    label: titleEl.label,
    rlabel: titleEl.rlabel,
  }
}
