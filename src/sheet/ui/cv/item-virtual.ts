import type { JsVal } from "@/eval/ty"
import { pt, real, unpt } from "@/eval/ty/create"
import { OpEq } from "@/field/cmd/leaf/cmp"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdToken } from "@/field/cmd/leaf/token"
import { CmdVar } from "@/field/cmd/leaf/var"
import { CmdBrack } from "@/field/cmd/math/brack"
import { Block, L, R } from "@/field/model"
import { FN_GLIDER } from "@/pkg/geo/point"
import type { Point } from "../../point"
import { Writer } from "../../write"
import { Expr } from "../expr"
import type { Sheet } from "../sheet"
import { Color, Size } from "./consts"
import { FN_INTERSECTION } from "./item"
import type { ItemWithDrawTarget, ItemWithTarget } from "./move"

const TARGET_INTERSECTION: ItemWithDrawTarget<
  null,
  {
    sheet: Sheet
    a: ItemWithTarget
    b: ItemWithTarget
    at: Point
    ref?: CmdToken | undefined
    val?: JsVal<"point32">
  }
>["target"] = {
  hits() {
    return true
  },
  focus() {},
  ref({ item }) {
    let { sheet, ref, a, b } = item
    if (ref) {
      const ret = new Block(null)
      ref.clone().insertAt(ret.cursor(R), L)
      return ret
    }

    const expr = Expr.of(sheet, true)
    item.ref = ref = CmdToken.new(sheet.scope)
    const cursor = expr.field.block.cursor(R)
    ref.insertAt(cursor, L)
    new OpEq(false).insertAt(cursor, L)
    const inner = new Block(null)
    for (const l of "intersection") {
      new CmdVar(l, sheet.options).insertAt(cursor, L)
    }
    new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
    a.target.ref(a).insertAt(inner.cursor(R), L)
    new CmdComma().insertAt(inner.cursor(R), L)
    b.target.ref(b).insertAt(inner.cursor(R), L)
    expr.field.dirtyAst = expr.field.dirtyValue = true
    expr.field.trackNameNow()
    expr.field.scope.queueUpdate()

    const ret = new Block(null)
    ref.clone().insertAt(ret.cursor(R), L)
    return ret
  },
  val({ item }): JsVal<"point32"> {
    return (item.val ??= {
      type: "point32",
      value: pt(real(item.at.x), real(item.at.y)),
    })
  },
  toggle({ item: { sheet, a, b } }, on, reason) {
    if (on) {
      a.target.toggle(a, on, reason)
      b.target.toggle(b, on, reason)
    }
    if (reason == "pick") {
      sheet.cv.cursor(on ? "pointer" : "default")
    }
    if (!on) {
      b.target.toggle(b, on, reason)
      a.target.toggle(a, on, reason)
    }

    sheet.cv.queue()
  },
  draw({ item: { at, sheet } }, picked) {
    sheet.cv.point(at, picked ? Size.PointHaloThin : Size.Point, Color.Purple)
  },
}

export function virtualIntersection(
  sheet: Sheet,
  a: ItemWithTarget,
  b: ItemWithTarget,
): ItemWithDrawTarget | undefined {
  const at = unpt(
    FN_INTERSECTION.js1(sheet.scope.ctxJs, a.target.val(a), b.target.val(b))
      .value,
  )

  return {
    data: null,
    index: 0,
    item: { sheet, at, a, b },
    target: TARGET_INTERSECTION,
    virtualPoint: at,
  }
}

const TARGET_GLIDER: ItemWithDrawTarget<
  null,
  {
    sheet: Sheet
    at: Point
    item: ItemWithTarget
    index: { value: number; precision: number }
    ref?: CmdToken | undefined
    val?: JsVal<"point32">
  }
