import { createPicker } from "."
import { parallelJs } from "../../pkg/geo/fn/parallel"
import { perpendicularJs } from "../../pkg/geo/fn/perpendicular"
import type { JsVal, SPoint, TyName } from "../../eval/ty"
import { unpt } from "../../eval/ty/create"
import { OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdVar } from "../../field/cmd/leaf/var"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { drawCircle } from "../ext/exts/01-circle"
import { drawLine } from "../ext/exts/01-line"
import { drawPoint } from "../ext/exts/01-point"
import { drawPolygon } from "../ext/exts/01-polygon"
import { drawRay } from "../ext/exts/01-ray"
import { drawSegment } from "../ext/exts/01-segment"
import { drawVector } from "../ext/exts/01-vector"
import { Expr } from "../ui/expr"
import { Selected, Sheet } from "../ui/sheet"
import { virtualPoint } from "./point"

export interface ExtByTy<T extends readonly TyName[]> {
  readonly id: number
  readonly output: { tag: string; fn: string } | null

  allowExistingPoint?(args: { [K in keyof T]?: JsVal<T[K]> }): boolean

  draw(sheet: Sheet, args: { [K in keyof T]?: JsVal<T[K]> }): void

  /**
   * Return a list of type names to accept a new type. Return `true` to finish
   * the construction and add it to the expression list.
   */
  next(args: { [K in keyof T]?: JsVal<T[K]> }): readonly TyName[] | null
}

export interface PropsByTy<T extends readonly TyName[] = readonly TyName[]> {
  chosen: readonly Selected[]
  next: readonly TyName[]
  ext: ExtByTy<T>
}

export const PICK_BY_TY = createPicker<PropsByTy, Selected>({
  id(data) {
    return data.ext.id
  },
  init(data, sheet) {
    const maybePoint = data.next.some((x) => x == "point32" || x == "point64")

    sheet.checkDim(
      maybePoint ?
        [...data.next, "point32", "point64", "line", "ray", "segment", "circle"]
      : data.next,
    )
  },
  find(data, at, sheet) {
    const maybePoint = data.next.some((x) => x == "point32" || x == "point64")

    if (
      maybePoint &&
      data.ext.allowExistingPoint?.(data.chosen.map((x) => x.val))
    ) {
      for (const pt of data.chosen) {
        if (pt.val.type == "point32" || pt.val.type == "point64") {
          if (
            sheet.paper.canvasDistance(at, unpt(pt.val.value as SPoint)) <=
            12 * sheet.paper.scale
          ) {
            return pt
          }
        }
      }
    }

    const [hovered] = sheet.select(
      at,
      data.next,
      1,
      maybePoint ?
        [...data.next, "point32", "point64", "line", "ray", "segment", "circle"]
      : data.next,
    )

    if (hovered) {
      return hovered
    } else if (maybePoint) {
      return virtualPoint(at, sheet)
    } else {
      return null
    }
  },
  draw(data, value, sheet) {
    const args = data.chosen.map((x) => x.val)
    if (value) {
      args.push(value.val)
    }
    data.ext.draw(sheet, args)

    for (const el of data.chosen) {
      el.draw?.()
    }
    if (value) {
      value.draw?.()
    }
  },
  select(data, value, sheet) {
    const args = data.chosen.map((x) => x.val)
    args.push(value.val)
    const next = data.ext.next(args)

    if (next != null) {
      sheet.setPick(PICK_BY_TY, {
        ext: data.ext,
        next,
        chosen: [...data.chosen, value],
      })
      return
    }

    if (data.ext.output) {
      const argRefs = []
      for (const arg of data.chosen) {
        argRefs.push(arg.ref())
      }
      const valueRef =
        args.slice(0, -1).includes(value.val) ? argRefs.pop()! : value.ref()

      const expr = new Expr(sheet)
      const name = sheet.scope.name(data.ext.output.tag)
      const cursor = expr.field.block.cursor(R)
      CmdVar.leftOf(cursor, name, expr.field.options)
      new OpEq(false).insertAt(cursor, L)
      for (const char of data.ext.output.fn) {
        new CmdVar(char, sheet.options).insertAt(cursor, L)
      }
      const inner = new Block(null)
      new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
      {
        const cursor = inner.cursor(R)
        for (const arg of argRefs) {
          arg.insertAt(cursor, L)
          new CmdComma().insertAt(cursor, L)
        }
        valueRef.insertAt(cursor, L)
      }

      expr.field.dirtyAst = expr.field.dirtyValue = true
      expr.field.trackNameNow()
      expr.field.scope.queueUpdate()
    } else {
      for (const arg of data.chosen) {
        arg.ref()
      }
      value.ref()
    }

    const initial = data.ext.next([])
    if (initial) {
      sheet.setPick(PICK_BY_TY, { ext: data.ext, chosen: [], next: initial })
    }
  },
  cancel() {},
})

