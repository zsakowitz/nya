import type { CanvasJs } from "!/std"
import { hx } from "@/jsx"
import { px, type Point } from "@/lib/point"
import { onTheme } from "../../theme"
import { Size } from "./consts"

interface Bounds {
  readonly xmin: number
  readonly w: number
  readonly ymin: number
  readonly h: number
}

export class Cv {
  readonly el
  private readonly canvas
  readonly ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  readonly scale: number = 1
  readonly height: number = 0
  readonly width: number = 0

  get xPrecision() {
    return (this.scale * this.width) / this.bounds().w
  }

  get yPrecision() {
    return (this.scale * this.height) / this.bounds().h
  }

  constructor(
    className?: string,
    private rawBounds: Bounds = {
      xmin: -10.2,
      w: 20.4,
      ymin: -10.2,
      h: 20.4,
    },
    private autofit = true,
  ) {
    if (globalThis.location?.search.includes("cvsize")) {
      const size = new URLSearchParams(location.search).get("cvsize")
      if (size) {
        const num = +size
        if (Number.isFinite(num) && 10e-300 <= num && num <= 10e300) {
          this.rawBounds = rawBounds = {
            xmin: -num,
            w: num * 2,
            ymin: -num,
            h: num * 2,
          }
        }
      }
    }

    this.canvas = hx("canvas", "absolute inset-0 w-full h-full")
    this.ctx = this.canvas.getContext("2d")!
    this.el = hx(
      "div",
      (className ?? "") +
        " nya-svg-display focus:outline-none ring-inset focus-visible:ring ring-[--nya-expr-focus]",
      this.canvas,
    )
    this.el.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey) return

      const { xmin, w, ymin, h } = this.bounds()

      const scale =
        event.shiftKey ?
          event.altKey ?
            0.1
          : 0.5
        : event.altKey ? 0.01
        : 0.05

      if (
        event.key == "+" ||
        event.key == "=" ||
        event.key == "-" ||
        event.key == "_"
      ) {
        event.preventDefault()
        this.zoom(
          px(xmin + w / 2, ymin + h / 2),
          event.key == "-" || event.key == "_" ?
            1 + 2 * scale
          : 1 / (1 + 2 * scale),
        )
        return
      }

      const dir = {
        ArrowLeft: [-w, null],
        ArrowRight: [w, null],
        ArrowUp: [null, h],
        ArrowDown: [null, -h],
      }[event.key]

      if (!dir) return

      event.preventDefault()

      const amount = scale * Math.min(w, h)

