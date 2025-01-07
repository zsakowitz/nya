import { CmdSelectAll } from "./cmd/util/cursor"
import { FieldInert } from "./field-inert"
import { h } from "./jsx"
import { Selection } from "./model"
import type { Exts, Options } from "./options"

export class Field extends FieldInert {
  readonly cursor = h(
    "relative -cursor border-current w-px -ml-px border-l [.-display:has(.-cmd-prompt)_&]:hidden [.-display:not(:focus)_&]:hidden",
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

      this.onAfterChange(false)
    })
    addEventListener("pointerup", () => (isPointerDown = false))
    this.el.addEventListener("pointermove", (event) => {
      if (!isPointerDown) return

      this.onBeforeChange()

      const cursor = this.block.focus(event.clientX, event.clientY)

      event.preventDefault()
      this.sel = Selection.of(this.sel.cachedAnchor, cursor)

      this.onAfterChange(false)
    })
    this.el.addEventListener(
      "touchmove",
      (event) => isPointerDown && event.preventDefault(),
      { passive: false },
    )
    this.el.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key == "a") {
          event.preventDefault()
          this.init(CmdSelectAll, "")
        }
        return
      }
      const ext = this.exts.of(event.key)
      if (!ext) return
      if (this.init(ext, event.key, { event }) != "browser") {
        event.preventDefault()
      }
    })
    this.el.addEventListener("focus", () => {
      this.cursor.classList.add("[scroll-margin:1rem]")
      this.cursor.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest",
      })
      this.cursor.classList.remove("[scroll-margin:1rem]")
    })
    this.onAfterChange(false)
  }

  onBeforeChange() {
    this.sel.each(({ el }) => el.classList.remove("bg-nya-selection"))
    this.cursor.parentElement?.classList.remove("!bg-transparent")
    this.cursor.remove()
    this.sel.parent?.checkIfEmpty()
  }

  onAfterChange(wasChangeCanceled: boolean) {
    this.sel.each(({ el }) => el.classList.add("bg-nya-selection"))
    this.sel.cursor(this.sel.focused).render(this.cursor)
    this.cursor.parentElement?.classList.add("!bg-transparent")
    this.sel.parent?.checkIfEmpty()
    this.cursor.parentElement?.parentElement?.classList.remove("nya-has-empty")
    if (!wasChangeCanceled) {
      this.cursor.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest",
      })
    }
  }
}
