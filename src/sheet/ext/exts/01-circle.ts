import { Prop } from ".."
import { distCirclePt } from "../../../eval/ops/fn/geo/distance"
import { each, type JsValue } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { Block, L, R } from "../../../field/model"
import type { Paper, Point } from "../../ui/paper"
import { defineHideable } from "../hideable"

const SELECTED = new Prop(() => false)
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
  plot2d(data, paper) {
    for (const { center, radius } of each(data.value)) {
      drawCircle(
        unpt(center),
        num(radius),
        paper,
        SELECTED.get(data.expr),
        DIMMED.get(data.expr),
      )
    }
  },
  layer() {
    return 2
  },
  select: {
    ty() {
      return "circle"
    },
    dim(data) {
      DIMMED.set(data.expr, true)
    },
    undim(data) {
      DIMMED.set(data.expr, false)
    },
    on(data, at) {
      if (data.value.list !== false) {
        return
      }

      const cx = data.paper.paperToCanvas(unpt(data.value.value.center))
      const r = num(data.value.value.radius)
      const rx = (r * data.paper.el.width) / data.paper.bounds().w
      const ry = (r * data.paper.el.height) / data.paper.bounds().h
      const pt = data.paper.paperToCanvas(at)
      const dist = distCirclePt(cx, { x: rx, y: ry }, pt)

      if (dist <= 12 * data.paper.scale) {
        SELECTED.set(data.expr, true)
        return { ...data, value: data.value }
      }
    },
    off(data) {
      SELECTED.set(data.expr, false)
    },
    val(data) {
      return data.value
    },
    ref(data) {
      if (data.expr.field.ast.type == "binding") {
        const block = new Block(null)
        CmdVar.leftOf(
          block.cursor(R),
          data.expr.field.ast.name,
          data.expr.field.options,
        )
        return block
      }

      const name = data.expr.sheet.scope.name("c")
      const c = data.expr.field.block.cursor(L)
      CmdVar.leftOf(c, name, data.expr.field.options)
      new OpEq(false).insertAt(c, L)
      const block = new Block(null)
      CmdVar.leftOf(block.cursor(R), name, data.expr.field.options)
      data.expr.field.dirtyAst = data.expr.field.dirtyValue = true
      data.expr.field.trackNameNow()
      data.expr.field.scope.queueUpdate()

      return block
    },
  },
})
