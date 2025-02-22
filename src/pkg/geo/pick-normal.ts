import type { JsVal, SPoint, TyName } from "../../eval/ty"
import { unpt } from "../../eval/ty/create"
import { OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdVar } from "../../field/cmd/leaf/var"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { hx } from "../../jsx"
import { createPicker } from "../../sheet/pick"
import { Expr } from "../../sheet/ui/expr"
import type { Selected, Sheet } from "../../sheet/ui/sheet"
import { virtualPoint } from "./pick-point"

interface ExtByTy<T extends readonly TyName[]> {
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
  init(_, sheet) {
    sheet.checkDim()
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
            sheet.paper2.offsetDistance(at, unpt(pt.val.value as SPoint)) <= 12
          ) {
            return pt
          }
        }
      }
    }

    const [hovered] = sheet.select(at, data.next)

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

export function createPickByTy<const K extends (readonly TyName[])[]>(
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

export function picker(icon: () => HTMLSpanElement, props: PropsByTy) {
  return (sheet: Sheet) => {
    const btn = hx(
      "button",
      "w-12 hover:bg-[--nya-bg] border-x border-transparent hover:border-[--nya-border] focus:outline-none -mr-px last:mr-0 focus-visible:bg-[--nya-sidebar-hover]",
      icon(),
    )
    sheet.handlers.onPickChange.push(() => {
      const current = sheet.handlers.getPick()
      if (current?.from.id(current.data) == props.ext.id) {
        btn.classList.add("bg-[--nya-bg]", "border-[--nya-border]")
        btn.classList.remove("border-transparent")
      } else {
        btn.classList.remove("bg-[--nya-bg]", "border-[--nya-border]")
        btn.classList.add("border-transparent")
      }
    })
    btn.addEventListener("click", () => {
      sheet.setPick(PICK_BY_TY, props)
    })
    return btn
  }
}
