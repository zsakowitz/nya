import { hx } from "../../jsx"
import { onTheme, theme } from "../theme"

const THEME_MAIN_AXIS_WIDTH = 1.5
const THEME_MAJOR_LINE_ALPHA = 0.3
const THEME_MINOR_LINE_ALPHA = 0.1

const THEME_AXIS_NUMBER_SIZE = 0.875
const THEME_AXIS_NUMBER_STROKE_COLOR = () =>
  theme("--nya-paper-axis-number-stroke", "white")
const THEME_AXIS_NUMBER_STROKE_WIDTH = 4
const THEME_AXIS_NUMBER_ONSCREEN = () =>
  theme("--nya-paper-axis-number-onscreen", "black")
const THEME_AXIS_NUMBER_OFFSCREEN = () =>
  theme("--nya-paper-axis-number-offscreen", "#8e8e8e")
const THEME_AXIS_NUMBER_NEGATIVE_X_OFFSET = -2.5
const THEME_AXIS_STROKE = () => theme("--nya-paper-screen-line", "black")

const THEME_ZOOM_ZERO_SNAP_DISTANCE = 16
const MAX_GRIDLINES_MAJOR = 200
const MAX_GRIDLINES_MINOR = MAX_GRIDLINES_MAJOR * 5
// const THEME_MINIMUM_WIDTH = 10 ** -10
// const THEME_MAXIMUM_WIDTH = 10 ** 30
//
// const THEME_COLOR_RED = "#c74440"
// const THEME_COLOR_BLUE = "#2d70b3"
// const THEME_COLOR_GREEN = "#388c46"
// const THEME_COLOR_ORANGE = "#fa7e19"
// const THEME_COLOR_PURPLE = "#6042a6"
// const THEME_COLOR_BLACK = "#000000"
//
// const THEME_DIRECT_XY_RESOLUTION = 0.1
// const THEME_DIRECT_XY_MAX_DISTANCE = 128

export interface Bounds {
  readonly xmin: number
  readonly w: number
  readonly ymin: number
  readonly h: number
}

export interface Point {
  readonly x: number
  readonly y: number
}

export class Paper {
  readonly el = hx("canvas")
  readonly ctx = this.el.getContext("2d")!
  readonly drawFns: ((paper: Paper) => void)[] = []

  scale = 0

  constructor(
    public rawBounds: Bounds = {
      xmin: -10.2,
      w: 20.4,
      ymin: -10.2,
      h: 20.4,
    },
    public autofit = true,
  ) {
    onTheme(() => this.queue())
  }

  bounds(): Bounds {
    if (this.autofit) {
      const { xmin, w, ymin, h } = this.rawBounds
      const ymid = ymin + h / 2
      const ydiff = ((this.el.height / this.el.width) * w) / 2

      return {
        xmin,
        w,
        ymin: ymid - ydiff,
        h: 2 * ydiff,
      }
    } else {
      return this.rawBounds
    }
  }

  offsetToPaper(offset: Point): Point {
    const px = offset.x / this.el.offsetWidth
    const py = offset.y / this.el.offsetHeight
    const { xmin, w, ymin, h } = this.bounds()
    return {
      x: xmin + w * px,
      y: ymin + h * (1 - py),
    }
  }

  paperToCanvas({ x, y }: Point): Point {
    const { xmin, w, ymin, h } = this.bounds()
    return {
      x: ((x - xmin) / w) * this.el.width,
      y: (1 - (y - ymin) / h) * this.el.height,
    }
  }

