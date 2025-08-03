import { Point, px } from "@/lib/point"
import type { Cv } from "."
import { Size } from "./consts"

export interface Handler {
  take(item: ItemWithTarget | null): void
}

export interface ItemData<T = unknown, U = unknown> {
  data: T
  item: U
  index: number
}

export interface ItemWithTarget<T = unknown, U = unknown>
  extends ItemData<T, U> {}

export type ItemWithDrawTarget<T = unknown, U = unknown> = ItemWithTarget<
  T,
  U
> & {
  target: { draw?(item: ItemData<T, U>, picked: boolean): void }
  virtualPoint?: Point
}

export type VirtualPoint = ItemWithDrawTarget & { virtualPoint: Point }

export function registerWheelHandler(cv: Cv) {
  cv.el.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault()
      if (event.metaKey || event.ctrlKey) {
        const scale =
          1 + Math.sign(event.deltaY) * Math.sqrt(Math.abs(event.deltaY)) * 0.03
        let { x, y } = cv.eventToPaper(event)
        if (scale < 1) {
          const origin = cv.toOffset(px(0, 0))
          if (Math.abs(event.offsetX - origin.x) < Size.ZoomSnap) {
            x = 0
          }
          if (Math.abs(event.offsetY - origin.y) < Size.ZoomSnap) {
            y = 0
          }
        }
        cv.zoom(px(x, y), scale)
      } else {
        cv.move(cv.toPaperDelta(px(event.deltaX, event.deltaY)))
      }
    },
    { passive: false },
  )
}

export function registerPointerHandler(cv: Cv) {
  let initial: Point | undefined
  let ptrs = 0

  function onPointerMove(event: { offsetX: number; offsetY: number }) {
    if (!initial) {
      return
    }

    ;(document.activeElement as HTMLElement).blur?.()
    const self = cv.eventToPaper(event)
    cv.move(px(initial.x - self.x, initial.y - self.y))
  }

  cv.el.addEventListener("pointermove", onPointerMove, { passive: true })
  cv.el.addEventListener("wheel", onPointerMove, { passive: true })

  cv.el.addEventListener(
    "pointerdown",
    (event) => {
      event.preventDefault()

      ptrs++
      cv.el.setPointerCapture(event.pointerId)
      if (ptrs != 1) {
        return
      }

      const pt: Point = px(event.offsetX, event.offsetY)
      initial = cv.toPaper(pt)
    },
    { passive: false },
  )

  function onPointerUp(_event?: PointerEvent) {
    ptrs--

    if (ptrs < 0) {
      ptrs = 0
    }

    initial = undefined

    if (ptrs != 0) {
      return
    }
  }

  addEventListener("pointerup", onPointerUp)
  addEventListener("contextmenu", () => onPointerUp())
}

export type PointerHandlerRet = ReturnType<typeof registerPointerHandler>

export function registerPinchHandler(cv: Cv) {
  let previousDistance: number | undefined

  cv.el.addEventListener("touchmove", (event) => {
    event.preventDefault()

    const { touches } = event
    const a = touches[0]
    const b = touches[1]
    const c = touches[2]

    if (!a || c) {
      return
    }

    if (!b) {
      return
    }

    const { x, y } = cv.el.getBoundingClientRect()

    const distance = Math.hypot(
      b.clientX - a.clientX,
      (b.clientY - a.clientY) ** 2,
    )

    if (!previousDistance) {
      previousDistance = distance
      return
    }

    const xCenter = (a.clientX + b.clientX) / 2 - x
    const yCenter = (a.clientY + b.clientY) / 2 - y
    const center = cv.toPaper(px(xCenter, yCenter))

    if (distance > previousDistance) {
      cv.zoom(center, 0.9)
    } else {
      cv.zoom(center, 1.1)
    }

    previousDistance = distance
  })
}
