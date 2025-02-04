import { h } from "../jsx"
import { FieldInert } from "./field-inert"
import { Selection } from "./model"
import type { Options } from "./options"

export class Field extends FieldInert {
  readonly cursor = h(
    "relative nya-cursor border-current w-px -ml-px border-l [.nya-display:has(.nya-cmd-prompt)_&]:hidden [.nya-display:not(:focus)_&]:hidden",
  )

  constructor(options: Options, className?: string) {
    super(options, className)
    this.makeActive()
    this.showCursor()
  }

  makeActive() {
    this.el.tabIndex = 0

    const onPointerDown = (event: PointerEvent) => {
      this.el.setPointerCapture(event.pointerId)

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
    }
    const onPointerUp = () => {
      isPointerDown = false
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!isPointerDown) return

      this.onBeforeChange()

      const cursor = this.block.focus(event.clientX, event.clientY)

      event.preventDefault()
      this.sel = Selection.of(this.sel.cachedAnchor, cursor)

      this.onAfterChange(false)
    }
    const onTouchMove = (event: TouchEvent) => {
      if (isPointerDown) {
        event.preventDefault()
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.metaKey && event.ctrlKey) {
          return
        }
        const ext = this.options.shortcuts.get(event.key)
        if (!ext) return
        const result = this.init(ext, event.key, { event })
        if (result != "browser") {
          event.preventDefault()
        }
        return
      }
      const ext = this.options.inits.get(event.key)
      if (!ext) return
      if (this.init(ext, event.key, { event }) != "browser") {
        event.preventDefault()
      }
    }
    const onPaste = ({ clipboardData }: ClipboardEvent) => {
      const text = clipboardData?.getData("text/plain") ?? ""
      this.typeLatex(text)
    }
    const onFocus = () => {
      this.showCursor(false)
      this.cursor.classList.add("[scroll-margin:1rem]")
      this.cursor.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest",
      })
      this.cursor.classList.remove("[scroll-margin:1rem]")
    }
    const onBlur = () => {
      this.onBeforeChange()
    }

    let isPointerDown = false
    this.el.addEventListener("pointerdown", onPointerDown)
    addEventListener("pointerup", onPointerUp)
    this.el.addEventListener("pointermove", onPointerMove)
    this.el.addEventListener("touchmove", onTouchMove, { passive: false })
    this.el.addEventListener("keydown", onKeyDown)
    this.el.addEventListener("paste", onPaste)
    this.el.addEventListener("focus", onFocus)
    this.el.addEventListener("blur", onBlur)
  }

  showCursor(scrollIntoView = true) {
    this.sel.each(({ el }) => el.classList.add("bg-nya-selection"))
    this.sel.cursor(this.sel.focused).render(this.cursor)
    this.sel.parent?.checkIfEmpty()
    this.cursor.classList.toggle("text-transparent", !this.sel.isEmpty())
    this.cursor.parentElement?.classList.add("!bg-transparent")
    if (scrollIntoView) {
      this.cursor.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest",
      })
    }
  }

  onBeforeChange() {
    this.sel.each(({ el }) => el.classList.remove("bg-nya-selection"))
    this.cursor.parentElement?.classList.remove("!bg-transparent")
    this.cursor.remove()
    this.sel.parent?.checkIfEmpty()
  }

  onAfterChange(wasChangeCanceled: boolean) {
    this.showCursor(!wasChangeCanceled)
  }
}
