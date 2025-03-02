import type { Paper, Point } from "."
import { HANDLER_DRAG, HANDLER_PICK, type DragFn } from "./interact"

const SNAP_DISTANCE = 16

export function registerWheelHandler(paper: Paper) {
  paper.el.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault()
      if (event.metaKey || event.ctrlKey) {
        const scale =
          1 + Math.sign(event.deltaY) * Math.sqrt(Math.abs(event.deltaY)) * 0.03
        const point = { ...paper.eventToPaper(event) }
        if (scale < 1) {
          const origin = paper.toOffset({ x: 0, y: 0 })
          if (Math.abs(event.offsetX - origin.x) < SNAP_DISTANCE) {
            point.x = 0
          }
          if (Math.abs(event.offsetY - origin.y) < SNAP_DISTANCE) {
            point.y = 0
          }
        }
        paper.zoom(point, scale)
      } else {
        paper.move(
          paper.toPaperDelta({
            x: event.deltaX,
            y: event.deltaY,
          }),
        )
      }
    },
    { passive: false },
  )
}

export function registerDragHandler(paper: Paper) {
  let initial: Point | undefined
  let ptrs = 0
  let drag: DragFn | undefined
  let didMove = false

  paper.el.addEventListener(
    "pointermove",
    (event) => {
      event.preventDefault()

      if (ptrs != 1) {
        return
      }

      if (drag) {
        drag(paper.eventToPaper(event), false)
        return
      }

      if (!initial) {
        return
      }

      didMove = true
      ;(document.activeElement as HTMLElement).blur?.()

      const self = paper.eventToPaper(event)

      paper.move({
        x: initial.x - self.x,
        y: initial.y - self.y,
      })
    },
    { passive: false },
  )

  paper.el.addEventListener(
    "pointerdown",
    (event) => {
      ptrs++
      paper.el.setPointerCapture(event.pointerId)
      const at = paper.eventToPaper(event)
      didMove = false
      initial = at

      for (const el of event.composedPath()) {
        const fn = HANDLER_DRAG.get(el as SVGElement)
        if (fn) {
          const props = fn(at)
          if (props) {
            drag = props
            break
          }
        }
      }

      for (const el of event.composedPath()) {
        const fn = HANDLER_PICK.get(el as SVGElement)
        if (fn) {
          fn.focus()
          return
        }
      }
    },
    { passive: false },
  )

  paper.el.addEventListener("click", (event) => {
    initial = undefined

    for (const el of event.composedPath()) {
      const fn = HANDLER_PICK.get(el as SVGElement)
      if (!didMove && fn) {
        fn.focus()
        return
      }
    }
  })

  function onPointerUp(event?: PointerEvent) {
    ptrs--

    if (ptrs < 0) {
      ptrs = 0
    }

    if (drag) {
      if (didMove && event) {
        try {
          drag(paper.eventToPaper(event), true)
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

export function registerPinchHandler(paper: Paper) {
  let previousDistance: number | undefined

  paper.el.addEventListener("touchmove", (event) => {
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

    const { x, y } = paper.el.getBoundingClientRect()

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
    const center = paper.toPaper({ x: xCenter, y: yCenter })

    if (distance > previousDistance) {
      paper.zoom(center, 0.9)
    } else {
      paper.zoom(center, 1.1)
    }

    previousDistance = distance
  })
}