  paperToOffset({ x, y }: Point): Point {
    const { xmin, w, ymin, h } = this.bounds()
    return {
      x: ((x - xmin) / w) * this.el.clientWidth,
      y: (1 - (y - ymin) / h) * this.el.clientHeight,
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    for (const fn of this.drawFns) {
      fn(this)
    }
  }

  eventToPaper(event: { offsetX: number; offsetY: number }) {
    return this.offsetToPaper({ x: event.offsetX, y: event.offsetY })
  }

  canvasDistance(a: Point, b: Point) {
    // TODO: optimize by not going through xmin and ymin
    const pa = this.paperToCanvas(a)
    const pb = this.paperToCanvas(b)
    return Math.hypot(pa.x - pb.x, pa.y - pb.y)
  }

  shift(by: Point) {
    const { xmin, w, ymin, h } = this.rawBounds
    this.rawBounds = {
      xmin: xmin + by.x,
      ymin: ymin + by.y,
      w,
      h,
    }
    this.queue()
  }

  zoom(target: Point, scale: number) {
    const { xmin, w, ymin, h } = this.rawBounds

    const xCenter = xmin + w / 2
    const yCenter = ymin + h / 2
    const xAdj = (target.x - xCenter) * (1 - scale) + xCenter
    const yAdj = (target.y - yCenter) * (1 - scale) + yCenter

    const xmin2 = scale * (xmin - xCenter) + xAdj
    const ymin2 = scale * (ymin - yCenter) + yAdj
    const w2 = scale * w
    const h2 = scale * h

    const ew = 1e-12 * Math.max(Math.abs(xmin2), Math.abs(xmin2 + w2))
    const eh = 1e-12 * Math.max(Math.abs(ymin2), Math.abs(ymin2 + h2))
    if (w2 <= ew || h2 <= eh || w2 >= 1e300 || h2 >= 1e300) {
      return
    }

    this.rawBounds = {
      xmin: xmin2,
      w: w2,
      ymin: ymin2,
      h: h2,
    }
    this.queue()
  }

  private queued = false

  queue() {
    if (this.queued) return
    requestAnimationFrame(() => {
      this.queued = false
      this.draw()
    })
  }

  moveTo(pt: Point) {
    const { x, y } = this.paperToCanvas(pt)
    this.ctx.moveTo(x, y)
  }

  lineTo(pt: Point) {
    const { x, y } = this.paperToCanvas(pt)
    this.ctx.lineTo(x, y)
  }

  circle(pt: Point, r: number) {
    const { x, y } = this.paperToCanvas(pt)
    const { w, h } = this.bounds()
    const rx = (r / w) * this.el.width
    const ry = (r / h) * this.el.height
    this.ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI)
  }
}

export function matchSize(paper: Paper) {
  function resize() {
    const scale = globalThis.devicePixelRatio ?? 1
    paper.scale = scale
    paper.el.width = paper.el.clientWidth * scale
    paper.el.height = paper.el.clientHeight * scale
    paper.draw()
  }

  resize()
  new ResizeObserver(resize).observe(paper.el)
}

