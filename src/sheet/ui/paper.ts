import { hx } from "../../jsx"

const THEME_MAIN_AXIS_WIDTH = 1.5
const THEME_MAJOR_LINE_ALPHA = 0.3
const THEME_MINOR_LINE_ALPHA = 0.1

const THEME_AXIS_NUMBER_SIZE = 0.875
const THEME_AXIS_NUMBER_STROKE_COLOR = "white"
const THEME_AXIS_NUMBER_STROKE_WIDTH = 4
const THEME_AXIS_NUMBER_ONSCREEN = "black"
const THEME_AXIS_NUMBER_OFFSCREEN = "#8e8e8e"
const THEME_AXIS_NUMBER_NEGATIVE_X_OFFSET = -2.5

const THEME_ZOOM_ZERO_SNAP_DISTANCE = 16
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
  readonly xmax: number
  readonly ymin: number
  readonly ymax: number
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
      xmin: -2.05,
      xmax: 0.55,
      ymin: -1.3,
      ymax: 1.3,
    },
    public autofit = true,
  ) {}

  bounds(): Bounds {
    if (this.autofit) {
      const { xmin, xmax, ymin, ymax } = this.rawBounds

      const ymid = (ymin + ymax) / 2
      const xdiff = xmax - xmin
      const ydiff = ((this.el.height / this.el.width) * xdiff) / 2

      return {
        xmin,
        xmax,
        ymin: ymid - ydiff,
        ymax: ymid + ydiff,
      }
    } else {
      return this.rawBounds
    }
  }

  offsetToPaper(offset: Point): Point {
    const px = offset.x / this.el.offsetWidth
    const py = offset.y / this.el.offsetHeight
    const { xmin, xmax, ymin, ymax } = this.bounds()
    return {
      x: xmin * (1 - px) + xmax * px,
      y: ymin * py + ymax * (1 - py),
    }
  }

  paperToCanvas({ x, y }: Point): Point {
    const { xmin, xmax, ymin, ymax } = this.bounds()
    return {
      x: ((x - xmin) / (xmax - xmin)) * this.el.width,
      y: (1 - (y - ymin) / (ymax - ymin)) * this.el.height,
    }
  }

  paperToOffset({ x, y }: Point): Point {
    const { xmin, xmax, ymin, ymax } = this.bounds()
    return {
      x: ((x - xmin) / (xmax - xmin)) * this.el.clientWidth,
      y: (1 - (y - ymin) / (ymax - ymin)) * this.el.clientHeight,
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

  shift(by: Point) {
    const { ymin, xmax, ymax, xmin } = this.rawBounds
    this.rawBounds = {
      ymin: ymin + by.y,
      xmax: xmax + by.x,
      ymax: ymax + by.y,
      xmin: xmin + by.x,
    }
  }

  zoom(target: Point, scale: number) {
    const { ymin, xmax, ymax, xmin } = this.rawBounds

    const xCenter = (xmin + xmax) / 2
    const yCenter = (ymin + ymax) / 2
    const xAdj = (target.x - xCenter) * (1 - scale) + xCenter
    const yAdj = (target.y - yCenter) * (1 - scale) + yCenter

    this.rawBounds = {
      ymin: scale * (ymin - yCenter) + yAdj,
      xmax: scale * (xmax - xCenter) + xAdj,
      ymax: scale * (ymax - yCenter) + yAdj,
      xmin: scale * (xmin - xCenter) + xAdj,
    }
  }
}

export function doMatchSize(paper: Paper) {
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

export function doDrawCycle(paper: Paper) {
  ;(function f() {
    paper.draw()
    requestAnimationFrame(f)
  })()
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
    ctx.strokeStyle = "black"
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, paper.el.height)
    ctx.stroke()
  }

  function drawScreenLineY(y: number, h: number) {
    ctx.strokeStyle = "black"
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
    const { xmin, xmax } = paper.bounds()
    const w = xmax - xmin
    const { minor, major } = getGridlineSize(w, paper.el.width)

    ctx.strokeStyle = "black"
    ctx.lineWidth = scale()

    ctx.beginPath()
    ctx.globalAlpha = THEME_MAJOR_LINE_ALPHA
    const majorStart = Math.floor(xmin / major) * major
    const majorEnd = Math.ceil(xmax / major) * major
    for (let line = majorStart; line < majorEnd; line += major) {
      const { x } = paperToCanvas(line, 0)
      drawScreenLineX(x, scale())
    }

    ctx.beginPath()
    ctx.globalAlpha = THEME_MINOR_LINE_ALPHA
    const minorStart = Math.floor(xmin / minor) * minor
    const minorEnd = Math.ceil(xmax / minor) * minor
    for (let line = minorStart; line < minorEnd; line += minor) {
      const { x } = paperToCanvas(line, 0)
      drawScreenLineX(x, 1 * scale())
    }

    ctx.globalAlpha = 1
  }

  function drawGridlinesY() {
    const { ymin, ymax } = paper.bounds()
    const h = ymax - ymin
    const { minor, major } = getGridlineSize(h, paper.el.height)

    ctx.strokeStyle = "black"
    ctx.lineWidth = scale()

    ctx.beginPath()
    ctx.globalAlpha = THEME_MAJOR_LINE_ALPHA
    const majorStart = Math.floor(ymin / major) * major
    const majorEnd = Math.ceil(ymax / major) * major
    for (let line = majorStart; line < majorEnd; line += major) {
      const { y } = paperToCanvas(0, line)
      drawScreenLineY(y, 1 * scale())
    }

    ctx.beginPath()
    ctx.globalAlpha = THEME_MINOR_LINE_ALPHA
    const minorStart = Math.floor(ymin / minor) * minor
    const minorEnd = Math.ceil(ymax / minor) * minor
    for (let line = minorStart; line < minorEnd; line += minor) {
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
    const { xmin, xmax } = paper.bounds()
    const w = xmax - xmin
    const { major } = getGridlineSize(w, paper.el.width)

    ctx.beginPath()

    ctx.strokeStyle = THEME_AXIS_NUMBER_STROKE_COLOR
    ctx.lineWidth = THEME_AXIS_NUMBER_STROKE_WIDTH * scale()
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.font = `${THEME_AXIS_NUMBER_SIZE * scale()}rem sans-serif`

    const majorStart = Math.floor(xmin / major)
    const majorEnd = Math.ceil(xmax / major)

    const zeroMetrics = ctx.measureText("0")
    const letterSize =
      zeroMetrics.fontBoundingBoxDescent - zeroMetrics.fontBoundingBoxAscent

    const { y } = paperToCanvas(0, 0)

    const pos =
      y + 7.5 * scale() + letterSize > paper.el.height ? "bottom"
      : y + 1.5 * scale() < 0 ? "top"
      : "middle"

    if (pos == "middle") {
      ctx.fillStyle = THEME_AXIS_NUMBER_ONSCREEN
    } else {
      ctx.fillStyle = THEME_AXIS_NUMBER_OFFSCREEN

      if (pos == "bottom") {
        ctx.textBaseline = "bottom"
      }
    }

    for (let line = majorStart; line < majorEnd; line++) {
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
    const { ymin, ymax } = paper.bounds()
    const h = ymax - ymin
    const { major } = getGridlineSize(h, paper.el.height)

    ctx.beginPath()

    ctx.strokeStyle = THEME_AXIS_NUMBER_STROKE_COLOR
    ctx.lineWidth = THEME_AXIS_NUMBER_STROKE_WIDTH * scale()
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.font = `${THEME_AXIS_NUMBER_SIZE * scale()}rem sans-serif`

    const majorStart = Math.floor(ymin / major)
    const majorEnd = Math.ceil(ymax / major)

    for (let line = majorStart; line < majorEnd; line++) {
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
        ctx.fillStyle = THEME_AXIS_NUMBER_OFFSCREEN
        ctx.strokeText(value, 6 * scale(), y)
        ctx.fillText(value, 6 * scale(), y)
      } else if (x > paper.el.width - 6 * scale()) {
        ctx.textAlign = "right"
        ctx.fillStyle = THEME_AXIS_NUMBER_OFFSCREEN
        ctx.strokeText(value, paper.el.width - 6 * scale(), y)
        ctx.fillText(value, paper.el.width - 6 * scale(), y)
      } else {
        ctx.textAlign = "right"
        ctx.fillStyle = THEME_AXIS_NUMBER_ONSCREEN
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

export function onWheel(paper: Paper) {
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

export function onScroll(paper: Paper) {
  paper.el.addEventListener("scroll", (event) => event.preventDefault(), {
    passive: false,
  })
}

/**
 * Whether the points refer to clientX/clientY values or paper values depends on
 * which function is used to register them. Consult its documentation.
 */
export interface PointerHandlers<T, X extends null | undefined = never> {
  onDragStart(at: Point): T | X
  onDragMove(to: Point, data: T): void
  onDragEnd(to: Point, data: T): void

  /** Called if a pointer which isn't down is brought over the {@linkcode Paper}. */
  onHover(at: Point): void
}

/**
 * Registers handlers on a {@linkcode Paper}'s canvas. Passed points will refer
 * to offsetX/offsetY.
 */
export function registerOffsetHandlers<T>(
  paper: Paper,
  hx: PointerHandlers<T>,
) {
  const ptrs = new Map<number, [start: Point, data: T]>()

  paper.el.addEventListener("contextmenu", (event) => {
    event.preventDefault()
  })

  paper.el.classList.add("touch-none")

  paper.el.addEventListener(
    "pointerdown",
    (event) => {
      event.pointerId
      paper.el.setPointerCapture(event.pointerId)
      event.preventDefault()
      const pt: Point = { x: event.offsetX, y: event.offsetY }
      const data = hx.onDragStart(pt)
      ptrs.set(event.pointerId, [pt, data])
    },
    { passive: false },
  )

  paper.el.addEventListener(
    "pointermove",
    (event) => {
      event.preventDefault()
      const pt: Point = { x: event.offsetX, y: event.offsetY }

      const initial = ptrs.get(event.pointerId)
      if (initial) {
        hx.onDragMove(pt, initial[1])
      } else {
        hx.onHover(pt)
      }
    },
    { passive: false },
  )

  paper.el.addEventListener("pointerup", (event) => {
    event.preventDefault()
    const pt: Point = { x: event.offsetX, y: event.offsetY }
    const initial = ptrs.get(event.pointerId)
    if (!initial) return
    hx.onDragEnd(pt, initial[1])
    ptrs.delete(event.pointerId)
  })
}

export function registerPanAndZoom<T>(
  paper: Paper,
  hx: PointerHandlers<T, null | undefined>,
) {
  let nextId = 0
  let allowMovement = false
  const ptrs = new Map<number, DataSelf>()

  type DataSelf = { type: "self"; id: number; from: Point; offset: Point }
  type Data = { type: "user"; user: NonNullable<T> } | DataSelf

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
      document.querySelector("#debugcount")!.textContent =
        +document.querySelector("#debugcount")!.textContent! + 1 + ""
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

  registerOffsetHandlers<Data>(paper, {
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
    onDragMove(to, data) {
      if (data.type == "user") {
        hx.onDragMove(paper.offsetToPaper(to), data.user)
        return
      }

      onDragMove(to, data)
    },
    onDragEnd(to, data) {
      if (data.type == "user") {
        hx.onDragEnd(paper.offsetToPaper(to), data.user)
        return
      }

      allowMovement = false
      onDragMove(to, data)
      ptrs.delete(data.id)
    },
    onHover(at) {
      hx.onHover(paper.offsetToPaper(at))
    },
  })
}
