import { faFolder } from "@fortawesome/free-solid-svg-icons/faFolder"
import type { Package } from "."
import { D, L, R, U } from "../field/model"
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
    field.addEventListener("keydown", (event) => {
      if (event.key == "Backspace") {
        if (field.selectionStart == 0 && field.selectionEnd == 0) {
          event.preventDefault()
          ref.onDelOut(L, field.value == "")
          return
        }
      } else if (event.key == "Del" || event.key == "Delete") {
        if (
          field.selectionStart == field.selectionEnd &&
          field.selectionEnd == field.value.length
        ) {
          event.preventDefault()
          ref.onDelOut(R, field.value == "")
          return
        }
      }

      if (event.key == "Enter" && !event.shiftKey) {
        event.preventDefault()
        ref.onEnter(D)
        return
      }

      // TODO: detect we're at the end of the textarea
      if (event.key == "ArrowDown") {
        event.preventDefault()
        ref.onVertOut(D)
        return
      }

      if (event.key == "ArrowUp") {
        event.preventDefault()
        ref.onVertOut(U)
        return
      }
    })

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
      h("border-r border-t border-[--nya-border] mb-1 ml-1 mt-[1.5rem]"),
      data.field,
    )
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
