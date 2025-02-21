import { sx } from "../../../jsx"

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

export interface Layers {
  grid: 0
  line: 1
  point: 2
}

export type Layer = keyof Layers
const LAYERS: Partial<Record<keyof Layers, number>> = Object.create(null)
LAYERS.grid = 0
LAYERS.line = 1
LAYERS.point = 2

export class Paper2 {
  private readonly el
  private readonly layers = new Map<number, SVGGElement>()

  readonly scale: number = 1
  readonly height: number = 0
  readonly width: number = 0

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
    this.el = sx("svg", className)
    const resize = () => {
      this.el.setAttribute(
        "viewBox",
        `0 0 ${this.el.clientWidth} ${this.el.clientHeight}`,
      )
      ;(this as any).width = this.el.clientWidth
      ;(this as any).height = this.el.clientHeight
      ;(this as any).scale = window.devicePixelRatio ?? 1
      this.queue()
    }
    resize()
    new ResizeObserver(resize).observe(this.el)
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

  private layer(index: number) {
    const preexisting = this.layers.get(index)
    if (preexisting) {
      return preexisting
    }

    const layer = sx("g")
    let next: [number, SVGGElement] | undefined
    for (const [k, v] of this.layers) {
      if (k > index && (!next || k < next[0])) {
        next = [k, v]
      }
    }
    const before = next?.[1] ?? null
    this.el.insertBefore(layer, before)
    this.layers.set(index, layer)

    return layer
  }

  append(layer: Layer, el: SVGElement) {
    const index = LAYERS[layer]
    if (index == null) {
      throw new Error(`Layer '${layer}' is not defined.`)
    }
    this.layer(index).appendChild(el)
  }

  private draw() {
    for (const layer of this.layers.values()) {
      while (layer.firstChild) {
        layer.firstChild.remove()
      }
    }

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

  paperToCanvas({ x, y }: Point): Point {
    const { xmin, w, ymin, h } = this.bounds()
    return {
      x: ((x - xmin) / w) * this.width,
      y: (1 - (y - ymin) / h) * this.height,
    }
  }

  offsetToPaper(offset: Point): Point {
    const px = offset.x / this.width
    const py = offset.y / this.height
    const { xmin, w, ymin, h } = this.bounds()
    return {
      x: xmin + w * px,
      y: ymin + h * (1 - py),
    }
  }
}
