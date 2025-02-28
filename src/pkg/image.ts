import { faImage as faImageRegular } from "@fortawesome/free-regular-svg-icons"
import { faImage } from "@fortawesome/free-solid-svg-icons"
import type { Package } from "."
import { fa } from "../field/fa"
import { Field } from "../field/field"
import { h } from "../jsx"
import { type ItemFactory } from "../sheet/item"
import type { ItemRef } from "../sheet/items"

interface Data {
  url: string | null
  name: Field
  ref: ItemRef<Data>
  el: HTMLElement
}

const FACTORY: ItemFactory<Data> = {
  id: "nya:image",
  name: "image",
  icon: faImage,

  init(ref) {
    const name = new Field(ref.list.sheet.options, "")

    return {
      url: null,
      name,
      ref,
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
          fa(faImageRegular, "block mx-auto size-6 mt-0.5 mb-1.5 fill-current"),
        ),

        // main body
        h("flex flex-col"),

        // focus ring
        h(
          "hidden absolute -inset-y-px inset-x-0 [:first-child>&]:top-0 border-2 border-[--nya-expr-focus] pointer-events-none [:focus-within>&]:block [:active>&]:block",
        ),
      ),
    }
  },
  el(data) {
    return data.el
  },
  encode() {
    // TODO:
    return ""
  },
  decode(ref) {
    // TODO:
    return FACTORY.init(ref)
  },
  unlink() {
    // TODO:
  },
  focus() {
    // TODO:
  },
}

export const PKG_IMAGE: Package = {
  id: "nya:image",
  name: "images",
  label: "upload and manipulate images",
  sheet: {
    items: [FACTORY],
  },
}
