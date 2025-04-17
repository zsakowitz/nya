import type { JsVal, TyName } from "@/eval/ty"
import { OpEq } from "@/field/cmd/leaf/cmp"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdToken } from "@/field/cmd/leaf/token"
import { CmdVar } from "@/field/cmd/leaf/var"
import { CmdBrack } from "@/field/cmd/math/brack"
import { L, R } from "@/field/dir"
import { Block } from "@/field/model"
import { h, hx } from "@/jsx"
import { Order } from "./ui/cv/consts"
import { Hint } from "./ui/cv/item"
import type { ItemWithDrawTarget, VirtualPoint } from "./ui/cv/move"
import type { Picker } from "./ui/cv/pick"
import { Expr } from "./ui/expr"
import type { Selected, Sheet } from "./ui/sheet"

interface Source {
  id: number
  fn: string | null
  allowExistingPoint?(args: JsVal[]): boolean
  next(args: JsVal[]): readonly TyName[] | null
  draw(sheet: Sheet, args: JsVal[]): void
  /**
   * Return `true` if the item has been created; otherwise, return `false` to
   * use the default behavior.
   */
  create?(sheet: Sheet, args: Selected[]): boolean
}

export interface Data {
  vals: readonly ItemWithDrawTarget[]
  src: Source
  next: readonly TyName[]
}

export const PICK_TY: Picker<Data> = {
  id(data) {
    return data.src.id
  },
  toggle() {},
  draw(record, data, found, sheet) {
    const args = data.vals.map((x) => x.target.val(x))
    if (found) {
      args.push(found.target.val(found))
    }
    ;(record[Order.Graph] ??= []).push(() => {
      data.src.draw(sheet, args)
    })
    ;(record[Order.Point] ??= []).push(() => {
      for (const val of data.vals.filter((x, i, a) => a.indexOf(x) == i)) {
        if (val != found) {
          val.target.draw?.(val, false)
        }
      }
    })
  },
  hint(data) {
    return Hint.oneOf(
      data.next,
      data.vals.filter((x): x is VirtualPoint => x.virtualPoint != null),
    )
  },
  suppress() {
    return null
  },
  take(data, found, sheet) {
    if (!found) {
      // TODO: return `data` with empty array to reset state if some items have been chosen already
      return null
    }

    const args = data.vals.map((x) => x.target.val(x))
    if (!data.src.allowExistingPoint?.(args) && data.vals.includes(found)) {
      return data
    }

    const foundVal = found.target.val(found)
    args.push(foundVal)
    const next = data.src.next(args)

    if (next != null) {
      return {
        src: data.src,
        next,
        vals: [...data.vals, found],
      }
    }

    const refs = []
    for (const arg of data.vals) {
      refs.push(arg.target.ref(arg))
    }
    const valueRef =
      args.slice(0, -1).includes(foundVal) ?
        refs.pop()!
      : found.target.ref(found)

    if (
      !data.src.create?.(sheet, [
        ...data.vals.map(
          (item): Selected => ({
            ref() {
              return item.target.ref(item)
            },
            val: item.target.val(item),
          }),
        ),
        {
          ref() {
            return found.target.ref(found)
          },
          val: foundVal,
        },
      ]) &&
      data.src.fn
    ) {
      const expr = Expr.of(sheet, true)
      const cursor = expr.field.block.cursor(R)
      const token = CmdToken.new(expr.field.scope)
      token.insertAt(cursor, L)
      new OpEq(false).insertAt(cursor, L)
      for (const char of data.src.fn) {
        new CmdVar(char, sheet.options).insertAt(cursor, L)
      }
      const inner = new Block(null)
      new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
      {
        LargestContentfulPaint
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
    }

    const initial = data.src.next([])
    if (!initial) {
      return null
    }

    return {
      src: data.src,
      next: initial,
      vals: [],
    }
  },
}

export function definePickTy<
  const K extends readonly [readonly TyName[], ...(readonly TyName[][])],
>(
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
): Data

export function definePickTy(
  fn: string | null,
  steps: readonly [readonly TyName[], ...(readonly TyName[][])],
  draw: (sheet: Sheet, ...args: JsVal[]) => void,
): Data {
  return {
    next: steps[0],
    vals: [],
    src: {
      id: Math.random(),
      fn,
      next(args) {
        return steps[args.length] ?? null
      },
      draw(sheet, args) {
        draw(sheet, ...args)
      },
    },
  }
}

export function toolbar(icon: () => HTMLSpanElement, props: Data, key: string) {
  return (sheet: Sheet) => {
    const btn = hx(
      "button",
      {
        class:
          "flex flex-col w-11 hover:bg-[--nya-bg] border-x border-transparent hover:border-[--nya-border] focus:outline-none -mr-px last:mr-0 justify-center",
        tabindex: "-1",
      },
      icon(),
      h(
        "[line-height:1] -mt-0.5 -mb-1 text-[--nya-title] font-sans text-xs opacity-50",
        key,
      ),
    )
    function check() {
      if (sheet.pick.id == props.src.id) {
        btn.classList.add("bg-[--nya-bg]", "border-[--nya-border]")
        btn.classList.remove("border-transparent")
      } else {
        btn.classList.remove("bg-[--nya-bg]", "border-[--nya-border]")
        btn.classList.add("border-transparent")
      }
    }
    sheet.pick.onChange.push(check)
    check()
    btn.addEventListener("click", () => {
      sheet.pick.set(PICK_TY, props)
    })
    return btn
  }
}
