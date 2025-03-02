import type { Point } from "."
import type { AnyPick, Picker } from "../../pick"
import type { Sheet } from "../sheet"

export class PickHandler {
  readonly onChange: (() => void)[] = []

  constructor(readonly sheet: Sheet) {
    sheet.paper.fns.push(() => this.draw())

    sheet.paper.el.addEventListener(
      "pointermove",
      (event) => {
        this.pointer = sheet.paper.eventToPaper(event)
        if (this.pick) {
          this.sheet.paper.queue()
          event.stopImmediatePropagation()
        }
      },
      { capture: true },
    )

    let isDown = false

    sheet.paper.el.addEventListener(
      "pointerdown",
      (event) => {
        this.pointer = sheet.paper.eventToPaper(event)
        if (this.pick) {
          this.sheet.paper.queue()
          event.stopImmediatePropagation()
          isDown = true
          sheet.paper.el.setPointerCapture(event.pointerId)
        }
      },
      { capture: true },
    )

    sheet.paper.el.addEventListener(
      "pointerup",
      (event) => {
        const at = (this.pointer = sheet.paper.eventToPaper(event))

        if (!isDown) return

        isDown = false

        if (this.pick) {
          const found = this.pick.pick.find(this.pick.data, at, sheet)
          if (found == null) {
            this.cancel()
            return
          }

          const next = this.pick.pick.select(this.pick.data, found, this.sheet)
          if (next == null) {
            this.cancel()
            return
          }

          this.set(next.pick, next.data)
        }
      },
      { capture: true },
    )

    sheet.paper.el.addEventListener("pointerleave", () => {
      this.pointer = undefined
    })
  }

  private pointer: Point | undefined
  private pick: { pick: AnyPick; data: {}; found: {} | null } | undefined

  isActive() {
    return !!this.pick
  }

  get data() {
    return this.pick?.data
  }

  get id() {
    return this.pick?.pick.id(this.pick.data) ?? null
  }

  private notify() {
    for (const fn of this.onChange) {
      try {
        fn()
      } catch (e) {
        console.warn("[pick.notify]", e)
      }
    }
  }

  cancel() {
    if (this.pick) {
      try {
        this.pick.pick.cancel(this.pick.data, this.sheet)
      } finally {
        this.pick = undefined
        this.sheet.paper.queue()
        this.notify()
      }
    }
  }

  set<T extends {}, U extends {}>(pick: Picker<T, U>, data: T) {
    this.cancel()
    pick.init(data, this.sheet)
    this.pick = { pick, data, found: null }
    this.sheet.paper.queue()
    this.notify()
  }

  draw() {
    if (this.pick) {
      if (this.pointer) {
        this.pick.found = this.pick.pick.find(
          this.pick.data,
          this.pointer,
          this.sheet,
        )
      } else {
        this.pick.found = null
      }

      this.pick.pick.draw(this.pick.data, this.pick.found, this.sheet)
    }
  }
}
