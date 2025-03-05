import { js } from "../eval/js"
import { each, type TyName } from "../eval/ty"
import { TY_INFO } from "../eval/ty/info"
import { CmdValue } from "../field/cmd/leaf/value"
import { L, R } from "../field/model"
import { virtualPoint } from "../pkg/geo/pick-point"
import type { ItemRef } from "./items"
import type { Picker } from "./pick"
import type { Expr } from "./ui/expr"
import { Sheet, type Selected } from "./ui/sheet"

export interface Data {
  expr: Expr
  ref: ItemRef<Expr>
}

const ID = Math.random()

let added = new WeakSet<Sheet>()

export const PICK_CURSOR: Picker<Data, Selected> = {
  id() {
    return ID
  },
  init(_, sheet) {
    sheet.paper.el.dataset.nyaPicking = Object.keys(TY_INFO).join(" ")

    if (!added.has(sheet)) {
      sheet.paper.el.addEventListener("focus", () => {
        if (sheet.pick.id == ID) {
          ;(sheet.pick.data as Data).expr.focus()
        }
      })

      addEventListener("keyup", (e) => {
        if (e.key == "Shift") {
          if (sheet.pick.id == ID) {
            sheet.pick.cancel()
          }
        }
      })
    }

    sheet.paper.queue()
  },
  find(_, at, sheet) {
    const [a] = sheet.select(at, Object.keys(TY_INFO) as TyName[])
    if (a) {
      return a
    }

    return virtualPoint(at, sheet)
  },
  draw(data, found) {
    if (!found) return

    const sel = data.expr.field.sel.clone()
    const oldContents = sel.splice()
    const cursor = sel.cursor(R)

    try {
      data.expr.field.options.beforeInsert?.(cursor)
      new CmdValue({ ...found.val, list: false }).insertAt(cursor, L)
      let ast = data.expr.field.block.expr(true)
      if (ast.type == "binding") {
        if (ast.params) {
          return
        }
        ast = ast.value
      }

      try {
        const value = js(ast, data.expr.field.scope.propsJs)
        const { preview: draw } = TY_INFO[value.type]
        if (draw) {
          for (const val of each(value)) {
            draw(data.expr.sheet.paper, val as never)
          }
        }
      } catch (e) {
        console.warn(
          "[pickcursor.preview]",
          e instanceof Error ? e.message : String(e),
        )
      }
    } finally {
      sel.remove()
      oldContents.insertAt(sel.cursor(R), L)
      found.draw?.()
    }
  },
  select(data, found) {
    data.expr.field.onBeforeChange()
    const cursor = data.expr.field.sel.remove()
    data.expr.field.options.beforeInsert?.(cursor)
    found.ref().insertAt(cursor, L)
    data.expr.field.options.afterInsert?.(cursor)
    data.expr.field.sel = cursor.selection()
    data.expr.field.onAfterChange(false)
    data.expr.field.el.focus()

    return { pick: PICK_CURSOR, data }
  },
  cancel() {},
  suppress(data, found) {
    return found && data.ref
  },
}
