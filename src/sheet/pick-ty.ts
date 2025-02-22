import type { JsVal, SPoint, TyName } from "../eval/ty"
import { unpt } from "../eval/ty/create"
import { OpEq } from "../field/cmd/leaf/cmp"
import { CmdComma } from "../field/cmd/leaf/comma"
import { CmdVar } from "../field/cmd/leaf/var"
import { CmdBrack } from "../field/cmd/math/brack"
import { Block, L, R } from "../field/model"
import { hx } from "../jsx"
import { virtualPoint } from "../pkg/geo/pick-point"
import { definePicker, type Picker } from "./pick"
import { Expr } from "./ui/expr"
import type { Selected, Sheet } from "./ui/sheet"

interface Source {
  id: number
  output: { tag: string; fn: string } | null
  allowExistingPoint?(args: JsVal[]): boolean
  next(args: JsVal[]): readonly TyName[] | null
  draw(sheet: Sheet, args: JsVal[]): void
}

export interface Data {
  vals: readonly Selected[]
  src: Source
  next: readonly TyName[]
}

export const PICK_TY: Picker<Data, Selected> = definePicker<Data, Selected>({
  id(data) {
    return data.src.id
  },
  init(data, sheet) {
    sheet.paper.el.dataset.nyaPicking = data.next.join(" ")
  },
  find(data, at, sheet) {
    const [a] = sheet.select(at, data.next)
    if (a) {
      return a
    }

    if (data.next.includes("point32") || data.next.includes("point64")) {
      for (const pt of data.vals) {
        if (pt.val.type == "point32" || pt.val.type == "point64") {
          if (
            sheet.paper.offsetDistance(at, unpt(pt.val.value as SPoint)) <= 12
          ) {
            return pt
          }
        }
      }

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
    for (const val of data.vals.filter((x, i, a) => a.indexOf(x) == i)) {
      val.draw()
    }
    if (found) {
      if (data.vals.includes(found)) {
        found.drawFocus?.()
      } else {
        found.draw()
      }
    }
  },
  select(data, found, sheet) {
    const args = data.vals.map((x) => x.val)
    if (!data.src.allowExistingPoint?.(args) && data.vals.includes(found)) {
      return { pick: PICK_TY, data }
    }

    args.push(found.val)
    const next = data.src.next(args)

    if (next != null) {
      return {
        pick: PICK_TY,
        data: {
          src: data.src,
          next,
          vals: [...data.vals, found],
        } satisfies Data,
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
      pick: PICK_TY,
      data: {
        src: data.src,
        next: initial,
        vals: [],
      } satisfies Data,
    }
  },
  cancel(_, sheet) {
    delete sheet.paper.el.dataset.nyaPicking
  },
})

export function definePickTy<
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
): Data

export function definePickTy(
  tag: string,
  fn: string | null,
  steps: readonly [readonly TyName[], ...(readonly TyName[][])],
  draw: (sheet: Sheet, ...args: JsVal[]) => void,
): Data {
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

export function toolbar(icon: () => HTMLSpanElement, props: Data) {
  return (sheet: Sheet) => {
    const btn = hx(
      "button",
      "w-12 hover:bg-[--nya-bg] border-x border-transparent hover:border-[--nya-border] focus:outline-none -mr-px last:mr-0 focus-visible:bg-[--nya-sidebar-hover]",
      icon(),
    )
    sheet.pick.onChange.push(() => {
      if (sheet.pick.id == props.src.id) {
        btn.classList.add("bg-[--nya-bg]", "border-[--nya-border]")
        btn.classList.remove("border-transparent")
      } else {
        btn.classList.remove("bg-[--nya-bg]", "border-[--nya-border]")
        btn.classList.add("border-transparent")
      }
    })
    btn.addEventListener("click", () => {
      sheet.pick.set(PICK_TY, props)
    })
    return btn
  }
}
