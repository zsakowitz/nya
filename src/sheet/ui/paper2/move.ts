import type { Paper2, Point } from "."

const SNAP_DISTANCE = 16

export function registerWheelHandler(paper: Paper2) {
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

export function registerDragHandler(paper: Paper2) {
  let initial: Point | undefined
  let ptrs = 0

  paper.el.addEventListener(
    "pointermove",
    (event) => {
      event.preventDefault()

      if (ptrs != 1) {
        return
      }

      if (!initial) {
        return
      }

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
      initial = paper.eventToPaper(event)
      paper.el.setPointerCapture(event.pointerId)
    },
    { passive: false },
  )

  function onPointerUp() {
    ptrs--

    if (ptrs < 0) {
      ptrs = 0
    }

    initial = undefined
  }

  addEventListener("pointerup", onPointerUp)
  addEventListener("contextmenu", onPointerUp)
}

export function registerPinchHandler(paper: Paper2) {
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
