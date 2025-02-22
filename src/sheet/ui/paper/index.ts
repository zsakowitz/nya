import { sx } from "../../../jsx"
import { onTheme } from "../../theme"
import type { DragProps, PickProps } from "./interact"

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

interface LayerShared {
  line: 1
  point: 2
}

interface LayerExclusive {
  grid: 0
}

const LAYER_SHARED: Partial<LayerShared> = Object.create(null)
LAYER_SHARED.line = 1
LAYER_SHARED.point = 2

const LAYER_EXCLUSIVE: Partial<LayerExclusive> = Object.create(null)
LAYER_EXCLUSIVE.grid = 0

export class Paper {
  readonly el
  private readonly layers = new Map<number, SVGElement>()
  private readonly sharedLayers = new Map<number, SVGGElement>()

  readonly scale: number = 1
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
      class: (className ?? "") + " nya-svg-display",
      fill: "none",
    })
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
    if (this.queued) return
    requestAnimationFrame(() => {
      this.queued = false
      this.draw()
    })
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

export type DrawKind =
  | "point"
  | "line"
  | "ray"
  | "segment"
  | "vector"
  | "polygon"
  | "circle"

export type DrawProps = {
  drag?: DragProps
  pick?: PickProps
} & ({ ghost: true; kind?: never } | { ghost?: boolean; kind: DrawKind })

export type DrawLineProps = Omit<DrawProps, "pick"> & {
  pick?: Omit<PickProps, "draw">
}

export function segmentByPaper(
  paper: Paper,
  p1: Point,
  p2: Point,
  props: DrawLineProps,
) {
  segmentByOffset(paper, paper.toOffset(p1), paper.toOffset(p2), props)
}

export function segmentByOffset(
  paper: Paper,
  o1: Point,
  o2: Point,
  props: DrawLineProps,
) {
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const clsx =
    (props.ghost ? "pointer-events-none " : "") +
    {
      point: "picking-any:opacity-30 picking-point:opacity-100",
      line: "picking-any:opacity-30 picking-line:opacity-100",
      ray: "picking-any:opacity-30 picking-ray:opacity-100",
      segment: "picking-any:opacity-30 picking-segment:opacity-100",
      vector: "picking-any:opacity-30 picking-vector:opacity-100",
      polygon: "picking-any:opacity-30 picking-polygon:opacity-100",
      circle: "picking-any:opacity-30 picking-circle:opacity-100",
      null: "",
    }[props.kind ?? "null"]

  paper.append(
    "line",
    sx("line", {
      x1: o1.x,
      y1: o1.y,
      x2: o2.x,
      y2: o2.y,
      "stroke-width": 3,
      stroke: "#2d70b3",
      "stroke-linecap": "round",
      class: clsx,
    }),
  )

  if (props.drag || props.pick) {
    const ring = sx("line", {
      x1: o1.x,
      y1: o1.y,
      x2: o2.x,
      y2: o2.y,
      "stroke-width": 8,
      stroke: "transparent",
      "stroke-linecap": "round",
      class: clsx,
    })
    paper.append("line", ring)
    const target = sx("line", {
      x1: o1.x,
      y1: o1.y,
      x2: o2.x,
      y2: o2.y,
      "stroke-width": 12,
      stroke: "transparent",
      "stroke-linecap": "round",
      drag: props.drag,
      pick: props.pick && {
        ...props.pick,
        draw() {
          ring.setAttribute("stroke", "#2d70b360")
          target.classList.add("cursor-pointer")
        },
      },
      class: clsx,
    })
    paper.append("line", target)
  }
}
