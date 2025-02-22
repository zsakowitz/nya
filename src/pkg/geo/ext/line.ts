import { each, type JsValue, type Tys } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { Block, L, R } from "../../../field/model"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Paper, Point } from "../../../sheet/ui/paper"
import {
  segmentByOffset,
  type DrawProps,
  type Paper2,
} from "../../../sheet/ui/paper2"
import { distLinePt } from "../fn/distance"

function getLineBounds(
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
  paper: Paper | Paper2,
): [Point, Point] {
  const { xmin, w, ymin, h } = paper.bounds()

  if (x1 == x2) {
    return [
      paper.paperToCanvas({ x: x1, y: ymin }),
      paper.paperToCanvas({ x: x1, y: ymin + h }),
    ]
  }

  const m = (y2 - y1) / (x2 - x1)

  return [
    paper.paperToCanvas({ x: xmin, y: m * (xmin - x1) + y1 }),
    paper.paperToCanvas({ x: xmin + w, y: m * (xmin + w - x1) + y1 }),
  ]
}

export function drawLine(
  line: Tys["line"],
  paper: Paper,
  selected: boolean,
  dimmed: boolean,
) {
  const x1 = num(line[0].x)
  const y1 = num(line[0].y)
  const x2 = num(line[1].x)
  const y2 = num(line[1].y)

  if (!(isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2))) {
    return
  }

  const [o1, o2] = getLineBounds({ x: x1, y: y1 }, { x: x2, y: y2 }, paper)
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const { ctx, scale } = paper

  if (dimmed) {
    ctx.globalAlpha = 0.3
  }

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

  if (dimmed) {
    ctx.globalAlpha = 1
  }
}

export function drawLine2(
  paper: Paper2,
  p1: Point,
  p2: Point,
  props?: DrawProps,
) {
  const [o1, o2] = getLineBounds(p1, p2, paper)
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  segmentByOffset(paper, o1, o2, props)
}

const SELECTED = new Prop(() => false)
const DIMMED = new Prop(() => false)

export const EXT_LINE = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "line") {
      return { value: value as JsValue<"line">, expr, paper: expr.sheet.paper }
    }
  },
  svg(data, paper) {
    for (const val of each(data.value)) {
      drawLine2(paper, unpt(val[0]), unpt(val[1]), {
        dimmed: DIMMED.get(data.expr),
      })
    }
  },
  layer() {
    return 2
  },
  select: {
    ty(data) {
      return data.value.type
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

      const l1 = data.paper.paperToCanvas(unpt(data.value.value[0]))
      const l2 = data.paper.paperToCanvas(unpt(data.value.value[1]))
      const pt = data.paper.paperToCanvas(at)

      if (distLinePt([l1, l2], pt) <= 12 * data.paper.scale) {
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
