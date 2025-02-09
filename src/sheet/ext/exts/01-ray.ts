import { defineExt, Prop } from ".."
import { distLinePt } from "../../../eval/ops/fn/geo/distance"
import { each, type JsValue, type SPoint, type Tys } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { gliderOnLine } from "../../../eval/ty/info"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { Block, L, R } from "../../../field/model"
import { Paper, Point } from "../../ui/paper"

function getRayBounds(line: Tys["ray"], paper: Paper): [Point, Point] | null {
  const x1 = num(line[0].x)
  const y1 = num(line[0].y)
  const x2 = num(line[1].x)
  const y2 = num(line[1].y)
  const { xmin, w, ymin, h } = paper.bounds()

  if (x1 == x2) {
    if (y1 < y2) {
      if (y1 > ymin + h) {
        return null
      }
      return [
        paper.paperToCanvas({ x: x1, y: y1 }),
        paper.paperToCanvas({ x: x1, y: ymin + h }),
      ]
    }

    if (y1 < ymin) {
      return null
    }
    return [
      paper.paperToCanvas({ x: x1, y: y1 }),
      paper.paperToCanvas({ x: x1, y: ymin }),
    ]
  }

  const m = (y2 - y1) / (x2 - x1)

  if (x1 < x2) {
    if (x1 > xmin + w) {
      return null
    }

    return [
      paper.paperToCanvas({ x: x1, y: y1 }),
      paper.paperToCanvas({ x: xmin + w, y: m * (xmin + w - x1) + y1 }),
    ]
  }

  if (x1 < xmin) {
    return null
  }

  return [
    paper.paperToCanvas({ x: x1, y: y1 }),
    paper.paperToCanvas({ x: xmin, y: m * (xmin - x1) + y1 }),
  ]
}

const SELECTED = new Prop(() => false)

export function drawRay(
  ray: [SPoint, SPoint],
  paper: Paper,
  selected: boolean,
) {
  const x1 = num(ray[0].x)
  const y1 = num(ray[0].y)
  const x2 = num(ray[1].x)
  const y2 = num(ray[1].y)

  if (!(isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2))) {
    return
  }

  const bounds = getRayBounds(ray, paper)
  if (!bounds) return

  const [o1, o2] = bounds
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

export const EXT_RAY = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "ray") {
      return { value: value as JsValue<"ray">, paper: expr.sheet.paper, expr }
    }
  },
  plot2d(data, paper) {
    for (const segment of each(data.value)) {
      drawRay(segment, paper, SELECTED.get(data.expr))
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
        if (0 <= index) {
          SELECTED.set(data.expr, true)
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
