import { defineExt, Prop } from ".."
import { distLinePt } from "../../../eval/ops/fn/geo/distance"
import { each, type JsValue, type SPoint } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { gliderOnLine } from "../../../eval/ty/info"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { Block, L, R } from "../../../field/model"
import type { Paper } from "../../ui/paper"

export function drawSegment(
  segment: [SPoint, SPoint],
  paper: Paper,
  selected: boolean,
) {
  const x1 = num(segment[0].x)
  const y1 = num(segment[0].y)
  const x2 = num(segment[1].x)
  const y2 = num(segment[1].y)

  const o1 = paper.paperToCanvas({ x: x1, y: y1 })
  const o2 = paper.paperToCanvas({ x: x2, y: y2 })
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const { ctx, scale } = paper

  if (selected) {
    ctx.beginPath()
    ctx.lineWidth = 8 * scale
    ctx.strokeStyle = "#2d70b360"
    ctx.moveTo(o1.x, o1.y)
    ctx.lineTo(o2.x, o2.y)
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.lineWidth = 3 * scale
  ctx.strokeStyle = "#2d70b3"
  ctx.moveTo(o1.x, o1.y)
  ctx.lineTo(o2.x, o2.y)
  ctx.stroke()
}

const SELECTED = new Prop(() => false)

export const EXT_SEGMENT = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "segment") {
      return {
        value: value as JsValue<"segment">,
        paper: expr.sheet.paper,
        expr,
      }
    }
  },
  plot2d(data, paper) {
    for (const segment of each(data.value)) {
      drawSegment(segment, paper, SELECTED.get(data.expr))
    }
  },
  layer() {
    return 2
  },
  select: {
    ty(data) {
      return data.value.type
    },
    on(data, at) {
      if (data.value.list !== false) {
        return
      }

      const p1 = unpt(data.value.value[0])
      const p2 = unpt(data.value.value[1])
      const l1 = data.paper.paperToCanvas(p1)
      const l2 = data.paper.paperToCanvas(p2)
      const pt = data.paper.paperToCanvas(at)

      if (distLinePt([l1, l2], pt) <= 12 * data.paper.scale) {
        const { value: index } = gliderOnLine([p1, p2], at, data.paper)
        if (0 <= index && index <= 1) {
          SELECTED.set(data.expr, true)
          console.log("selecting")
          return { ...data, value: data.value }
        }
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

      const name = data.expr.sheet.scope.name("l")
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
