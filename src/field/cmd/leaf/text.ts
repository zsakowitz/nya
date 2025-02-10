import { Leaf } from "."
import type { Node } from "../../../eval/ast/token"
import { h, hx } from "../../../jsx"
import type { FieldInert } from "../../field-inert"
import { toText, type LatexParser } from "../../latex"
import {
  Command,
  L,
  R,
  type Cursor,
  type Dir,
  type InitProps,
} from "../../model"

export class CmdTextInert extends Leaf {
  static fromLatex(_cmd: string, parser: LatexParser): Command {
    return new this(parser.text())
  }

  constructor(readonly value: string) {
    super("\\text", h("", "“", h("font-['Times_New_Roman']", value), "”"))
  }

  reader(): string {
    return " Text " + this.value + " EndText "
  }

  ascii(): string {
    return "text(" + this.value + ")"
  }

  latex(): string {
    return "\\text{" + toText(this.value) + "}"
  }

  ir(tokens: Node[]): void {
    tokens.push({ type: "text", value: this.value })
  }
}

export class CmdText extends Leaf {
  static init(cursor: Cursor, props: InitProps) {
    const text = new CmdText("", props.field)
    text.insertAt(cursor, L)
    text.input.focus()
  }

  static fromLatex(_cmd: string, parser: LatexParser): Command {
    const text = parser.text()
    if (parser.field) {
      return new this(text, parser.field)
    } else {
      return new CmdTextInert(text)
    }
  }

  input
  ql
  qr
  constructor(
    value = "",
    readonly field?: FieldInert,
  ) {
    const input = hx(
      "input",
      "relative focus:outline-none font-['Times_New_Roman'] bg-transparent -mx-[0.5ch] px-[0.5ch] [box-sizing:content-box]",
    )
    input.spellcheck = false
    input.value = value
    if (field) {
      input.addEventListener("keydown", (ev) => {
        ev.stopImmediatePropagation()

        if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey) {
          return
        }

        if (
          (ev.key == "ArrowLeft" &&
            input.selectionStart == 0 &&
            input.selectionEnd == 0) ||
          (ev.key == "ArrowRight" &&
            input.selectionStart == input.value.length &&
            input.selectionEnd == input.value.length)
        ) {
          const dir = ev.key == "ArrowLeft" ? L : R
          ev.preventDefault()
          field.onBeforeChange?.()
          field.sel = this.cursor(dir).selection()
          field.onAfterChange?.(true)
          field.el.focus()
        } else {
          field.onBeforeChange?.()
        }
      })
      input.addEventListener("input", () => {
        checkSize()
        field.onAfterChange?.(false)
      })
    } else {
      input.disabled = true
    }
    function checkSize() {
      input.style.width = "0px"
      input.style.width =
        Math.max(1, input.scrollWidth - input.offsetWidth) + "px"
    }
    setTimeout(checkSize)
    const ql = h("", "“")
    const qr = h("", "”")
    super("\\text", h("inline-block relative", ql, input, qr))
    this.ql = ql
    this.qr = qr
    this.input = input
  }

  reader(): string {
    return " Text " + this.input.value + " EndText "
  }

  ascii(): string {
    return "text(" + this.input.value + ")"
  }

  latex(): string {
    return "\\text{" + toText(this.input.value) + "}"
  }

  ir(tokens: Node[]): void {
    tokens.push({ type: "text", value: this.input.value })
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards == R ? L : R)
    if (towards == R) {
      this.input.setSelectionRange(0, 0)
    } else {
      this.input.setSelectionRange(
        this.input.value.length,
        this.input.value.length,
      )
    }
    this.input.focus()
  }
}
