import type { Paper2, Point } from "."

export function registerWheelHandler(paper: Paper2) {
  paper.el.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault()
      if (event.metaKey || event.ctrlKey) {
        paper.zoom(
          paper.eventToPaper(event),
          1 +
            Math.sign(event.deltaY) * Math.sqrt(Math.abs(event.deltaY)) * 0.03,
        )
      } else {
        paper.move(
          paper.offsetDeltaToPaper({
            x: 2 * event.deltaX,
            y: 2 * event.deltaY,
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
    const center = paper.offsetToPaper({ x: xCenter, y: yCenter })

    if (distance > previousDistance) {
      paper.zoom(center, 0.9)
    } else {
      paper.zoom(center, 1.1)
    }

    previousDistance = distance
  })
}
