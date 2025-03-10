import { each, type JsValue } from "../../../eval/ty"
import { rept, unpt } from "../../../eval/ty/create"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdDot } from "../../../field/cmd/leaf/dot"
import { CmdNum } from "../../../field/cmd/leaf/num"
import { CmdToken } from "../../../field/cmd/leaf/token"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { CmdBrack } from "../../../field/cmd/math/brack"
import { Block, L, R } from "../../../field/model"
import { sx } from "../../../jsx"
import { defineHideable } from "../../../sheet/ext/hideable"
import type { Point } from "../../../sheet/point"
import type { Expr } from "../../../sheet/ui/expr"
import { segmentByPaper, type Paper } from "../../../sheet/ui/paper"

export function drawPolygon(
  paper: Paper,
  polygon: Point[],
  props: {
    closed: boolean
    dimmed?: boolean
    pick?: { expr: Expr }
    ghost?: boolean
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
      class: props.ghost ? "pointer-events-none" : "",
    }),
  )

  if (!props.ghost && props.pick) {
    const { pick } = props
    for (let i = 0; i < pts.length; i++) {
      const p1 = polygon[i]!
      const p2 = polygon[(i + 1) % pts.length]!
      segmentByPaper(paper, p1, p2, {
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
                pick.expr.field.ctx,
              )
            } else {
              const name = CmdToken.new(pick.expr.field.ctx)
              const c = pick.expr.field.block.cursor(L)
              name.insertAt(c, L)
              new OpEq(false).insertAt(c, L)
              block = new Block(null)
              name.clone().insertAt((cursor = block.cursor(R)), L)
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
          focus() {
            requestAnimationFrame(() => props.pick!.expr.focus())
          },
        },
        kind: "segment",
      })
    }

    const ring = sx("path", {
      d,
      "stroke-width": 8,
      stroke: "transparent",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "pointer-events-none",
    })

    const target = sx("path", {
      d,
      fill: "transparent",
      pick: {
        draw() {
          ring.setAttribute("stroke", "#2d70b360")
          target.style.cursor = "pointer"
        },
        focus() {
          requestAnimationFrame(() => props.pick!.expr.focus())
        },
        ref() {
          let block

          if (pick.expr.field.ast.type == "binding") {
            block = new Block(null)
            CmdVar.leftOf(
              block.cursor(R),
              pick.expr.field.ast.name,
              pick.expr.field.options,
              pick.expr.field.ctx,
            )
          } else {
            const name = CmdToken.new(pick.expr.field.ctx)
            const c = pick.expr.field.block.cursor(L)
            name.insertAt(c, L)
            new OpEq(false).insertAt(c, L)
            block = new Block(null)
            name.clone().insertAt(block.cursor(R), L)
            pick.expr.field.dirtyAst = pick.expr.field.dirtyValue = true
            pick.expr.field.trackNameNow()
            pick.expr.field.scope.queueUpdate()
          }

          return block
        },
        val() {
          return { type: "polygon", value: polygon.map(rept) }
        },
      },
    })

    paper.append("line", ring)
    paper.append("line", target)
  }
}

export const EXT_POLYGON = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "polygon") {
      return {
        value: value as JsValue<"polygon">,
        expr,
      }
    }
  },
  svg(data, paper) {
    for (const polygon of each(data.value)) {
      drawPolygon(paper, polygon.map(unpt), {
        closed: true,
        pick: { expr: data.expr },
      })
    }
  },
})