export function createDrawAxes(paper: Paper) {
  const ctx = paper.ctx

  function scale() {
    return globalThis.devicePixelRatio ?? 1
  }

  function paperToCanvas(x: number, y: number) {
    return paper.paperToCanvas({ x, y })
  }

  function drawScreenLineX(x: number, w: number) {
    ctx.strokeStyle = THEME_AXIS_STROKE()
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, paper.el.height)
    ctx.stroke()
  }

  function drawScreenLineY(y: number, h: number) {
    ctx.strokeStyle = THEME_AXIS_STROKE()
    ctx.lineWidth = h
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(paper.el.width, y)
    ctx.stroke()
  }

  function drawAxes() {
    ctx.beginPath()
    ctx.globalAlpha = 1
    const { x, y } = paperToCanvas(0, 0)
    drawScreenLineX(x, THEME_MAIN_AXIS_WIDTH * scale())
    drawScreenLineY(y, THEME_MAIN_AXIS_WIDTH * scale())
  }

  function getGridlineSize(graphSize: number, canvasSize: number) {
    const MIN_GRIDLINE_SIZE = 16 * scale()

    const graphUnitsInGridlineSize =
      (MIN_GRIDLINE_SIZE * graphSize) / canvasSize

    const exp = 10 ** Math.floor(Math.log10(graphUnitsInGridlineSize))
    const mantissa = graphUnitsInGridlineSize / exp
    if (mantissa < 2) {
      return { minor: 2 * exp, major: 10 * exp }
    } else if (mantissa < 4) {
      return { minor: 5 * exp, major: 20 * exp }
    } else {
      return { minor: 10 * exp, major: 50 * exp }
    }
  }

  function drawGridlinesX() {
    const { xmin, w } = paper.bounds()
    const { minor, major } = getGridlineSize(w, paper.el.width)

    ctx.strokeStyle = THEME_AXIS_STROKE()
    ctx.lineWidth = scale()

    ctx.beginPath()
    ctx.globalAlpha = THEME_MAJOR_LINE_ALPHA
    const majorStart = Math.floor(xmin / major) * major
    const majorEnd = Math.ceil((xmin + w) / major) * major
    for (
      let line = majorStart, i = 0;
      line < majorEnd && i < MAX_GRIDLINES_MAJOR;
      line += major, i++
    ) {
      const { x } = paperToCanvas(line, 0)
      drawScreenLineX(x, scale())
    }

    ctx.beginPath()
    ctx.globalAlpha = THEME_MINOR_LINE_ALPHA
    const minorStart = Math.floor(xmin / minor) * minor
    const minorEnd = Math.ceil((xmin + w) / minor) * minor
    for (
      let line = minorStart, i = 0;
      line < minorEnd && i < MAX_GRIDLINES_MINOR;
      line += minor, i++
    ) {
      const { x } = paperToCanvas(line, 0)
      drawScreenLineX(x, 1 * scale())
    }

    ctx.globalAlpha = 1
  }

  function drawGridlinesY() {
    const { ymin, h } = paper.bounds()
    const { minor, major } = getGridlineSize(h, paper.el.height)

    ctx.strokeStyle = THEME_AXIS_STROKE()
    ctx.lineWidth = scale()

    ctx.beginPath()
    ctx.globalAlpha = THEME_MAJOR_LINE_ALPHA
    const majorStart = Math.floor(ymin / major) * major
    const majorEnd = Math.ceil((ymin + h) / major) * major
    for (
      let line = majorStart, i = 0;
      line < majorEnd && i < MAX_GRIDLINES_MAJOR;
      line += major, i++
    ) {
      const { y } = paperToCanvas(0, line)
      drawScreenLineY(y, 1 * scale())
    }

    ctx.beginPath()
    ctx.globalAlpha = THEME_MINOR_LINE_ALPHA
    const minorStart = Math.floor(ymin / minor) * minor
    const minorEnd = Math.ceil((ymin + h) / minor) * minor
    for (
      let line = minorStart, i = 0;
      line < minorEnd && i < MAX_GRIDLINES_MINOR;
      line += minor, i++
    ) {
      const { y } = paperToCanvas(0, line)
      drawScreenLineY(y, 1 * scale())
    }

    ctx.globalAlpha = 1
  }

  function superscript(value: string): string {
    return value
      .replace(/-/g, "⁻")
      .replace(/0/g, "⁰")
      .replace(/1/g, "¹")
      .replace(/2/g, "²")
      .replace(/3/g, "³")
      .replace(/4/g, "⁴")
      .replace(/5/g, "⁵")
      .replace(/6/g, "⁶")
      .replace(/7/g, "⁷")
      .replace(/8/g, "⁸")
      .replace(/9/g, "⁹")
  }

  function toString(value: number): string {
    if (Math.abs(value) <= 0.0001 || Math.abs(value) >= 10 ** 8) {
      const exp = Math.floor(Math.log10(Math.abs(value)))
      const mantissa = value / 10 ** exp

      return `${(+mantissa.toPrecision(15)).toString()}×10${superscript(
        exp.toString(),
      )}`
    } else {
      return (+value.toPrecision(15)).toString()
    }
  }

  function drawAxisNumbersX() {
    const { xmin, w } = paper.bounds()
    const { major } = getGridlineSize(w, paper.el.width)

    ctx.beginPath()

    ctx.strokeStyle = THEME_AXIS_NUMBER_STROKE_COLOR()
    ctx.lineWidth = THEME_AXIS_NUMBER_STROKE_WIDTH * scale()
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.font = `${THEME_AXIS_NUMBER_SIZE * scale()}rem sans-serif`

    const majorStart = Math.floor(xmin / major)
    const majorEnd = Math.ceil((xmin + w) / major)

    const zeroMetrics = ctx.measureText("0")
    const letterSize =
      zeroMetrics.fontBoundingBoxDescent - zeroMetrics.fontBoundingBoxAscent

    const { y } = paperToCanvas(0, 0)

    const pos =
      y + 7.5 * scale() + letterSize > paper.el.height ? "bottom"
      : y + 1.5 * scale() < 0 ? "top"
      : "middle"

    if (pos == "middle") {
      ctx.fillStyle = THEME_AXIS_NUMBER_ONSCREEN()
    } else {
      ctx.fillStyle = THEME_AXIS_NUMBER_OFFSCREEN()

      if (pos == "bottom") {
        ctx.textBaseline = "bottom"
      }
    }

    for (
      let line = majorStart, i = 0;
      line < majorEnd && i < MAX_GRIDLINES_MAJOR;
      line++, i++
    ) {
      if (line == 0) {
        continue
      }

      const value = toString(line * major)
      let { x } = paperToCanvas(line * major, 0)
      if (line * major < 0) {
        x += THEME_AXIS_NUMBER_NEGATIVE_X_OFFSET * scale()
      }

      if (pos == "bottom") {
        ctx.strokeText(value, x, paper.el.height - 3 * scale())
        ctx.fillText(value, x, paper.el.height - 3 * scale())
      } else if (pos == "top") {
        ctx.strokeText(value, x, 3 * scale())
        ctx.fillText(value, x, 3 * scale())
      } else {
        ctx.strokeText(value, x, y + 3 * scale())
        ctx.fillText(value, x, y + 3 * scale())
      }
    }
  }

  function drawAxisNumbersY() {
    const { ymin, h } = paper.bounds()
    const { major } = getGridlineSize(h, paper.el.height)

    ctx.beginPath()

    ctx.strokeStyle = THEME_AXIS_NUMBER_STROKE_COLOR()
    ctx.lineWidth = THEME_AXIS_NUMBER_STROKE_WIDTH * scale()
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.font = `${THEME_AXIS_NUMBER_SIZE * scale()}rem sans-serif`

    const majorStart = Math.floor(ymin / major)
    const majorEnd = Math.ceil((ymin + h) / major)

    for (
      let line = majorStart, i = 0;
      line < majorEnd && i < MAX_GRIDLINES_MAJOR;
      line++, i++
    ) {
      if (line == 0) {
        continue
      }

      const value = toString(line * major)
      let { x, y } = paperToCanvas(0, line * major)
      x -= 6 * scale()

      const metrics = ctx.measureText(value)
      const xleft = x - metrics.width

      if (xleft < 6 * scale()) {
        ctx.textAlign = "left"
        ctx.fillStyle = THEME_AXIS_NUMBER_OFFSCREEN()
        ctx.strokeText(value, 6 * scale(), y)
        ctx.fillText(value, 6 * scale(), y)
      } else if (x > paper.el.width - 6 * scale()) {
        ctx.textAlign = "right"
        ctx.fillStyle = THEME_AXIS_NUMBER_OFFSCREEN()
        ctx.strokeText(value, paper.el.width - 6 * scale(), y)
        ctx.fillText(value, paper.el.width - 6 * scale(), y)
      } else {
        ctx.textAlign = "right"
        ctx.fillStyle = THEME_AXIS_NUMBER_ONSCREEN()
        ctx.strokeText(value, x, y)
        ctx.fillText(value, x, y)
      }
    }
  }

  function drawGridlines() {
    drawGridlinesX()
    drawGridlinesY()
    drawAxisNumbersX()
    drawAxisNumbersY()
    drawAxes()
  }

  paper.drawFns.push(drawGridlines)
}

