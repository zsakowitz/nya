import { each, type JsValue, type SPoint } from "../../../eval/ty"
import { num, rept, unpt } from "../../../eval/ty/create"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdDot } from "../../../field/cmd/leaf/dot"
import { CmdNum } from "../../../field/cmd/leaf/num"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { CmdBrack } from "../../../field/cmd/math/brack"
import { Block, L, R } from "../../../field/model"
import { sx } from "../../../jsx"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Expr } from "../../../sheet/ui/expr"
import type { Paper } from "../../../sheet/ui/paper"
import {
  segmentByOffset,
  type Paper2,
  type Point,
} from "../../../sheet/ui/paper2"

export function drawPolygon(
  polygon: SPoint[],
  paper: Paper,
  closed: boolean,
  dimmed: boolean,
) {
  const pts = polygon.map(({ x, y }) =>
    paper.paperToCanvas({ x: num(x), y: num(y) }),
  )
  if (pts.length == 0) return

  const { ctx, scale } = paper

  if (dimmed) {
    ctx.globalAlpha = 0.3
  }

  ctx.beginPath()
  ctx.lineWidth = 3 * scale
  ctx.strokeStyle = "#2d70b3"
  ctx.fillStyle = "#2d70b340"
  ctx.moveTo(pts[0]!.x, pts[0]!.y)
  for (const pt of pts.slice(1)) {
    if (!(isFinite(pt.x) && isFinite(pt.y))) return
    ctx.lineTo(pt.x, pt.y)
  }
  if (closed) {
    ctx.lineTo(pts[0]!.x, pts[0]!.y)
  }
  ctx.fill()
  ctx.stroke()

  if (dimmed) {
    ctx.globalAlpha = 1
  }
}

export function drawPolygon2(
  paper: Paper2,
  polygon: Point[],
  props: {
    closed: boolean
    dimmed?: boolean
    pick?: { expr: Expr }
  },
) {
  const pts = polygon.map((pt) => paper.toOffset(pt))
  if (pts.length == 0) return

  if (!pts.every((x) => isFinite(x.x) && isFinite(x.y))) {
    return
  }

  const d =
    `M ${pts[0]!.x} ${pts[0]!.y}` +
    pts
      .slice(1)
      .map(({ x, y }) => ` L ${x} ${y}`)
      .join("") +
    (props.closed ? " Z" : "")

  paper.append(
    "line",
    sx("path", {
      d,
      "stroke-width": 3,
      stroke: "#2d70b3",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      fill: "#2d70b340",
      "stroke-opacity": props.dimmed ? 0.3 : 1,
      "fill-opacity": props.dimmed ? 0.3 : 1,
    }),
  )

  if (props.pick) {
    const { pick } = props
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i]!
      const p2 = pts[(i + 1) % pts.length]!
      segmentByOffset(paper, p1, p2, {
        dimmed: props.dimmed,
        pick: {
          val() {
            return { type: "segment", value: [rept(p1), rept(p2)] }
          },
          ref() {
            let block, cursor

            if (pick.expr.field.ast.type == "binding") {
              block = new Block(null)
              CmdVar.leftOf(
                (cursor = block.cursor(R)),
                pick.expr.field.ast.name,
                pick.expr.field.options,
              )
            } else {
              const name = pick.expr.sheet.scope.name("P")
              const c = pick.expr.field.block.cursor(L)
              CmdVar.leftOf(c, name, pick.expr.field.options)
              new OpEq(false).insertAt(c, L)
              block = new Block(null)
              CmdVar.leftOf(
                (cursor = block.cursor(R)),
                name,
                pick.expr.field.options,
              )
              pick.expr.field.dirtyAst = pick.expr.field.dirtyValue = true
              pick.expr.field.trackNameNow()
              pick.expr.field.scope.queueUpdate()
            }

            const index = new Block(null)
            new CmdDot().insertAt(cursor, L)
            for (const c of "segments") {
              new CmdVar(c, pick.expr.field.options).insertAt(cursor, L)
            }
            new CmdBrack("[", "]", null, index).insertAt(cursor, L)
            {
              const cursor = index.cursor(R)
              for (const char of BigInt(i + 1).toString()) {
                new CmdNum(char).insertAt(cursor, L)
              }
            }

            return block
          },
        },
      })
    }
  }
}

const DIMMED = new Prop(() => false)

export const EXT_POLYGON = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "polygon") {
      return {
        value: value as JsValue<"polygon">,
        expr,
        paper: expr.sheet.paper,
      }
    }
  },
  svg(data, paper) {
    for (const polygon of each(data.value)) {
      drawPolygon2(paper, polygon.map(unpt), {
        closed: true,
        dimmed: DIMMED.get(data.expr),
        pick: { expr: data.expr },
      })
    }
  },
})
