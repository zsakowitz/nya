import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { faFolder } from "@fortawesome/free-solid-svg-icons/faFolder"
import type { Package } from "."
import { fa } from "../field/fa"
import { h, hx } from "../jsx"
import type { ItemFactory } from "../sheet/item"
import type { ItemRef } from "../sheet/items"

interface Data {
  contents: string
  ref: ItemRef<Data>
  field: HTMLTextAreaElement
  onResize(): void
}

const FACTORY: ItemFactory<Data> = {
  id: "nya:folder",
  name: "folder",
  icon: faFolder,
  group: true,
  init(ref, source) {
    let contents = ""
    if (source) {
      try {
        const result = JSON.parse(source)
        if (typeof result == "string") {
          contents = result
        }
      } catch (e) {
        console.warn("[nya:folder.init]", e)
      }
    }

    const field = hx("textarea", {
      class:
        "px-4 py-3 focus:outline-none font-sans resize-none bg-transparent",
      spellcheck: "false",
    })
    field.value = contents

    const data: Data = {
      contents,
      ref,
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
  main(data) {
    return h(
      "grid grid-cols-[1rem_auto]",
      h(
        "grid grid-rows-[1fr,1fr]",
        h(""),
        h("border-r border-t border-[--nya-border] mb-1 ml-1"),
      ),
      data.field,
    )
  },
  aside(data) {
    const add = hx("button", "", fa(faPlus, "size-4"))
    add.onclick = () => {
      data.ref.sublist!.createDefault()
    }
    return add
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

export const PKG_FOLDER: Package = {
  id: "nya:folder",
  name: "folders",
  label: "for organizing expressions",
  sheet: {
    items: [FACTORY],
  },
}
