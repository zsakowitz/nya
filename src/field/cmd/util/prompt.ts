import type { Node } from "../../../eval/ast/token"
import type { FieldInert } from "../../field-inert"
import { h, hx } from "../../jsx"
import {
  L,
  R,
  Selection,
  type Cursor,
  type InitProps,
  type InitRet,
} from "../../model"
import type { Options } from "../../options"
import { Leaf } from "../leaf"

export class CmdPrompt extends Leaf {
  static init(cursor: Cursor, { options, field: display }: InitProps): InitRet {
    const prompt = new CmdPrompt(
      options,
      display,
      cursor.selection().clone(),
      document.activeElement,
    )
    prompt.insertAt(cursor, L)
  }

  static initOn(
    selection: Selection,
    { options, field: display }: InitProps,
  ): InitRet {
    const prompt = new CmdPrompt(
      options,
      display,
      selection.clone(),
      document.activeElement,
    )
    prompt.insertAt(selection.cursor(R), L)
    return new Selection(
      selection.parent,
      selection[L],
      prompt,
      R,
      selection.cachedAnchor,
    )
  }

  constructor(
    readonly options: Options,
    readonly display: FieldInert,
    readonly selection: Selection,
    readonly active: Element | null,
  ) {
    const field = hx("input", "bg-transparent min-w-[3ch] focus:outline-none")
    field.addEventListener("keydown", onKeyDown)
    field.addEventListener("input", resize)
    field.addEventListener("blur", onBlur)
    resize()

    const form = hx("form", "contents", field)
    form.addEventListener("submit", (ev) => {
      ev.preventDefault()
      field.removeEventListener("blur", onBlur)
      if (field.value) {
        this.confirm(field.value)
      }
    })

    super(
      "\\text{typing...}",
      h("border border-dotted border-current nya-cmd-prompt", "\\", form),
    )
    const self = this

    setTimeout(() => field.focus())

    function resize() {
      field.style.width = "0"
      field.style.width = field.scrollWidth + "px"
    }

    function onBlur() {
      self.cancel()
    }

    function onKeyDown(event: KeyboardEvent) {
      event.stopPropagation()

      if (event.key == "Backspace" && field.value == "") {
        field.removeEventListener("blur", onBlur)
        self.cancel()
      }
    }
  }

  cancel() {
    this.display.onBeforeChange?.()
    this.display.sel = this.selection
    this.remove()
    this.display.onAfterChange?.(false)
    ;(this.active as HTMLElement)?.focus()
  }

  confirm(name: string) {
    this.display.onBeforeChange?.()
    this.display.sel = this.selection
    this.remove()
    this.display.type("\\" + name)
    this.display.onAfterChange?.(false)
    ;(this.active as HTMLElement)?.focus()
  }

  reader(): string {
    return " Typing "
  }

  ascii(): string {
    return "typing()"
  }

  latex(): string {
    return "\\text{typing...}"
  }

  ir(_tokens: Node[]): void {
    // Empty, as {@linkcode CmdPrompt} isn't a complete command
  }
}
