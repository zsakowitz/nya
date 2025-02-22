import type { Var } from "../../eval/ast/token"
import type { JsVal } from "../../eval/ty"
import { approx, num, pt, real, unpt } from "../../eval/ty/create"
import { TY_INFO } from "../../eval/ty/info"
import { OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdVar } from "../../field/cmd/leaf/var"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { Expr } from "../../sheet/ui/expr"
import type { Point } from "../../sheet/ui/paper"
import type { Sheet } from "../../sheet/ui/sheet"
import { Writer } from "../../sheet/write"
import { drawPoint, FN_GLIDER, FN_INTERSECTION } from "../geo-point"

export function virtualPoint(at: Point, sheet: Sheet) {
  const objs = sheet.select(at, ["line", "segment", "ray", "circle"])

  intersection: if (objs.length >= 2) {
    let o1 = objs[0]!
    let o2 = objs[1]!

    let val
    try {
      const i1 = FN_INTERSECTION.js1(o1.val, o2.val)
      const i2 = FN_INTERSECTION.js1(o2.val, o1.val)
      const d1 = Math.hypot(at.x - num(i1.value.x), at.y - num(i1.value.y))
      const d2 = Math.hypot(at.x - num(i2.value.x), at.y - num(i2.value.y))
      console.log(o1.val)
      if (d2 < d1) {
        ;[o2, o1] = [o1, o2]
        val = i2
      } else {
        val = i1
      }
    } catch {
      break intersection
    }

    let ref: Var & { sup?: undefined }

    return {
      val,
      ref() {
        if (ref) {
          const ret = new Block(null)
          CmdVar.leftOf(ret.cursor(R), ref, sheet.options)
          return ret
        }

        const r1 = o1.ref()
        const r2 = o2.ref()

        const expr = new Expr(sheet)
        const name = sheet.scope.name("p")
        const cursor = expr.field.block.cursor(R)
        CmdVar.leftOf(cursor, name, expr.field.options)
        new OpEq(false).insertAt(cursor, L)
        for (const char of "intersection") {
          new CmdVar(char, expr.field.options).insertAt(cursor, L)
        }
        const inner = new Block(null)
        new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
        {
          const cursor = inner.cursor(R)
          r1.insertAt(cursor, L)
          new CmdComma().insertAt(inner.cursor(R), L)
          r2.insertAt(cursor, L)
        }
        expr.field.dirtyAst = expr.field.dirtyValue = true
        expr.field.trackNameNow()
        expr.field.scope.queueUpdate()

        ref = name
        const ret = new Block(null)
        CmdVar.leftOf(ret.cursor(R), name, sheet.options)
        return ret
      },
      draw() {
        drawPoint(sheet.paper, { at: unpt(val.value), pointer: true })
      },
    }
  }

  glider: {
    const obj = objs[0]
    if (!obj) break glider

    let index, position
    try {
      index = TY_INFO[obj.val.type].glide?.({
        paper: sheet.paper,
        point: at,
        shape: obj.val.value as never,
      })
      if (!index) break glider

      position = FN_GLIDER.js1(obj.val, {
        type: "r32",
        value: approx(index.value),
      })
    } catch {
      break glider
    }

    let ref: Var & { sup?: undefined }

    return {
      val: position,
      ref() {
        if (ref) {
          const ret = new Block(null)
          CmdVar.leftOf(ret.cursor(R), ref, sheet.options)
          return ret
        }

        const o1 = obj.ref()

        const expr = new Expr(sheet)
        const name = sheet.scope.name("p")
        const cursor = expr.field.block.cursor(R)
        CmdVar.leftOf(cursor, name, expr.field.options)
        new OpEq(false).insertAt(cursor, L)
        for (const char of "glider") {
          new CmdVar(char, expr.field.options).insertAt(cursor, L)
        }
        const inner = new Block(null)
        new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
        {
          const cursor = inner.cursor(R)
          o1.insertAt(cursor, L)
          new CmdComma().insertAt(inner.cursor(R), L)
          new Writer(cursor.span()).set(index.value, index.precision)
        }
        expr.field.dirtyAst = expr.field.dirtyValue = true
        expr.field.trackNameNow()
        expr.field.scope.queueUpdate()

        ref = name
        const ret = new Block(null)
        CmdVar.leftOf(ret.cursor(R), name, sheet.options)
        return ret
      },
      draw() {
        drawPoint(sheet.paper, {
          at: unpt(position.value),
          halo: true,
          pointer: true,
        })
      },
    }
  }

  const val: JsVal<"point64"> = {
    type: "point64",
    value: pt(real(at.x), real(at.y)),
  }

  let ref: Var & { sup?: undefined }

  return {
    val,
    ref() {
      if (ref) {
        const ret = new Block(null)
        CmdVar.leftOf(ret.cursor(R), ref, sheet.options)
        return ret
      }

      const expr = new Expr(sheet)
      const name = sheet.scope.name("p")
      const cursor = expr.field.block.cursor(R)
      CmdVar.leftOf(cursor, name, expr.field.options)
      new OpEq(false).insertAt(cursor, L)
      const inner = new Block(null)
      new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
      new Writer(inner.cursor(R).span()).set(
        at.x,
        sheet.paper.xPrecision,
        false,
      )
      new CmdComma().insertAt(inner.cursor(R), L)
      new Writer(inner.cursor(R).span()).set(
        at.y,
        sheet.paper.yPrecision,
        false,
      )
      expr.field.dirtyAst = expr.field.dirtyValue = true
      expr.field.trackNameNow()
      expr.field.scope.queueUpdate()

      ref = name
      const ret = new Block(null)
      CmdVar.leftOf(ret.cursor(R), name, sheet.options)

      return ret
    },
    draw() {
      drawPoint(sheet.paper, {
        at,
        halo: true,
        ghost: true,
      })
    },
  }
}
