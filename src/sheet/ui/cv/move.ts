import type { Cv } from "."
import type { Point } from "../../point"
import { Size } from "./consts"
import { Hint, type Target } from "./item"

export interface Handler {
  find(at: Point, hint: Hint): ItemWithDrawTarget | undefined
  take(item: ItemWithTarget | null): void
}

export interface ItemData<T = unknown, U = unknown> {
  data: T
  item: U
  index: number
}

export interface ItemWithTarget<T = unknown, U = unknown>
  extends ItemData<T, U> {
  target: Target<T, U>
}

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
        const point = { ...cv.eventToPaper(event) }
        if (scale < 1) {
          const origin = cv.toOffset({ x: 0, y: 0 })
          if (Math.abs(event.offsetX - origin.x) < Size.ZoomSnap) {
            point.x = 0
          }
          if (Math.abs(event.offsetY - origin.y) < Size.ZoomSnap) {
            point.y = 0
          }
        }
        cv.zoom(point, scale)
      } else {
        cv.move(
          cv.toPaperDelta({
            x: event.deltaX,
            y: event.deltaY,
          }),
        )
      }
    },
    { passive: false },
  )
}

export function registerPointerHandler(cv: Cv, handler: Handler) {
  let initial: Point | undefined
  let ptrs = 0
  let moved = false
  let current: ItemWithDrawTarget | undefined
  let dragOffset: Point | undefined
  let last: Point | undefined
  let picking: Hint | undefined
  let oc: (() => void) | undefined

  function onPointerMove(event: { offsetX: number; offsetY: number }) {
    const pt: Point = { x: event.offsetX, y: event.offsetY }
    last = pt

    if (picking && (ptrs == 0 || ptrs == 1)) {
      if (current) {
        current.target.toggle(current, false, "pick")
      }
      current = handler.find(pt, picking)
      if (current) {
        current.target.toggle(current, true, "pick")
      }
      oc?.()
      return
    }

    if (ptrs == 0) {
      const next = handler.find(pt, Hint.one())
      // TODO: optimize out the case where current and next are identical, although it doesn't unduly harm anyone
      if (current) {
        current.target.toggle(current, false, "hover")
      }
      if (next) {
        next.target.toggle(next, true, "hover")
      }
      current = next
      return
    }

    if (ptrs != 1) {
      return
    }

    if (current) {
      if (dragOffset) {
        moved = true
        current.target.drag!(
          current,
          cv.toPaperBounded({
            x: pt.x - dragOffset.x,
            y: pt.y - dragOffset.y,
          }),
        )
        return
      }

      current.target.toggle(current, false, "drag")
      current.target.toggle(current, false, "hover")
      current = undefined
      initial = cv.toPaper(pt)
    }

    if (!initial) {
      return
    }

    moved = true
    ;(document.activeElement as HTMLElement).blur?.()

    const self = cv.eventToPaper(event)

    cv.move({
      x: initial.x - self.x,
      y: initial.y - self.y,
    })
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
        last = undefined
        return
      }

      const pt: Point = (last = { x: event.offsetX, y: event.offsetY })
      moved = false

      if (picking) {
        if (current) {
          current.target.toggle(current, false, "pick")
        }
        current = handler.find(pt, picking)
        if (current) {
          current.target.toggle(current, true, "pick")
        }
        oc?.()
        return
      }

      initial = cv.toPaper(pt)

      if (current) {
        current.target.toggle(current, false, "hover")
        current = undefined
        dragOffset = undefined
      }

      const next = handler.find(pt, Hint.one())
      if (next) {
        next.target.toggle(next, true, "hover")
        const origin = next.target.dragOrigin?.(next)
        if (origin) {
          dragOffset = {
            x: event.offsetX - origin.x,
            y: event.offsetY - origin.y,
          }
          next.target.toggle(next, true, "drag")
        } else {
          dragOffset = undefined
        }
      }
      current = next
    },
    { passive: false },
  )

  function onPointerUp(event?: PointerEvent) {
    ptrs--

    if (ptrs < 0) {
      ptrs = 0
    }

    initial = undefined

    const pt: Point | undefined = event && {
      x: event.offsetX,
      y: event.offsetY,
    }

    if (picking) {
      let ret: ItemWithTarget | null = null
      if (current) {
        ;(ret = current).target.toggle(current, false, "pick")
        current = undefined
      }
      if (ptrs == 0) {
        handler.take(ret)
      }
      // Recheck `picking` since `handler.pick` may have changed it
      if (picking && pt) {
        current = handler.find(pt, picking)
        if (current) {
          current.target.toggle(current, true, "pick")
        }
      }
      oc?.()
      if (picking) {
        return
      }
    }

    if (ptrs != 0) {
      return
    }

    if (current) {
      if (dragOffset) {
        if (pt && moved) {
          current.target.drag!(
            current,
            cv.toPaperBounded({
              x: pt.x - dragOffset.x,
              y: pt.y - dragOffset.y,
            }),
          )
        }

        current.target.toggle(current, false, "drag")
      } else {
        current.target.toggle(current, false, "click")
      }

      current.target.toggle(current, false, "hover")
    }
    current = undefined
    dragOffset = undefined

    if (!pt) return

    const next = handler.find(pt, Hint.one())
    if (next) {
      next.target.toggle(next, true, "hover")
    }
    current = next
    dragOffset = undefined
  }

  function onPointerLeave() {
    if (picking && current) {
      current.target.toggle(current, false, "pick")
      current = undefined
      oc?.()
    }
  }

  addEventListener("pointerup", onPointerUp)
  cv.el.addEventListener("pointerleave", onPointerLeave)
  addEventListener("pointerleave", () => (last = undefined))
  addEventListener("contextmenu", () => onPointerUp())

  return {
    get picking() {
      return picking
    },
    set picking(v) {
      if (!v && !picking) {
        return
      }

      if (current) {
        if (picking) {
          current.target.toggle(current, false, "pick")
        } else {
          if (dragOffset) {
            current.target.toggle(current, false, "drag")
            dragOffset = undefined
          }
          current.target.toggle(current, false, "hover")
        }

        current = undefined
        moved = false
      }

      picking = v

      if (v) {
        if (last) {
          current = handler.find(last, v)
          if (current) {
            current.target.toggle(current, true, "pick")
          }
        }
      } else {
        if (last) {
          const next = handler.find(last, Hint.one())
          if (next) {
            next.target.toggle(next, true, "hover")
            if (ptrs) {
              const origin = next.target.dragOrigin?.(next)
              if (origin) {
                dragOffset = { x: last.x - origin.x, y: last.y - origin.y }
                next.target.toggle(next, true, "drag")
              } else {
                dragOffset = undefined
              }
            }
          }
          current = next
        }
      }

      oc?.()
    },
    get oc(): undefined {
      return
    },
    set oc(v: () => void) {
      oc = v
    },
    get picked() {
      return picking && current
    },
  }
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
    const center = cv.toPaper({ x: xCenter, y: yCenter })

    if (distance > previousDistance) {
      cv.zoom(center, 0.9)
    } else {
      cv.zoom(center, 1.1)
    }

    previousDistance = distance
  })
}
