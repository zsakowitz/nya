import type { Picker } from "."
import { dist } from "../../eval/ops/fn/geo/distance"
import { FN_INTERSECTION } from "../../eval/ops/fn/geo/intersection"
import { parallelJs } from "../../eval/ops/fn/geo/parallel"
import { perpendicularJs } from "../../eval/ops/fn/geo/perpendicular"
import { type JsVal, type TyName } from "../../eval/ty"
import { num, unpt } from "../../eval/ty/create"
import { OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdVar } from "../../field/cmd/leaf/var"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { drawCircle } from "../ext/exts/01-circle"
import { drawLine } from "../ext/exts/01-line"
import { drawPoint } from "../ext/exts/01-point"
import { drawRay } from "../ext/exts/01-ray"
import { drawSegment } from "../ext/exts/01-segment"
import { drawVector } from "../ext/exts/01-vector"
import { Expr } from "../ui/expr"
import type { Selected, Sheet } from "../ui/sheet"
import { virtualPoint } from "./point"

export function createStandardPicker<
  const K extends readonly (readonly TyName[])[],
>(
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
): Picker<{}, any>

export function createStandardPicker(
  tag: string,
  fn: string | null,
  steps: readonly (readonly TyName[])[],
  draw: (sheet: Sheet, ...args: JsVal[]) => void,
): Picker<{}, any> {
  if (steps.length == 0) {
    throw new Error(
      "'createStandardPicker' must have at least one stage specified.",
    )
  }

  const stages: Picker<Selected[], Selected>[] = []
  const id = Math.random()

  for (let i = 0; i < steps.length; i++) {
    const canBePoint = steps[i]?.some((x) => x == "point32" || x == "point64")
    stages.push({
      id,
      find(_, at, sheet) {
        const [hovered] = sheet.select(at, steps[i]!, 1)

        if (hovered) {
          return hovered
        } else if (canBePoint) {
          return virtualPoint(at, sheet)
        } else {
          return null
        }
      },
      draw(data, value, sheet) {
        const args = data.map((x) => x.val)
        if (value) {
          args.push(value.val)
        }
        draw(sheet, ...args)

        for (const el of data) {
          el.draw?.()
        }
        if (value) {
          value.draw?.()
        }
      },
      select:
        i == steps.length - 1 ?
          (data, value, sheet) => {
            if (fn == null) {
              for (const arg of data) {
                arg.ref()
              }
              value.ref()
              sheet.setPick(initial, [])
              return
            }

            const argRefs = []
            for (const arg of data) {
              argRefs.push(arg.ref())
            }
            const valueRef = value.ref()

            const expr = new Expr(sheet)
            const name = sheet.scope.name(tag)
            const cursor = expr.field.block.cursor(R)
            CmdVar.leftOf(cursor, name, expr.field.options)
            new OpEq(false).insertAt(cursor, L)
            for (const char of fn) {
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

            sheet.setPick(initial, [])
          }
        : (data, value, sheet) => {
            sheet.setPick(stages[i + 1]!, [...data, value])
          },
      cancel() {},
    })
  }

  const initial = stages[0]!

  return {
    id,
    find(_, at, sheet) {
      return initial.find([], at, sheet)
    },
    draw(_, value, sheet) {
      initial.draw([], value, sheet)
    },
    select(_, value, sheet) {
      initial.select([], value, sheet)
    },
    cancel(_) {
      initial.cancel([])
    },
  }
}

export const PICK_POINT = createStandardPicker(
  "p",
  null,
  [["point32", "point64"]],
  () => {},
)

export const PICK_LINE = createStandardPicker(
  "l",
  "line",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawLine([p1.value, p2.value], sheet.paper)
    }
  },
)

export const PICK_SEGMENT = createStandardPicker(
  "l",
  "segment",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawSegment([p1.value, p2.value], sheet.paper)
    }
  },
)

export const PICK_RAY = createStandardPicker(
  "l",
  "ray",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawRay([p1.value, p2.value], sheet.paper)
    }
  },
)

export const PICK_VECTOR = createStandardPicker(
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

export const PICK_CIRCLE = createStandardPicker(
  "c",
  "circle",
  [
    ["point32", "point64"],
    ["point32", "point64", "segment"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const center = unpt(p1.value)

      if (p2.type == "segment") {
        const radius = dist(p2.value[0], p2.value[1])
        drawCircle(center, num(radius), sheet.paper)
      } else {
        const edge = unpt(p2.value)
        const radius = Math.hypot(center.x - edge.x, center.y - edge.y)
        drawCircle(center, radius, sheet.paper)
      }
    }
  },
)

export const PICK_PERPENDICULAR = createStandardPicker(
  "l",
  "perpendicular",
  [
    ["segment", "ray", "line", "vector"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const line = perpendicularJs(p1, p2)
      drawLine(line, sheet.paper)
    }
  },
)

export const PICK_PARALLEL = createStandardPicker(
  "l",
  "parallel",
  [
    ["segment", "ray", "line", "vector"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const line = parallelJs(p1, p2)
      drawLine(line, sheet.paper)
    }
  },
)

export const PICK_INTERSECTION = createStandardPicker(
  "p",
  "intersection",
  [
    ["segment", "ray", "line", "circle"],
    ["segment", "ray", "line", "circle"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      try {
        const pt = FN_INTERSECTION.js1(p1, p2)
        drawPoint(sheet.paper, unpt(pt.value))
      } catch {}
    }
  },
)
