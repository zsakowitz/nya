import { hx } from "../../jsx"
import { onTheme } from "../theme"

interface Bounds {
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