function onWheel(paper: Paper) {
  paper.el.addEventListener(
    "wheel",
    (event: WheelEvent) => {
      event.preventDefault()

      const sign =
        event.deltaY == 0 ? 0
        : event.deltaY > 0 ? 1
        : -1

      // the extra .002 means that scrolling up and down repeatedly doesn't affect the zoom level
      // no clue why it works. feel free to experiment with different values
      const zoomScale =
        1.002 - (Math.sqrt(Math.abs(event.deltaY)) * -sign) / 100

      const { x: x0, y: y0 } = paper.paperToOffset({ x: 0, y: 0 })
      const snapX =
        zoomScale < 1 &&
        Math.abs(x0 - event.offsetX) < THEME_ZOOM_ZERO_SNAP_DISTANCE
      const snapY =
        zoomScale < 1 &&
        Math.abs(y0 - event.offsetY) < THEME_ZOOM_ZERO_SNAP_DISTANCE

      const paperCoords = paper.eventToPaper(event)

      paper.zoom(
        { x: snapX ? 0 : paperCoords.x, y: snapY ? 0 : paperCoords.y },
        zoomScale,
      )
    },
    { passive: false },
  )
}

function onScroll(paper: Paper) {
  paper.el.addEventListener("scroll", (event) => event.preventDefault(), {
    passive: false,
  })
}

