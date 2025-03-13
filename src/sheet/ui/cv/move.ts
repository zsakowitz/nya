import type { Cv } from "."
import type { Point } from "../../point"
import type { Hint, Target } from "./item"

const SNAP_DISTANCE = 16

type DragFn = (point: Point, done: boolean) => void

export interface Handler {
  find(at: Point, hint: Hint): TargetItem[]
}

export interface TargetItem<T = unknown, U = unknown> {
  target: Target<T, U>
  data: T
  item: U
  index: number
}

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
          if (Math.abs(event.offsetX - origin.x) < SNAP_DISTANCE) {
            point.x = 0
          }
          if (Math.abs(event.offsetY - origin.y) < SNAP_DISTANCE) {
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
  let drag: DragFn | undefined
  let didMove = false

  cv.el.addEventListener(
    "pointermove",
    (event) => {
      event.preventDefault()

      if (ptrs != 1) {
        return
      }

      const [found] = handler.find(
        { x: event.offsetX, y: event.offsetY },
        { limit: 1, tys: undefined },
      )

      if (found) {
        found.target.toggle(found, true, "hover")
      }

      if (drag) {
        drag(cv.eventToPaper(event), false)
        return
      }

      if (!initial) {
        return
      }

      didMove = true
      ;(document.activeElement as HTMLElement).blur?.()

      const self = cv.eventToPaper(event)

      cv.move({
        x: initial.x - self.x,
        y: initial.y - self.y,
      })
    },
    { passive: false },
  )

  cv.el.addEventListener(
    "pointerdown",
    (event) => {
      ptrs++
      cv.el.setPointerCapture(event.pointerId)
      const at = cv.eventToPaper(event)
      didMove = false
      initial = at

      // TODO: make sure drag and pick handlers work
      //
      // for (const el of event.composedPath()) {
      //   const fn = HANDLER_DRAG.get(el as SVGElement)
      //   if (fn) {
      //     const props = fn(at)
      //     if (props) {
      //       drag = props
      //       break
      //     }
      //   }
      // }
      //
      // for (const el of event.composedPath()) {
      //   const fn = HANDLER_PICK.get(el as SVGElement)
      //   if (fn) {
      //     fn.focus()
      //     return
      //   }
      // }
    },
    { passive: false },
  )

  // TODO: click handler

  function onPointerUp(event?: PointerEvent) {
    ptrs--

    if (ptrs < 0) {
      ptrs = 0
    }

    if (drag) {
      if (didMove && event) {
        try {
          drag(cv.eventToPaper(event), true)
        } catch (e) {
          console.warn("[paper.drag]", e)
        }
      }
      drag = undefined
    }

    initial = undefined
  }

  addEventListener("pointerup", onPointerUp)
  addEventListener("contextmenu", () => onPointerUp())
}

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
