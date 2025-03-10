import { each, type JsValue } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import { sx } from "../../../jsx"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/point"
import { type DrawLineProps, type Paper } from "../../../sheet/ui/paper"
import { pick } from "./util"

export function drawVector(
  paper: Paper,
  p1: Point,
  p2: Point,
  props?: Omit<DrawLineProps, "kind">,
) {
  const o1 = paper.toOffset(p1)
  const o2 = paper.toOffset(p2)
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const dx = o2.x - o1.x
  const dy = o2.y - o1.y
  const nx = (14 * dx) / Math.hypot(dx, dy)
  const ny = (14 * dy) / Math.hypot(dx, dy)
  const ox = o2.x - nx
  const oy = o2.y - ny
  const w = 0.4

  const d = `M ${o1.x} ${o1.y} L ${o2.x} ${o2.y} M ${o2.x} ${o2.y} L ${ox + w * ny} ${oy - w * nx} L ${ox - w * ny} ${oy + w * nx} Z`

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
  svg(data, paper) {
    for (const val of each(data.value)) {
      drawVector(paper, unpt(val[0]), unpt(val[1]), {
        pick: pick(val, data, data.expr.field.ctx),
      })
    }
  },
})
