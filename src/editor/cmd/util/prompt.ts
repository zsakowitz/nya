import { h, hx } from "../../jsx"
import { L, type Cursor, type InitProps, type InitRet } from "../../model"
import type { Options } from "../../options"
import { Leaf } from "../leaf"

export class CmdPrompt extends Leaf {
  static init(cursor: Cursor, { options }: InitProps): InitRet {
    new CmdPrompt(options).insertAt(cursor, L)
  }

  constructor(readonly options: Options) {
    const field = hx("input", "bg-transparent min-w-[3ch] focus:outline-none")
    function resize() {
      field.style.width = "0"
      field.style.width = field.scrollWidth + "px"
    }
    field.addEventListener("keydown", (event) => {
      event.stopPropagation()
    })
    field.addEventListener("input", resize)
    resize()
    field.focus()
    field.addEventListener("blur", () => {
      this.remove()
    })
    super("\\text{typing...}", h("bg-slate-200 nya-cmd-prompt", "\\", field))
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
}