      this.move(
        px(
          dir[0] == null ? 0 : Math.sign(dir[0]) * amount,
          dir[1] == null ? 0 : Math.sign(dir[1]) * amount,
        ),
      )
    })
    const resize = () => {
      const scale = ((this as Paper3Mut).scale = window.devicePixelRatio ?? 1)
      const width = ((this as Paper3Mut).width = this.el.clientWidth)
      const height = ((this as Paper3Mut).height = this.el.clientHeight)
      this.canvas.width = width * scale
      this.canvas.height = height * scale
    }
    resize()
    new ResizeObserver(() => {
      resize()
      this.queue()
    }).observe(this.el)
    onTheme(() => this.queue())
  }

  bounds(): Bounds {
    if (this.autofit) {
      const { xmin, w, ymin, h } = this.rawBounds
      const ymid = ymin + h / 2
      const ydiff = ((this.height / this.width) * w) / 2

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

  nya(): CanvasJs {
    const { xmin, w, ymin, h } = this.bounds()
    const { width, height } = this
    const xs = width / w
    const ys = height
    return {
      sx: xs,
      sy: -ys / h,
      ox: -xmin * xs,
      oy: (ymin * ys) / h + ys,
      x0: xmin,
      x1: xmin + w,
      y0: ymin,
      y1: ymin + h,
      wx: w,
      wy: h,
    }
  }

  private readonly fns: ((() => void) & { order: number })[] = []

  fn(order: number, fn: (() => void) & { order?: number }) {
    fn.order = order
    const index = this.fns.findIndex((a) => a.order > order)

    if (index == -1) {
      this.fns.push(fn as any)
    } else {
      this.fns.splice(index, 0, fn as any)
    }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (const fn of this.fns) {
      try {
        fn()
      } catch (e) {
        console.warn("[draw]", e)
      }
    }
  }

  private queued = false

  queue() {
    if (this.queued) return
    this.queued = true
    queueMicrotask(() => {
      this.queued = false
      this.draw()
    })
  }

  /** Offset --> paper */
  toPaper(offset: Point): Point {
    const ox = offset.x / this.width
    const oy = offset.y / this.height
    const { xmin, w, ymin, h } = this.bounds()
    return px(xmin + w * ox, ymin + h * (1 - oy))
  }

  /**
   * Identical to `.toPaper`, but binds the offset coordinates within
   * `Size.DragMargin` pixels of the edge of the canvas. Useful to prevent
   * objects from being dragged outside the window.
   */
  toPaperBounded(offset: Point): Point {
    const x = Math.max(
      Size.DragMargin,
      Math.min(this.width - Size.DragMargin, offset.x),
    )
    const y = Math.max(
      Size.DragMargin,
      Math.min(this.height - Size.DragMargin, offset.y),
    )
    return this.toPaper(px(x, y))
  }

  /** Paper --> offset */
  toOffset({ x, y }: Point): Point {
    const { xmin, w, ymin, h } = this.bounds()
    return px(((x - xmin) / w) * this.width, (1 - (y - ymin) / h) * this.height)
  }

  /** Paper --> canvas */
  toCanvas(pt: Point): Point {
    const { x, y } = this.toOffset(pt)
    return px(x * this.scale, y * this.scale)
  }

  eventToPaper(event: { offsetX: number; offsetY: number }): Point {
    return this.toPaper(px(event.offsetX, event.offsetY))
  }

  /** Offset --> paper */
  toPaperDelta(offsetDelta: Point): Point {
    const ox = offsetDelta.x / this.width
    const oy = offsetDelta.y / this.height
    const { w, h } = this.bounds()
    return px(w * ox, -h * oy)
  }

  /** Paper --> offset */
  toOffsetDelta(paperDelta: Point): Point {
    const { w, h } = this.bounds()
    return px(
      (paperDelta.x / w) * this.width,
      -(paperDelta.y / h) * this.height,
    )
  }

  /** Paper --> canvas */
  toCanvasDelta(paperDelta: Point): Point {
    const { x, y } = this.toOffsetDelta(paperDelta)
    return px(x * this.scale, y * this.scale)
  }

  /** Shortcut for Math.hypot(.toOffset(a - b)) */
  offsetDistance(a: Point, b: Point) {
    const { x, y } = this.toOffsetDelta(px(a.x - b.x, a.y - b.y))
    return Math.hypot(x, y)
  }

  move({ x, y }: Point) {
    this.rawBounds = {
      ...this.rawBounds,
      xmin: this.rawBounds.xmin + x,
      ymin: this.rawBounds.ymin + y,
    }
    this.queue()
  }

  zoom({ x, y }: Point, scale: number) {
    const { xmin, w, ymin, h } = this.rawBounds

    const xCenter = xmin + w / 2
    const yCenter = ymin + h / 2
    const xAdj = (x - xCenter) * (1 - scale) + xCenter
    const yAdj = (y - yCenter) * (1 - scale) + yCenter

    const xmin2 = scale * (xmin - xCenter) + xAdj
    const ymin2 = scale * (ymin - yCenter) + yAdj
    const w2 = scale * w
    const h2 = scale * h

    // 1e-12 is larger than EPISLON by ~10^4, ensuring we still have good resolution
    // TODO: Check how this behaves on screens wider than `1e-12 / Number.EPSILON` pixels
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

  point(at: Point, size: number, color: string, alpha = 1) {
    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.globalAlpha = alpha
    const { x, y } = this.toCanvas(at)
    this.ctx.ellipse(
      x,
      y,
      size * this.scale,
      size * this.scale,
      0,
      0,
      2 * Math.PI,
    )
    this.ctx.fill()
    this.ctx.globalAlpha = 1
  }

  ring(at: Point, distance: number, size: number, color: string, alpha = 1) {
    this.ctx.beginPath()
    this.ctx.globalAlpha = alpha
    const { x, y } = this.toCanvas(at)
    this.ctx.ellipse(
      x,
      y,
      distance * this.scale,
      distance * this.scale,
      0,
      0,
      2 * Math.PI,
    )
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = size * this.scale
    this.ctx.stroke()
    this.ctx.globalAlpha = 1
  }

  /** Takes points in paper coordinates. */
  hitsPoint(p1: Point, p2: Point) {
    return this.offsetDistance(p1, p2) <= Size.Target
  }

  /** Takes `at` in paper coordinates. */
  hits(at: Point, path: Path2D) {
    this.ctx.lineWidth = 2 * Size.Target * this.scale
    const { x, y } = this.toCanvas(at)
    return this.ctx.isPointInStroke(path, x, y)
  }

  /** Takes `at` in paper coordinates. */
  hitsFill(at: Point, path: Path2D) {
    this.ctx.lineWidth = 2 * Size.Target * this.scale
    const { x, y } = this.toCanvas(at)
    return this.ctx.isPointInPath(path, x, y)
  }

  hitsCircle(at: Point, center: Point, r: number) {
    const path = new Path2D()
    const { x, y } = this.toCanvas(center)
    const { x: rx, y: ry } = this.toCanvasDelta(px(r, r))
    path.ellipse(x, y, rx, -ry, 0, 0, 2 * Math.PI)
    return this.hits(at, path)
  }

  /** Accepts canvas coordinates. */
  path(
    this: {
      ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
      scale: number
    },
    path: Path2D,
    size: number,
    color: string,
    strokeAlpha = 1,
    fillAlpha = 0,
  ) {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = size * this.scale
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"
    this.ctx.globalAlpha = fillAlpha
    this.ctx.fillStyle = color
    this.ctx.fill(path)
    this.ctx.globalAlpha = strokeAlpha
    this.ctx.stroke(path)
    this.ctx.globalAlpha = 1
  }

  // TODO: everything except point should probably just make a Path2D and delegate to `path`

  circle(at: Point, r: number, size: number, color: string, alpha = 1) {
    this.ctx.beginPath()
    this.ctx.strokeStyle = color
    this.ctx.globalAlpha = alpha
    this.ctx.lineWidth = size * this.scale
    const { x, y } = this.toCanvas(at)
    const { x: rx, y: ry } = this.toCanvasDelta(px(r, r))
    this.ctx.ellipse(x, y, rx, -ry, 0, 0, 2 * Math.PI)
    this.ctx.stroke()
    this.ctx.globalAlpha = 1
  }

  dPoly(pts: readonly Point[]) {
    if (pts.length < 2) return new Path2D()
    const cvs = pts.map((x) => this.toCanvas(x))
    return new Path2D(
      `M ${cvs[0]!.x} ${cvs[0]!.y}${cvs
        .slice(1)
        .map(({ x, y }) => ` L ${x} ${y}`)
        .join("")}`,
    )
  }

  polygon(
    ps: readonly Point[],
    size: number,
    color: string,
    strokeAlpha?: number,
    fillAlpha?: number,
    closed?: boolean,
  ) {
    this.polygonByCanvas(
      ps.map((p) => this.toCanvas(p)),
      size,
      color,
      strokeAlpha,
      fillAlpha,
      closed,
    )
  }

  polygonByCanvas(
    pts: Point[],
    size: number,
    color: string,
    strokeAlpha = 1,
    fillAlpha = 0,
    closed = false,
  ) {
    if (pts.length <= 1) return

    this.ctx.beginPath()
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = size * this.scale
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"
    this.ctx.moveTo(pts[0]!.x, pts[0]!.y)
    for (const { x, y } of pts.slice(1)) {
      this.ctx.lineTo(x, y)
    }
    if (closed) {
      this.ctx.closePath()
    }
    if (pts.length > 2) {
      this.ctx.globalAlpha = fillAlpha
      this.ctx.fillStyle = color
      this.ctx.fill()
    }
    this.ctx.globalAlpha = strokeAlpha
    this.ctx.stroke()
    this.ctx.globalAlpha = 1
  }

  cursor(style: "default" | "pointer" | "move" | "grab" | "grabbing" | "none") {
    this.el.style.cursor = style
  }
}

type Paper3Mut = { -readonly [K in keyof Cv]: Cv[K] }
