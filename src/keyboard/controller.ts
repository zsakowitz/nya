import { h } from "@/jsx"
import { CONTROLS, keyFrom, LAYOUT_NUM, type Layout } from "./layout"

export class KeyboardController {
  readonly hi
  readonly lo
  readonly el

  constructor() {
    this.el = h(
      "fixed bottom-0 right-0 w-[300px] grid grid-cols-[repeat(40,1fr)] gap-1 p-2 bg-[--nya-kbd-bg] [line-height:1] whitespace-nowrap z-10 select-none",

      (this.hi = h("contents")),
      keyFrom(CONTROLS.shift),
      keyFrom(1),
      (this.lo = h("contents")),
      keyFrom(1),
      keyFrom(CONTROLS.backspace),

      keyFrom(CONTROLS.abc),
      keyFrom(CONTROLS.sym),
      keyFrom(1),
      keyFrom(CONTROLS.arrowL),
      keyFrom(CONTROLS.arrowR),
      keyFrom(CONTROLS.cursor),
      keyFrom(CONTROLS.opts),
      keyFrom(1),
      keyFrom(CONTROLS.enter),
    )

    this.show(LAYOUT_NUM)
  }

  show(layout: Layout) {
    this.hi.replaceChildren(...layout.hi.map(keyFrom))
    this.lo.replaceChildren(...layout.lo.map(keyFrom))
  }
}