function createExt<const K extends (readonly TyName[])[]>(
  tag: string,
  fn: string | null,
  steps: K,
  draw: (
    sheet: Sheet,
    ...args: Partial<{
      [M in keyof K]: K[M][number] extends infer T ?
        T extends infer U extends TyName ?
          JsVal<U>
        : never
      : never
    }>
  ) => void,
): PropsByTy {
  if (steps.length == 0) {
    throw new Error("Cannot call 'createStandardPicker' with zero steps.")
  }

  return {
    chosen: [],
    next: steps[0]!,
    ext: {
      id: Math.random(),
      output: fn ? { tag, fn } : null,
      draw(sheet, args) {
        draw(sheet, ...(args satisfies readonly (JsVal | undefined)[] as any))
      },
      next(args) {
        return steps[args.length] ?? null
      },
    },
  }
}

export const PICK_POINT = createExt(
  "p",
  null,
  [["point32", "point64"]],
  () => {},
)

export const PICK_LINE = createExt(
  "l",
  "line",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawLine([p1.value, p2.value], sheet.paper, false, false)
    }
  },
)

export const PICK_SEGMENT = createExt(
  "l",
  "segment",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawSegment([p1.value, p2.value], sheet.paper, false, false)
    }
  },
)

export const PICK_RAY = createExt(
  "l",
  "ray",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawRay([p1.value, p2.value], sheet.paper, false, false)
    }
  },
)

export const PICK_VECTOR = createExt(
  "l",
  "vector",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawVector([p1.value, p2.value], sheet.paper)
    }
  },
)

export const PICK_CIRCLE = createExt(
  "c",
  "circle",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const center = unpt(p1.value)
      const edge = unpt(p2.value)
      const radius = Math.hypot(center.x - edge.x, center.y - edge.y)
      drawCircle(center, radius, sheet.paper, false, false)
    }
  },
)

export const PICK_PERPENDICULAR = createExt(
  "l",
  "perpendicular",
  [
    ["segment", "ray", "line", "vector"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const line = perpendicularJs(p1, p2)
      drawLine(line, sheet.paper, false, false)
    }
  },
)

export const PICK_PARALLEL = createExt(
  "l",
  "parallel",
  [
    ["segment", "ray", "line", "vector"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const line = parallelJs(p1, p2)
      drawLine(line, sheet.paper, false, false)
    }
  },
)

export const PICK_MIDPOINT: PropsByTy = {
  chosen: [],
  next: ["point32", "point64", "segment"],
  ext: {
    id: Math.random(),
    output: { tag: "p", fn: "midpoint" },
    next(args) {
      if (args.length == 0) {
        return ["point32", "point64", "segment"]
      }
      if (args.length == 2) {
        return null
      }
      return args[0]?.type == "segment" ? null : ["point32", "point64"]
    },
    draw(sheet, args) {
      const [a, b] = args as
        | []
        | [JsVal<"segment">]
        | [JsVal<"point32" | "point64">, JsVal<"point32" | "point64">]

      let p1, p2
      if (a?.type == "segment") {
        p1 = unpt(a.value[0])
        p2 = unpt(a.value[1])
      } else if (a && b) {
        p1 = unpt(a.value)
        p2 = unpt(b.value)
      } else {
        return
      }

      drawPoint(sheet.paper, { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 })
    },
  },
}

export const PICK_POLYGON: PropsByTy = {
  chosen: [],
  next: ["point32", "point64"],
  ext: {
    id: Math.random(),
    output: { tag: "P", fn: "polygon" },
    allowExistingPoint(args) {
      return args.length >= 2
    },
    next(args) {
      if (args.length < 2) {
        return ["point32", "point64"]
      }
      if (
        args[0] == args[args.length - 1] ||
        args[args.length - 2] == args[args.length - 1]
      ) {
        return null
      }
      return ["point32", "point64"]
    },
    draw(sheet, args) {
      if (args.length < 2) return

      const pts = args as JsVal<"point32" | "point64">[]

      drawPolygon(
        pts.map((x) => x.value),
        sheet.paper,
        false,
        false,
      )
    },
  },
}
