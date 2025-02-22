import type { Point } from "."
import type { AnyPick, Picker } from "../../pick"
import type { Sheet } from "../sheet"

export class PickHandler {
  readonly onChange: (() => void)[] = []

  constructor(readonly sheet: Sheet) {
    sheet.paper2.fns.push(() => this.draw())

    sheet.paper2.el.addEventListener(
      "pointermove",
      (event) => {
        const at = (this.lastMouse = sheet.paper2.eventToPaper(event))
        if (this.pick) {
          this.pick.found = this.pick.pick.find(this.pick.data, at, sheet)
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
        const at = (this.lastMouse = sheet.paper2.eventToPaper(event))
        if (this.pick) {
          this.pick.found = this.pick.pick.find(this.pick.data, at, sheet)
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
        const at = (this.lastMouse = sheet.paper2.eventToPaper(event))

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

          this.set(next.pick, next.data, next.pick.find(next.data, at, sheet))
        }
      },
      { capture: true },
    )

    sheet.paper2.el.addEventListener("pointerleave", () => {
      this.lastMouse = undefined
    })
  }

  private lastMouse: Point | undefined
  private pick: { pick: AnyPick; data: {}; found: {} | null } | undefined

  isActive() {
    return !!this.pick
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
        this.pick.pick.cancel(this.pick.data)
      } finally {
        this.pick = undefined
        this.sheet.paper2.queue()
        this.notify()
      }
    }
  }

  set<T extends {}, U extends {}>(
    pick: Picker<T, U>,
    data: T,
    found?: U | null,
  ) {
    if (found === undefined && this.lastMouse) {
      found = pick.find(data, this.lastMouse, this.sheet)
    }
    this.cancel()
    this.pick = { pick, data, found: found ?? null }
    this.sheet.paper2.queue()
    this.notify()
  }

  draw() {
    if (this.pick) {
      this.pick.pick.draw(this.pick.data, this.pick.found, this.sheet)
    }
  }
}
