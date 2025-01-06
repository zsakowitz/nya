import { Leaf } from "."
import { h } from "../../jsx"
import { L, R, type Cursor } from "../../model"
import { CmdVar } from "./var"

export class CmdDot extends Leaf {
  static init(cursor: Cursor) {
    new CmdDot().insertAt(cursor, L)
  }

  constructor() {
    super(",", h("nya-cmd-dot", "."))
    this.render()
  }

  render() {
    const l = this[L] instanceof CmdDot
    const r = this[R] instanceof CmdDot
    const prop = !l && this[R] instanceof CmdVar

    this.setEl(
      h(
        "nya-cmd-dot" +
          (l && !r && this[R] ? " nya-cmd-dot-r" : "") +
          (r && !l && this[L] ? " nya-cmd-dot-l" : "") +
          (prop ? " nya-cmd-dot-prop" : ""),
        ".",
      ),
    )
  }

  onSiblingChange(): void {
    this.render()
  }

  reader(): string {
    return " comma "
  }

  ascii(): string {
    return ","
  }

  latex(): string {
    return ","
  }
}
