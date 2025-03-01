import { each, type JsValue } from "../../../eval/ty"
import { sx } from "../../../jsx"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { DrawLineProps, Paper } from "../../../sheet/ui/paper"
import { arcPath, computeArcVal, type Arc } from "../arc"
import { pick } from "./util"

export function drawArc(
  paper: Paper,
  props: { arc: Arc; kind: "arc" } & DrawLineProps,
) {
  const o = arcPath(paper, props.arc)

  const d =
    o.type == "circle" ?
      `M ${o.p1.x} ${o.p1.y} A ${o.r.x} ${o.r.y} 0 ${o.flags} ${o.p3.x} ${o.p3.y}`
    : o.type == "segment" ? `M ${o.p1.x} ${o.p1.y} L ${o.p3.x} ${o.p3.y}`
    : o.type == "tworay" ?
      (o.r1 ? `M ${o.r1[0].x} ${o.r1[0].y} L ${o.r1[1].x} ${o.r1[1].y}` : "") +
      (o.r3 ? ` M ${o.r3[0].x} ${o.r3[0].y} L ${o.r3[1].x} ${o.r3[1].y}` : "")
    : null

  if (!d) {
    return
  }

  const clsx =
    (props?.ghost ? "pointer-events-none " : "") +
    "picking-any:opacity-30 picking-circle:opacity-100"

  paper.append(
    "line",
    sx("path", {
      d,
      stroke: "#388c46",
      "stroke-linecap": "round",
      "stroke-width": 3,
      class: clsx,
    }),
  )

  if (props.pick || props.drag) {
    const ring = sx("path", {
      d,
      stroke: "transparent",
      "stroke-linecap": "round",
      "stroke-width": 8,
      class: clsx,
    })
    paper.append("line", ring)
    paper.append(
      "line",
      sx("path", {
        d,
        stroke: "transparent",
        "stroke-linecap": "round",
        "stroke-width": 12,
        drag: props.drag,
        pick: props.pick && {
          ...props.pick,
          draw() {
            ring.setAttribute("stroke", "#388c4660")
          },
        },
        class: clsx,
      }),
    )
  }
}

export const EXT_ARC = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "arc") {
      return {
        value: value as JsValue<"arc">,

        expr,
      }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      const arc = computeArcVal(val)
      drawArc(paper, {
        arc,
        pick: pick(val, data, data.expr.field.ctx),
        kind: "arc",
      })
    }
  },
})
