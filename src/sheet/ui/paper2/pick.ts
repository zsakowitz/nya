import type { AnyPick2, Picker2 } from "../../pick2"
import type { Sheet } from "../sheet"

export class PickHandler {
  constructor(readonly sheet: Sheet) {
    sheet.paper2.fns.push(() => this.draw())

    sheet.paper2.el.addEventListener(
      "pointermove",
      (event) => {
        if (this.pick) {
          this.pick.found = this.pick.pick.find(
            this.pick.data,
            sheet.paper2.eventToPaper(event),
            sheet,
          )
          this.sheet.paper2.queue()
          event.stopImmediatePropagation()
        }
      },
      { capture: true },
    )

    let isDown = false

    sheet.paper2.el.addEventListener(
      "pointerdown",
      (event) => {
        if (this.pick) {
          this.pick.found = this.pick.pick.find(
            this.pick.data,
            sheet.paper2.eventToPaper(event),
            sheet,
          )
          this.sheet.paper2.queue()
          event.stopImmediatePropagation()
          isDown = true
          sheet.paper2.el.setPointerCapture(event.pointerId)
        }
      },
      { capture: true },
    )

    sheet.paper2.el.addEventListener(
      "pointerup",
      (event) => {
        if (!isDown) return

        isDown = false

        if (this.pick) {
          const found = this.pick.pick.find(
            this.pick.data,
            sheet.paper2.eventToPaper(event),
            sheet,
          )
          if (found == null) {
            this.cancel()
            return
          }

          const next = this.pick.pick.select(this.pick.data, found, this.sheet)
          if (next == null) {
            this.cancel()
            return
          }

          this.set(
            next.pick,
            next.data,
            next.pick.find(next.data, sheet.paper2.eventToPaper(event), sheet),
          )
        }
      },
      { capture: true },
    )
  }

  private pick: { pick: AnyPick2; data: {}; found: {} | null } | undefined

  isActive() {
    return !!this.pick
  }

  cancel() {
    if (this.pick) {
      try {
        this.pick.pick.cancel(this.pick.data)
      } finally {
        this.pick = undefined
        this.sheet.paper2.queue()
      }
    }
  }

  set<T extends {}, U extends {}>(
    pick: Picker2<T, U>,
    data: T,
    found: U | null = null,
  ) {
    this.cancel()
    this.pick = { pick, data, found }
    this.sheet.paper2.queue()
  }

  draw() {
    if (this.pick) {
      this.pick.pick.draw(this.pick.data, this.pick.found, this.sheet)
    }
  }
}
