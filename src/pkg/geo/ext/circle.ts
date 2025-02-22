import { each, type JsValue } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { sx } from "../../../jsx"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/ui/paper"
import type { DrawProps, Paper } from "../../../sheet/ui/paper"
import { pick } from "./util"

const DIMMED = new Prop(() => false)

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

  paper.append(
    "line",
    sx("circle", {
      cx,
      cy,
      r,
      stroke: "#388c46",
      "stroke-width": 3,
      "stroke-opacity": props.dimmed ? 0.3 : 1,
      class: props?.ghost ? "pointer-events-none" : undefined,
    }),
  )

  if (props.pick || props.drag) {
    paper.append(
      "line",
      sx("circle", {
        cx,
        cy,
        r,
        stroke: "transparent",
        "stroke-width": 12,
        drag: props.drag,
        pick: props.pick,
        class: props?.ghost ? "pointer-events-none" : undefined,
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
  svg(data, paper) {
    for (const val of each(data.value)) {
      drawCircle(paper, {
        at: unpt(val.center),
        r: num(val.radius),
        dimmed: DIMMED.get(data.expr),
        pick: pick(val, "c", data),
      })
    }
  },
})
