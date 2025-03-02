import { faStickyNote } from "@fortawesome/free-solid-svg-icons/faStickyNote"
import type { Package } from "."
import { fa } from "../field/fa"
import { h, hx } from "../jsx"
import type { ItemFactory } from "../sheet/item"
import type { ItemRef } from "../sheet/items"

interface Data {
  contents: string
  ref: ItemRef<Data>
  el: HTMLElement
  field: HTMLTextAreaElement
  onResize(): void
}

const FACTORY: ItemFactory<Data> = {
  id: "nya:note",
  name: "note",
  icon: faStickyNote,
  init(ref, source) {
    let contents = ""
    if (source) {
      try {
        const result = JSON.parse(source)
        if (typeof result == "string") {
          contents = result
        }
      } catch (e) {
        console.warn("[nya:note.init]", e)
      }
    }

    const field = hx("textarea", {
      class:
        "px-4 py-3 focus:outline-none font-sans resize-none bg-transparent",
      value: contents,
      spellcheck: "false",
    })

    const el = h(
      "grid grid-cols-[2.5rem_auto] border-r border-b border-[--nya-border] relative nya-expr",

      // grey side of expression
      h(
        {
          class:
            "nya-expr-bar inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border] font-sans text-[--nya-expr-index] text-[65%] leading-none focus:outline-none",
          tabindex: "-1",
        },
        ref.elIndex,
        fa(faStickyNote, "block mx-auto size-6 mt-0.5 mb-1.5 fill-current"),
      ),

      // main body
      field,

      // focus ring
      h(
        "hidden absolute -inset-y-px inset-x-0 [:first-child>&]:top-0 border-2 border-[--nya-expr-focus] pointer-events-none [:focus-within>&]:block [:active>&]:block",
      ),
    )

    const data: Data = {
      contents,
      ref,
      el,
      field,
      onResize: resize,
    }

    field.addEventListener("keydown", (e) => {
      e.stopPropagation()
    })

    field.addEventListener("input", () => {
      data.contents = field.value
      field.style.height = "0"
      field.style.height = field.scrollHeight + "px"
    })

    function resize() {
      field.style.height = "0"
      field.style.height = field.scrollHeight + "px"
    }

    addEventListener("resize", resize)

    queueMicrotask(resize)

    return data
  },
  el(data) {
    return data.el
  },
  encode(data) {
    return JSON.stringify(data.contents)
  },
  focus(data) {
    data.field.focus()
  },
  unlink(data) {
    removeEventListener("resize", data.onResize)
  },
}

export const PKG_NOTES: Package = {
  id: "nya:notes",
  name: "notes",
  label: "in plain text between expressions",
  sheet: {
    items: [FACTORY],
  },
}
