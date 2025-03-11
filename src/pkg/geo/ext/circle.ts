import { each, type JsValue } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { sx } from "../../../jsx"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/point"
import { Colors, Order, Size } from "../../../sheet/ui/cv/consts"
import type { DrawLineProps, Paper } from "../../../sheet/ui/paper"

export function drawCircle(
  paper: Paper,
  props: { at: Point; r: number } & DrawLineProps,
) {
  const { x: cx, y: cy } = paper.toOffset(props.at)
  const r = paper.toOffsetDelta({ x: props.r, y: 0 }).x

  if (!(isFinite(cx) && isFinite(cy) && isFinite(r) && r > 0)) {
    return
  }

  const clsx =
    (props?.ghost ? "pointer-events-none " : "") +
    "picking-any:opacity-30 picking-circle:opacity-100"

  paper.append(
    "line",
    sx("circle", {
      cx,
      cy,
      r,
      stroke: "#388c46",
      "stroke-width": 3,
      class: clsx,
    }),
  )

  if (props.pick || props.drag) {
    const ring = sx("circle", {
      cx,
      cy,
      r,
      stroke: "transparent",
      "stroke-width": 8,
      class: clsx,
    })
    paper.append("line", ring)
    paper.append(
      "line",
      sx("circle", {
        cx,
        cy,
        r,
        stroke: "transparent",
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

export const EXT_CIRCLE = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "circle") {
      return {
        value: value as JsValue<"circle">,

        expr,
      }
    }
  },
  plot: {
    order: Order.Graph,
    draw(data) {
      for (const val of each(data.value)) {
        data.expr.sheet.cv.circle(
          unpt(val.center),
          num(val.radius),
          Size.Line,
          Colors.Green,
        )
      }
    },
  },
})
