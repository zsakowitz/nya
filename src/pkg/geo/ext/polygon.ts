import { each, type JsVal, type JsValue, type SPoint } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { gliderOnLine } from "../../../eval/ty/info"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdDot } from "../../../field/cmd/leaf/dot"
import { CmdNum } from "../../../field/cmd/leaf/num"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { CmdBrack } from "../../../field/cmd/math/brack"
import { Block, L, R } from "../../../field/model"
import { sx } from "../../../jsx"
import { Prop } from "../../../sheet/ext"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Paper } from "../../../sheet/ui/paper"
import type { DrawProps, Paper2, Point } from "../../../sheet/ui/paper2"
import { distLinePt } from "../fn/distance"

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
  props: DrawProps & { closed: boolean },
) {
  const pts = polygon.map((pt) => paper.toOffset(pt))
  if (pts.length == 0) return

  const d =
    `M ${pts[0]!.x} ${pts[0]!.y}` +
    pts.slice(1).map(({ x, y }) => ` L ${x} ${y}`) +
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
}

const SELECTED = new Prop<[SPoint, SPoint] | null>(() => null)
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
      })
    }
  },
  select: {
    ty() {
      return "segment"
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

      const polygon = data.value.value
      if (polygon.length < 2) return

      for (let i = 0; i < polygon.length; i++) {
        const r1 = polygon[i]!
        const r2 = polygon[(i + 1) % polygon.length]!
        const p1 = unpt(r1)
        const p2 = unpt(r2)
        const l1 = data.paper.paperToCanvas(p1)
        const l2 = data.paper.paperToCanvas(p2)
        const pt = data.paper.paperToCanvas(at)

        if (distLinePt([l1, l2], pt) <= 12 * data.paper.scale) {
          const { value: index } = gliderOnLine([p1, p2], at, data.paper)
          if (0 <= index && index <= 1) {
            SELECTED.set(data.expr, [r1, r2])
            return {
              ...data,
              value: {
                type: "segment",
                value: [r1, r2],
              } satisfies JsVal<"segment">,
              index: i + 1,
            }
          }
        }
      }
    },
    off(data) {
      SELECTED.set(data.expr, null)
    },
    val(data) {
      return data.value
    },
    ref(data) {
      let block, cursor

      if (data.expr.field.ast.type == "binding") {
        block = new Block(null)
        CmdVar.leftOf(
          (cursor = block.cursor(R)),
          data.expr.field.ast.name,
          data.expr.field.options,
        )
      } else {
        const name = data.expr.sheet.scope.name("P")
        const c = data.expr.field.block.cursor(L)
        CmdVar.leftOf(c, name, data.expr.field.options)
        new OpEq(false).insertAt(c, L)
        block = new Block(null)
        CmdVar.leftOf((cursor = block.cursor(R)), name, data.expr.field.options)
        data.expr.field.dirtyAst = data.expr.field.dirtyValue = true
        data.expr.field.trackNameNow()
        data.expr.field.scope.queueUpdate()
      }

      const index = new Block(null)
      new CmdDot().insertAt(cursor, L)
      for (const c of "segments") {
        new CmdVar(c, data.expr.field.options).insertAt(cursor, L)
      }
      new CmdBrack("[", "]", null, index).insertAt(cursor, L)
      {
        const cursor = index.cursor(R)
        for (const char of BigInt(data.index).toString()) {
          new CmdNum(char).insertAt(cursor, L)
        }
      }

      return block
    },
  },
})
