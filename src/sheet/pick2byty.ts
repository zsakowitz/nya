import type { JsVal, TyName } from "../eval/ty"
import { OpEq } from "../field/cmd/leaf/cmp"
import { CmdComma } from "../field/cmd/leaf/comma"
import { CmdVar } from "../field/cmd/leaf/var"
import { CmdBrack } from "../field/cmd/math/brack"
import { Block, L, R } from "../field/model"
import { virtualPoint } from "../pkg/geo/pick-point"
import { definePicker, type Picker2 } from "./pick2"
import { Expr } from "./ui/expr"
import type { Selected, Sheet } from "./ui/sheet"

interface Source {
  id: number
  output: { tag: string; fn: string } | null
  next(args: JsVal[]): readonly TyName[] | null
  draw(sheet: Sheet, args: JsVal[]): void
}

export interface Data2 {
  vals: readonly Selected[]
  src: Source
  next: readonly TyName[]
}

export const PICK2: Picker2<Data2, Selected> = definePicker<Data2, Selected>({
  id(data) {
    return data.src.id
  },
  find(data, at, sheet) {
    const [a] = sheet.select(at, data.next)
    if (a) {
      return a
    }

    if (data.next.includes("point32") || data.next.includes("point64")) {
      return virtualPoint(at, sheet)
    }

    return null
  },
  draw(data, found, sheet) {
    const args = data.vals.map((x) => x.val)
    if (found) {
      args.push(found.val)
    }
    data.src.draw(sheet, args)
    for (const val of data.vals) {
      val.draw?.()
    }
    found?.draw?.()
  },
  select(data, found, sheet) {
    const args = data.vals.map((x) => x.val)
    args.push(found.val)
    const next = data.src.next(args)

    if (next != null) {
      return {
        pick: PICK2,
        data: {
          src: data.src,
          next,
          vals: [...data.vals, found],
        } satisfies Data2,
      }
    }

    if (data.src.output) {
      const refs = []
      for (const arg of data.vals) {
        refs.push(arg.ref())
      }
      const valueRef =
        args.slice(0, -1).includes(found.val) ? refs.pop()! : found.ref()

      const expr = new Expr(sheet)
      const name = sheet.scope.name(data.src.output.tag)
      const cursor = expr.field.block.cursor(R)
      CmdVar.leftOf(cursor, name, expr.field.options)
      new OpEq(false).insertAt(cursor, L)
      for (const char of data.src.output.fn) {
        new CmdVar(char, sheet.options).insertAt(cursor, L)
      }
      const inner = new Block(null)
      new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
      {
        const cursor = inner.cursor(R)
        for (const arg of refs) {
          arg.insertAt(cursor, L)
          new CmdComma().insertAt(cursor, L)
        }
        valueRef.insertAt(cursor, L)
      }

      expr.field.dirtyAst = expr.field.dirtyValue = true
      expr.field.trackNameNow()
      expr.field.scope.queueUpdate()
    } else {
      for (const arg of data.vals) {
        arg.ref()
      }
      found.ref()
    }

    const initial = data.src.next([])
    if (!initial) {
      return null
    }
    return {
      pick: PICK2,
      data: {
        src: data.src,
        next: initial,
        vals: [],
      } satisfies Data2,
    }
  },
  cancel() {},
})

export function definePick2<
  const K extends readonly [readonly TyName[], ...(readonly TyName[][])],
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
): Data2

export function definePick2(
  tag: string,
  fn: string | null,
  steps: readonly [readonly TyName[], ...(readonly TyName[][])],
  draw: (sheet: Sheet, ...args: JsVal[]) => void,
): Data2 {
  return {
    next: steps[0],
    vals: [],
    src: {
      id: Math.random(),
      output: fn == null ? null : { fn, tag },
      next(args) {
        return steps[args.length] ?? null
      },
      draw(sheet, args) {
        draw(sheet, ...args)
      },
    },
  }
}
