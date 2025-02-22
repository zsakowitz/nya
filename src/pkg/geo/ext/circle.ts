import { each, type JsValue } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { sx } from "../../../jsx"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Paper, Point } from "../../../sheet/ui/paper"
import type { DrawProps, Paper2 } from "../../../sheet/ui/paper2"
import { pick } from "./util"

const DIMMED = new Prop(() => false)

export function drawCircle(
  { x, y }: Point,
  r: number,
  paper: Paper,
  selected: boolean,
  dimmed: boolean,
) {
  if (!(isFinite(x) && isFinite(y) && isFinite(r) && r > 0)) {
    return
  }

  const { ctx, scale } = paper

  if (dimmed) {
    ctx.globalAlpha = 0.3
  }

  if (selected) {
    ctx.beginPath()
    ctx.lineWidth = 8 * scale
    paper.circle({ x, y }, r)
    ctx.strokeStyle = "#388c4660"
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.lineWidth = 3 * scale
  paper.circle({ x, y }, r)
  ctx.strokeStyle = "#388c46"
  ctx.stroke()

  if (dimmed) {
    ctx.globalAlpha = 1
  }
}

export function drawCircle2(
  paper: Paper2,
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
      drag: props.drag,
      pick: props.pick,
    }),
  )
}

export const EXT_CIRCLE = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "circle") {
      return {
        value: value as JsValue<"circle">,
        paper: expr.sheet.paper,
        expr,
      }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      drawCircle2(paper, {
        at: unpt(val.center),
        r: num(val.radius),
        dimmed: DIMMED.get(data.expr),
        pick: pick(val, "c", data),
      })
    }
  },
})
