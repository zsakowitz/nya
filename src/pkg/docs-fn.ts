import { faBook } from "@fortawesome/free-solid-svg-icons/faBook"
import type { Package } from "."
import { FNS } from "../eval/ops"
import { ALL_DOCS } from "../eval/ops/docs"
import { fa } from "../field/fa"
import { h, hx } from "../jsx"
import type { ItemFactory } from "../sheet/item"
import { makeDoc } from "../sheet/ui/sheet/docs"

interface Data {
  fn: string
  el: HTMLElement
  select: HTMLSelectElement
}

const FACTORY: ItemFactory<Data> = {
  id: "nya:docs-fn",
  name: "docs",
  icon: faBook,

  init(ref, source) {
    const fns = Object.values(ALL_DOCS)
      .filter((x) => x.name in FNS && FNS[x.name])
      .sort((a, b) =>
        a.name < b.name ? -1
        : a.name > b.name ? 1
        : 0,
      )

    const field = hx(
      "select",
      "relative -mx-4 px-3 py-2 -mb-2 bg-transparent text-[1.265rem] focus:outline-none font-['Times_New_Roman']",
      hx(
        "option",
        { value: "-1", disabled: "disabled", selected: "selected" },
        "‹function›",
      ),
    )
    for (let i = 0; i < fns.length; i++) {
      field.appendChild(hx("option", { value: "" + i }, fns[i]!.name))
    }
    const idx = source ? fns.findIndex((x) => x.name == source) : -1
    const body = h(
      "contents",
      h(
        "text-[--nya-title] text-sm -mb-1",
        "Choose a function to show information about.",
      ),
    )

    field.addEventListener("input", () => {
      const fn = fns[+field.value]
      if (fn) {
        while (body.firstChild) {
          body.firstChild.remove()
        }
        const doc = makeDoc(fn, { title: false })
        if (doc) {
          body.appendChild(doc)
        }
        data.fn = fn.name
      }
    })

    const data: Data = {
      fn: "",
      select: field,
      el: h(
        "grid grid-cols-[2.5rem_auto] border-r border-b border-[--nya-border] relative nya-expr",
        // grey side of expression
        h(
          {
            class:
              "nya-expr-bar inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border] font-sans text-[--nya-expr-index] text-[65%] leading-none focus:outline-none",
            tabindex: "-1",
          },
          ref.elIndex,
          fa(faBook, "block mx-auto size-6 mt-0.5 mb-1.5 fill-current"),
        ),

        // main body
        hx("label", "relative flex flex-col px-4 pb-3 font-sans", field, body),

        // focus ring
        h(
          "hidden absolute -inset-y-px inset-x-0 [:first-child>&]:top-0 border-2 border-[--nya-expr-focus] pointer-events-none [:focus-within>&]:block [:active>&]:block",
        ),
      ),
    }

    if (idx !== -1) {
      field.value = "" + idx
      const fn = fns[idx]!
      const doc = makeDoc(fn, { title: false })
      if (doc) {
        body.appendChild(doc)
      }
      data.fn = fn.name
    }

    return data
  },
  el(data) {
    return data.el
  },
  encode(data) {
    return data.fn
  },
  unlink() {},
  focus(data) {
    data.select.focus()
  },
}

export const PKG_DOCS_FN: Package = {
  id: "nya:docs-fn",
  name: "inline function documentation",
  label: null,
  sheet: {
    items: [FACTORY],
  },
}
