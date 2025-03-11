import type { TyName } from "../../../eval/ty"
import { hx } from "../../../jsx"
import type { Point } from "../../point"
import { onTheme } from "../../theme"

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

  _picking: TyName[] = []

  get picking() {
    return this._picking
  }

  set picking(v) {
    this._picking = v
    this.queue()
  }

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
          {
            x: xmin + w / 2,
            y: ymin + h / 2,
          },
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

      this.move({
        x: dir[0] == null ? 0 : Math.sign(dir[0]) * amount,
        y: dir[1] == null ? 0 : Math.sign(dir[1]) * amount,
      })
    })
    const resize = () => {
      const scale = ((this as Paper3Mut).scale = window.devicePixelRatio ?? 1)
      const width = ((this as Paper3Mut).width = this.el.clientWidth)
      const height = ((this as Paper3Mut).height = this.el.clientHeight)
      this.canvas.width = width * scale
      this.canvas.height = height * scale
      this.queue()
    }
    resize()
    new ResizeObserver(resize).observe(this.el)
    onTheme(() => this.draw())
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

  readonly fns: (() => void)[] = []

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
    requestAnimationFrame(() => {
      this.queued = false
      this.draw()
    })
  }

  /** Offset --> paper */
  toPaper(offset: Point): Point {
    const px = offset.x / this.width
    const py = offset.y / this.height
    const { xmin, w, ymin, h } = this.bounds()
    return { x: xmin + w * px, y: ymin + h * (1 - py) }
  }

  /** Paper --> offset */
  toOffset({ x, y }: Point): Point {
    const { xmin, w, ymin, h } = this.bounds()
    return {
      x: ((x - xmin) / w) * this.width,
      y: (1 - (y - ymin) / h) * this.height,
    }
  }

  /** Paper --> canvas */
  toCanvas(pt: Point): Point {
    const { x, y } = this.toOffset(pt)
    return { x: x * this.scale, y: y * this.scale }
  }

  eventToPaper(event: { offsetX: number; offsetY: number }): Point {
    return this.toPaper({ x: event.offsetX, y: event.offsetY })
  }

  /** Offset --> paper */
  toPaperDelta(offsetDelta: Point): Point {
    const px = offsetDelta.x / this.width
    const py = offsetDelta.y / this.height
    const { w, h } = this.bounds()
    return { x: w * px, y: -h * py }
  }

  /** Paper --> offset */
  toOffsetDelta(paperDelta: Point): Point {
    const { w, h } = this.bounds()
    return {
      x: (paperDelta.x / w) * this.width,
      y: -(paperDelta.y / h) * this.height,
    }
  }

  /** Paper --> canvas */
  toCanvasDelta(paperDelta: Point): Point {
    const { x, y } = this.toOffsetDelta(paperDelta)
    return { x: x * this.scale, y: y * this.scale }
  }

  /** Shortcut for Math.hypot(.toOffset(a - b)) */
  offsetDistance(a: Point, b: Point) {
    const { x, y } = this.toOffsetDelta({ x: a.x - b.x, y: a.y - b.y })
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
}

type Paper3Mut = { -readonly [K in keyof Cv]: Cv[K] }
