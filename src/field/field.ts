import { FieldInert } from "./field-inert"
import { h } from "./jsx"
import { Selection } from "./model"
import type { Exts, Options } from "./options"

export class Field extends FieldInert {
  readonly cursor = h(
    "relative nya-cursor border-current w-px -ml-px border-l [.nya-display:has(.nya-cmd-prompt)_&]:hidden [.nya-display:not(:focus)_&]:hidden",
  )

  constructor(exts: Exts, options: Options) {
    super(exts, options)
    this.el.tabIndex = 0

    let isPointerDown = false
    this.el.addEventListener("pointerdown", (event) => {
      isPointerDown = true

      const cursor = this.block.focus(event.clientX, event.clientY)

      this.onBeforeChange()

      if (event.shiftKey) {
        event.preventDefault()
        this.sel = Selection.of(this.sel.cachedAnchor, cursor)
      } else {
        this.sel = cursor.selection()
      }

      this.onAfterChange()
    })
    addEventListener("pointerup", () => (isPointerDown = false))
    this.el.addEventListener("pointermove", (event) => {
      if (!isPointerDown) return

      this.onBeforeChange()

      const cursor = this.block.focus(event.clientX, event.clientY)

      event.preventDefault()
      this.sel = Selection.of(this.sel.cachedAnchor, cursor)

      this.onAfterChange()
    })
    this.el.addEventListener(
      "touchmove",
      (event) => isPointerDown && event.preventDefault(),
    )
    this.el.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey) return
      const ext = this.exts.of(event.key)
      if (!ext) return
      event.preventDefault()
      this.init(ext, event.key, { event })
    })
  }

  onBeforeChange() {
    this.sel.each(({ el }) => el.classList.remove("bg-zlx-selection"))
    this.cursor.parentElement?.classList.remove("!bg-transparent")
    this.cursor.remove()
    this.sel.parent?.checkIfEmpty()
  }

  onAfterChange() {
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