>["target"] = {
  hits() {
    return true
  },
  focus() {},
  ref({ item }) {
    let { item: on, sheet, ref, index } = item
    if (ref) {
      const ret = new Block(null)
      ref.clone().insertAt(ret.cursor(R), L)
      return ret
    }

    const expr = Expr.of(sheet, true)
    item.ref = ref = CmdToken.new(sheet.scope)
    const cursor = expr.field.block.cursor(R)
    ref.insertAt(cursor, L)
    new OpEq(false).insertAt(cursor, L)
    const inner = new Block(null)
    for (const c of "glider") {
      new CmdVar(c, expr.sheet.options).insertAt(cursor, L)
    }
    new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
    on.target.ref(on).insertAt(inner.cursor(R), L)
    new CmdComma().insertAt(inner.cursor(R), L)
    new Writer(inner.cursor(R).span()).set(index.value, index.precision, false)
    expr.field.dirtyAst = expr.field.dirtyValue = true
    expr.field.trackNameNow()
    expr.field.scope.queueUpdate()

    const ret = new Block(null)
    ref.clone().insertAt(ret.cursor(R), L)
    return ret
  },
  val({ item }): JsVal<"point32"> {
    return (item.val ??= {
      type: "point32",
      value: pt(real(item.at.x), real(item.at.y)),
    })
  },
  toggle({ item: { sheet, item } }, on, reason) {
    if (on) {
      item.target.toggle(item, on, reason)
    }
    if (reason == "pick") {
      sheet.cv.cursor(on ? "pointer" : "default")
    }
    if (!on) {
      item.target.toggle(item, on, reason)
    }

    sheet.cv.queue()
  },
  draw({ item: { at, sheet } }, picked) {
    sheet.cv.point(at, picked ? Size.PointHaloThin : Size.Point, Color.Purple)
    sheet.cv.point(at, Size.PointHaloWide, Color.Purple, 0.3)
  },
}

export function virtualGlider(
  sheet: Sheet,
  item: ItemWithTarget,
  index: { value: number; precision: number },
): ItemWithDrawTarget | undefined {
  const at = unpt(
    FN_GLIDER.js1(sheet.scope.ctxJs, item.target.val(item), {
      type: "r32",
      value: real(index.value),
    } satisfies JsVal<"r32">).value,
  )
  return {
    data: 0,
    item: {
      sheet,
      item,
      index,
      at,
    },
    index: 0,
    target: TARGET_GLIDER,
    virtualPoint: at,
  }
}

const TARGET_VPOINT: ItemWithDrawTarget<
  null,
  {
    sheet: Sheet
    at: Point
    ref?: CmdToken | undefined
    val?: JsVal<"point32">
  }
>["target"] = {
  hits() {
    return true
  },
  focus() {},
  ref({ item }) {
    let { at, sheet, ref } = item
    if (ref) {
      const ret = new Block(null)
      ref.clone().insertAt(ret.cursor(R), L)
      return ret
    }

    const expr = Expr.of(sheet, true)
    item.ref = ref = CmdToken.new(sheet.scope)
    const cursor = expr.field.block.cursor(R)
    ref.insertAt(cursor, L)
    new OpEq(false).insertAt(cursor, L)
    const inner = new Block(null)
    new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
    new Writer(inner.cursor(R).span()).set(at.x, sheet.cv.xPrecision, false)
    new CmdComma().insertAt(inner.cursor(R), L)
    new Writer(inner.cursor(R).span()).set(at.y, sheet.cv.yPrecision, false)
    expr.field.dirtyAst = expr.field.dirtyValue = true
    expr.field.trackNameNow()
    expr.field.scope.queueUpdate()

    const ret = new Block(null)
    ref.clone().insertAt(ret.cursor(R), L)
    return ret
  },
  val({ item }): JsVal<"point32"> {
    return (item.val ??= {
      type: "point32",
      value: pt(real(item.at.x), real(item.at.y)),
    })
  },
  toggle({ item: { sheet } }, on, reason) {
    sheet.cv.queue()
    if (reason == "pick" && !on) {
      sheet.cv.cursor("default")
    }
  },
  draw({ item: { at, sheet } }, picked) {
    if (picked) sheet.cv.cursor("pointer")
    sheet.cv.point(at, picked ? Size.PointHaloThin : Size.Point, Color.Purple)
    sheet.cv.point(at, Size.PointHaloWide, Color.Purple, 0.3)
  },
}

export function virtualPoint3(
  sheet: Sheet,
  at: Point,
): ItemWithDrawTarget | undefined {
  return {
    data: null,
    index: 0,
    item: { sheet, at },
    target: TARGET_VPOINT,
    virtualPoint: at,
  }
}
