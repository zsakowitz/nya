import { each, type JsValue } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { sx } from "../../../jsx"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { DrawProps, Paper, Point } from "../../../sheet/ui/paper"
import { pick } from "./util"

export function drawCircle(
  paper: Paper,
  props: {
    at: Point
    r: number
  } & DrawProps,
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
    const edge = sx("circle", {
      cx,
      cy,
      r,
      stroke: "transparent",
      "stroke-width": 12,
      drag: props.drag,
      pick: props.pick,
      class: clsx,
    })
    paper.append("line", edge)
    return edge
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
  svg(data, paper) {
    for (const val of each(data.value)) {
      const edge = drawCircle(paper, {
        at: unpt(val.center),
        r: num(val.radius),
        pick: {
          ...pick(val, "c", data),
          draw() {
            edge!.style.stroke = "#388c4640"
          },
        },
        kind: "circle",
      })
    }
  },
})