export interface PointerHandlers<
  T extends {},
  U extends {},
  X extends null | undefined = null | undefined,
> {
  onDragStart(at: Point): T | X
  onDragMove(at: Point, data: T): void
  onDragEnd(at: Point, data: T): void

  onHoverStart(at: Point): U | null | undefined
  /** Return `true` to continue capturing the hover event. */
  onHoverMove(at: Point, data: U): boolean
  onHoverEnd(at: Point, data: U): void

  /** Called when a pointer transitions from hovering to dragging. */
  onUpgrade(at: Point, data: U): T | X
}

/**
 * Registers handlers on a {@linkcode Paper}'s canvas. Passed points will refer
 * to offsetX/offsetY.
 */
function registerOffsetHandlers<T extends {}, U extends {}>(
  paper: Paper,
  hx: PointerHandlers<T, U, never>,
) {
  const dragged = new Map<number, T>()
  const hovered = new Map<number, U>()
  const last = new Map<number, Point>()

  paper.el.addEventListener("contextmenu", (event) => {
    ;(document.activeElement as HTMLElement)?.blur?.()
    event.preventDefault()
  })

  paper.el.classList.add("touch-none")

  paper.el.addEventListener(
    "pointerdown",
    (event) => {
      paper.el.setPointerCapture(event.pointerId)
      ;(document.activeElement as HTMLElement)?.blur?.()
      event.preventDefault()
      const pt: Point = { x: event.offsetX, y: event.offsetY }
      last.set(event.pointerId, pt)

      const hoverData = hovered.get(event.pointerId)
      const dragData =
        hoverData == null ?
          hx.onDragStart(pt)
        : (hovered.delete(event.pointerId), hx.onUpgrade(pt, hoverData))
      dragged.set(event.pointerId, dragData)
    },
    { passive: false },
  )

  paper.el.addEventListener(
    "pointermove",
    (event) => {
      event.preventDefault()
      const pt: Point = { x: event.offsetX, y: event.offsetY }
      last.set(event.pointerId, pt)

      const dragData = dragged.get(event.pointerId)
      if (dragData != null) {
        hx.onDragMove(pt, dragData)
        return
      }

      const hoverMoveData = hovered.get(event.pointerId)
      if (hoverMoveData != null) {
        const stayCaptured = hx.onHoverMove(pt, hoverMoveData)
        if (stayCaptured) return

        hovered.delete(event.pointerId)
      }

      const hoverData = hx.onHoverStart(pt)
      if (hoverData != null) {
        hovered.set(event.pointerId, hoverData)
      }
    },
    { passive: false },
  )

  paper.el.addEventListener("pointerup", (event) => {
    event.preventDefault()
    const pt: Point = { x: event.offsetX, y: event.offsetY }
    last.set(event.pointerId, pt)

    const hoverData = hovered.get(event.pointerId)
    if (hoverData != null) {
      hovered.delete(event.pointerId)
      hx.onHoverEnd(pt, hoverData)
    }

    const dragData = dragged.get(event.pointerId)
    if (dragData != null) {
      dragged.delete(event.pointerId)
      hx.onDragEnd(pt, dragData)
    }
  })

  paper.el.addEventListener("pointerleave", (event) => {
    const pt: Point = { x: event.offsetX, y: event.offsetY }
    last.set(event.pointerId, pt)

    const hoverData = hovered.get(event.pointerId)
    if (hoverData != null) {
      hovered.delete(event.pointerId)
      hx.onHoverEnd(pt, hoverData)
    }
  })
}

