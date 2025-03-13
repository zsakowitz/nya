import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { sx } from "../../../jsx"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/point"
import type { Cv } from "../../../sheet/ui/cv"
import { Colors, Order, Size } from "../../../sheet/ui/cv/consts"
import type { DrawLineProps, Paper } from "../../../sheet/ui/paper"

export function vectorPath(cv: Paper | Cv, p1: Point, p2: Point) {
  const o1 = cv.toCanvas(p1)
  const o2 = cv.toCanvas(p2)
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const dx = o2.x - o1.x
  const dy = o2.y - o1.y
  const nx = (Size.VectorHead * cv.scale * dx) / Math.hypot(dx, dy)
  const ny = (Size.VectorHead * cv.scale * dy) / Math.hypot(dx, dy)
  const ox = o2.x - nx
  const oy = o2.y - ny
  const w = Size.VectorWidthRatio

  return `M ${o1.x} ${o1.y} L ${o2.x} ${o2.y} M ${o2.x} ${o2.y} L ${ox + w * ny} ${oy - w * nx} L ${ox - w * ny} ${oy + w * nx} Z`
}

export function drawVector(
  paper: Paper,
  p1: Point,
  p2: Point,
  props?: Omit<DrawLineProps, "kind">,
) {
  const d = vectorPath(paper, p1, p2)
  if (!d) return

  paper.append(
    "line",
    sx("path", {
      d,
      "stroke-width": 3,
      stroke: "#2d70b3",
      fill: "#2d70b3",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: props?.ghost ? "pointer-events-none" : "",
    }),
  )

  if (props?.drag || props?.pick) {
    const ring = sx("path", {
      d,
      "stroke-width": 8,
      stroke: "transparent",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    })
    const target = sx("path", {
      d,
      "stroke-width": 12,
      stroke: "transparent",
      fill: "transparent",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      drag: props.drag,
      pick: props.pick && {
        ...props.pick,
        draw() {
          ring.setAttribute("stroke", "#2d70b360")
          target.classList.add("cursor-pointer")
        },
      },
    })
    paper.append("line", ring)
    paper.append("line", target)
  }
}

export const EXT_VECTOR = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "vector") {
      return { value: value as JsValue<"vector">, expr }
    }
  },
  plot: {
    order: Order.Graph,
    items(data) {
      return each(data.value)
    },
    draw(data, [p1, p2]) {
      const { cv } = data.expr.sheet
      const d = vectorPath(cv, unpt(p1), unpt(p2))
      if (d) cv.path(new Path2D(d), Size.Line, Colors.Blue, 1, 1)
    },
  },
})
