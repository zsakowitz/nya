import { L } from "@/field/dir"
import { Field } from "@/field/field"
import { Block, Command } from "@/field/model"
import { h } from "@/jsx"
import {
  CANCEL_CHANGES,
  CONTROLS,
  keyFrom,
  NUM,
  type ActionKey,
  type Key,
  type KeyAction,
  type Layout,
} from "./layout"

function handle(key: Key, ev: () => void) {
  const el = keyFrom(key)
  el.addEventListener("click", ev)
  return el
}

export class KeyboardController {
  readonly hi
  readonly lo
  readonly el

  constructor(readonly field: () => Field) {
    this.el = h(
      "fixed bottom-0 right-0 w-full grid grid-cols-[repeat(40,1fr)] gap-1 p-2 bg-[--nya-kbd-bg] [line-height:1] whitespace-nowrap z-10 select-none",

      (this.hi = h("contents")),
      keyFrom(CONTROLS.shift),
      keyFrom(1),
      (this.lo = h("contents")),
      keyFrom(1),
      handle(CONTROLS.backspace, () => this.execKey(CONTROLS.backspace)),

      keyFrom(CONTROLS.abc),
      keyFrom(CONTROLS.sym),
      keyFrom(1),
      handle(CONTROLS.arrowL, () => this.execKey(CONTROLS.arrowL)),
      handle(CONTROLS.arrowR, () => this.execKey(CONTROLS.arrowR)),
      keyFrom(CONTROLS.cursor),
      keyFrom(CONTROLS.opts),
      keyFrom(1),
      keyFrom(CONTROLS.enter),
    )

    this.el.addEventListener("pointerdown", (e) => {
      e.preventDefault()
    })

    this.el.addEventListener("click", () => {
      this.field().el.focus()
    })

    this.show(NUM)
  }

  exec(action: KeyAction) {
    const f = this.field()

    if (typeof action == "string") {
      f.type(action)
      return
    }

    f.onBeforeChange()

    let wasChangeCanceled = false

    try {
      const ret = action(f)

      if (ret == CANCEL_CHANGES) {
        wasChangeCanceled = true
      } else if (typeof ret == "string") {
        f.type(ret, { skipChangeHandlers: true })
      } else if (ret instanceof Block || ret instanceof Command) {
        ret.insertAt(f.sel.remove(), L)
      }
    } finally {
      f.onAfterChange(wasChangeCanceled)
    }
  }

  execKey(key: ActionKey) {
    if (typeof key == "string") {
      this.exec(key)
    } else if (typeof key == "object" && key) {
      const action = key.action ?? key.latex
      if (action) this.exec(action)
    }
  }

  show(layout: Layout) {
    this.hi.replaceChildren(
      ...layout.hi.map((key) => handle(key, () => this.execKey(key))),
    )

    this.lo.replaceChildren(
      ...layout.lo.map((key) => handle(key, () => this.execKey(key))),
    )
  }
}