/**
 * Handlers are passed points in the paper's coordinate system, not in any DOM
 * system.
 */
function registerPanAndZoom<T extends WeakKey, U extends WeakKey>(
  paper: Paper,
  hx: PointerHandlers<T, U>,
) {
  let nextId = 0
  let allowMovement = false
  const ptrs = new Map<number, DataSelf>()

  type DataSelf = { type: "self"; id: number; from: Point; offset: Point }
  type DataDrag = { type: "user"; user: T } | DataSelf

  let previousDistance: number | undefined

  function onDragMove(to: Point, data: DataSelf) {
    if (!ptrs.has(data.id)) {
      ptrs.set(data.id, data)
    }
    data.offset = to

    if (!allowMovement) return

    if (ptrs.size == 1) {
      const { x, y } = paper.offsetToPaper(to)
      paper.shift({ y: data.from.y - y, x: data.from.x - x })
      return
    }

    if (ptrs.size == 2) {
      const v = ptrs.values()
      const a = v.next().value!
      const b = v.next().value!

      const distance = Math.hypot(
        b.offset.x - a.offset.x,
        b.offset.y - a.offset.y,
      )

      if (!previousDistance) {
        previousDistance = distance
        return
      }

      const xCenter = (a.offset.x + b.offset.x) / 2
      const yCenter = (a.offset.y + b.offset.y) / 2
      const center = paper.offsetToPaper({ x: xCenter, y: yCenter })

      if (distance > previousDistance) {
        paper.zoom(center, 0.948)
      } else {
        paper.zoom(center, 1.048)
      }

      previousDistance = distance
    }
  }

  registerOffsetHandlers<DataDrag, U>(paper, {
    onDragStart(at) {
      const paperAt = paper.offsetToPaper(at)
      const user = hx.onDragStart(paperAt)
      if (user != null) {
        return { type: "user", user }
      }

      const data: DataSelf = {
        type: "self",
        id: ++nextId,
        from: paperAt,
        offset: at,
      }
      ptrs.set(data.id, data)
      if (ptrs.size == 1) {
        allowMovement = true
      }
      return data
    },
    onDragMove(at, data) {
      if (data.type == "user") {
        hx.onDragMove(paper.offsetToPaper(at), data.user)
        return
      }

      onDragMove(at, data)
    },
    onDragEnd(at, data) {
      if (data.type == "user") {
        hx.onDragEnd(paper.offsetToPaper(at), data.user)
        return
      }

      allowMovement = false
      onDragMove(at, data)
      ptrs.delete(data.id)
    },
    onHoverStart(at) {
      return hx.onHoverStart(paper.offsetToPaper(at))
    },
    onHoverMove(at, data) {
      return hx.onHoverMove(paper.offsetToPaper(at), data)
    },
    onHoverEnd(at, data) {
      hx.onHoverEnd(paper.offsetToPaper(at), data)
    },
    onUpgrade(at, hoverData) {
      const paperAt = paper.offsetToPaper(at)

      const user = hx.onUpgrade(paperAt, hoverData)
      if (user != null) return { type: "user", user }

      const data: DataSelf = {
        type: "self",
        id: ++nextId,
        from: paperAt,
        offset: at,
      }
      ptrs.set(data.id, data)
      if (ptrs.size == 1) {
        allowMovement = true
      }
      return data
    },
  })
}

export function makeInteractive<T extends WeakKey, U extends WeakKey>(
  paper: Paper,
  hx: PointerHandlers<T, U>,
) {
  onWheel(paper)
  onScroll(paper)
  registerPanAndZoom(paper, hx)
}
