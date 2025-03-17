import { sx } from "../../../jsx"
import type { Point } from "../../point"
import { onTheme } from "../../theme"
import type { DragProps, PickProps } from "./interact"

interface Bounds {
  readonly xmin: number
  readonly w: number
  readonly ymin: number
  readonly h: number
}

interface LayerShared {
  image: 0
  angleline: 2
  line: 3
  anglearc: 4
  point: 5
}

interface LayerExclusive {
  grid: 1
}

const LAYER_SHARED: LayerShared = {
  image: 0,
  angleline: 2,
  line: 3,
  anglearc: 4,
  point: 5,
}
Object.setPrototypeOf(LAYER_SHARED, null)

const LAYER_EXCLUSIVE: Partial<LayerExclusive> = Object.create(null)
LAYER_EXCLUSIVE.grid = 1

// FIXME: delete me
export class Paper {
  readonly el
  private readonly layers = new Map<number, SVGElement>()
  private readonly sharedLayers = new Map<number, SVGGElement>()

  /** @deprecated For compat with cv while transitioning */
  get scale() {
    return 1
  }
  readonly height: number = 0
  readonly width: number = 0

  get yPrecision() {
    return ((globalThis.devicePixelRatio ?? 1) * this.height) / this.bounds().h
  }

  get xPrecision() {
    return ((globalThis.devicePixelRatio ?? 1) * this.width) / this.bounds().w
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
    this.el = sx("svg", {
      class:
        (className ?? "") +
        " nya-svg-display focus:outline-none ring-inset focus-visible:ring ring-[--nya-expr-focus]",
      fill: "none",
      viewBox: "0 0 1 1",
    })
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
      this.el.setAttribute(
        "viewBox",
        `0 0 ${this.el.clientWidth} ${this.el.clientHeight}`,
      )
      ;(this as any).width = this.el.clientWidth
      ;(this as any).height = this.el.clientHeight
    }
    resize()
    new ResizeObserver(() => {
      resize()
      this.queue()
    }).observe(this.el)
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

  private insert(index: number, el: SVGElement) {
    let next: [number, SVGElement] | undefined
    for (const [k, v] of this.layers) {
      if (k > index && (!next || k < next[0])) {
        next = [k, v]
      }
    }
    const before = next?.[1] ?? null
    this.el.insertBefore(el, before)
    return el
  }

  private layer(index: number) {
    const preexisting = this.layers.get(index)
    if (preexisting) {
      return preexisting
    }

    const layer = sx("g")
    this.insert(index, layer)
    this.layers.set(index, layer)
    this.sharedLayers.set(index, layer)
    return layer
  }

  claim(layer: keyof LayerExclusive, el: SVGElement) {
    const index = LAYER_EXCLUSIVE[layer]
    if (index == null) {
      throw new Error(`Exclusive layer '${layer}' is not defined.`)
    }
    if (this.layers.has(index)) {
      throw new Error(`Exclusive layer '${layer}' has already been claimed.`)
    }
    this.insert(index, el)
    this.layers.set(index, el)
  }

  addClass(layer: keyof LayerShared, ...classes: string[]) {
    const index = LAYER_SHARED[layer]
    if (index == null) {
      throw new Error(`Shared layer '${layer}' is not defined.`)
    }
    this.layer(index).classList.add(...classes)
  }

  append(layer: keyof LayerShared, el: SVGElement) {
    const index = LAYER_SHARED[layer]
    if (index == null) {
      throw new Error(`Shared layer '${layer}' is not defined.`)
    }
    this.layer(index).appendChild(el)
  }

  private draw() {
    for (const layer of this.sharedLayers.values()) {
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
    console.error("Paper.queue should be overriden")
    if (this.queued) return
    this.queued = true
    requestAnimationFrame(() => {
      this.queued = false
      this.draw()
    })
  }

  /** @deprecated Used for transitioning to Cv */
  toCanvas(pt: Point) {
    return this.toOffset(pt)
  }

  toOffset({ x, y }: Point): Point {
    const { xmin, w, ymin, h } = this.bounds()
    return {
      x: ((x - xmin) / w) * this.width,
      y: (1 - (y - ymin) / h) * this.height,
    }
  }

  toPaper(offset: Point): Point {
    const px = offset.x / this.width
    const py = offset.y / this.height
    const { xmin, w, ymin, h } = this.bounds()
    return { x: xmin + w * px, y: ymin + h * (1 - py) }
  }

  eventToPaper(event: { offsetX: number; offsetY: number }): Point {
    return this.toPaper({ x: event.offsetX, y: event.offsetY })
  }

  toPaperDelta(offsetDelta: Point): Point {
    const px = offsetDelta.x / this.width
    const py = offsetDelta.y / this.height
    const { w, h } = this.bounds()
    return { x: w * px, y: -h * py }
  }

  toOffsetDelta(paperDelta: Point): Point {
    const { w, h } = this.bounds()
    return {
      x: (paperDelta.x / w) * this.width,
      y: -(paperDelta.y / h) * this.height,
    }
  }

  /** @deprecated Used for interop with cv */
  toCanvasDelta(paperDelta: Point): Point {
    return this.toOffsetDelta(paperDelta)
  }

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

type DrawKind =
  | "point"
  | "line"
  | "ray"
  | "segment"
  | "vector"
  | "polygon"
  | "circle"
  | "angle"
  | "directedangle"
  | "arc"

export type DrawProps = {
  drag?: DragProps
  pick?: PickProps
} & ({ ghost: true; kind?: never } | { ghost?: boolean; kind: DrawKind })

export type DrawLineProps = Omit<DrawProps, "pick"> & {
  pick?: Omit<PickProps, "draw">
}
