import { Display, type Exts } from "./display"
import { h } from "./jsx"
import { Selection } from "./model"
import type { Options } from "./options"

export class Field extends Display {
  readonly cursor = h(
    "relative nya-cursor border-current w-px -ml-px border-l [.nya-display:has(.nya-cmd-prompt)_&]:hidden",
  )
  readonly field = h({ tabindex: "0" }, this.contents)

  constructor(exts: Exts, options: Options) {
    super(exts, options)

    let isPointerDown = false
    this.field.addEventListener("pointerdown", (event) => {
      isPointerDown = true

      const cursor = this.block.focus(event.clientX, event.clientY)

      this.beforeChange()

      if (event.shiftKey) {
        event.preventDefault()
        this.sel = Selection.of(this.sel.cachedAnchor, cursor)
      } else {
        this.sel = cursor.selection()
      }

      this.afterChange()
    })
    addEventListener("pointerup", () => (isPointerDown = false))
    this.field.addEventListener("pointermove", (event) => {
      if (!isPointerDown) return

      this.beforeChange()

      const cursor = this.block.focus(event.clientX, event.clientY)

      event.preventDefault()
      this.sel = Selection.of(this.sel.cachedAnchor, cursor)

      this.afterChange()
    })
    this.field.addEventListener(
      "touchmove",
      (event) => isPointerDown && event.preventDefault(),
    )
    this.field.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey) return
      const ext = this.exts.of(event.key)
      if (!ext) return
      event.preventDefault()
      this.init(ext, event.key, { event })
    })
  }

  beforeChange() {
    this.sel.each(({ el }) => el.classList.remove("bg-zlx-selection"))
    this.cursor.parentElement?.classList.remove("!bg-transparent")
    this.cursor.remove()
    this.sel.parent?.checkIfEmpty()
  }

  afterChange() {
    this.sel.each(({ el }) => el.classList.add("bg-zlx-selection"))
    this.sel.cursor(this.sel.focused).render(this.cursor)
    this.cursor.parentElement?.classList.add("!bg-transparent")
    this.sel.parent?.checkIfEmpty()
    this.cursor.parentElement?.parentElement?.classList.remove("zlx-has-empty")
    this.cursor.scrollIntoView({
      behavior: "instant",
      block: "nearest",
      inline: "nearest",
    })
  }
}
