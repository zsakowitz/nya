import type { TyName } from "../eval/ty"
import { TY_INFO } from "../eval/ty/info"
import { L } from "../field/model"
import { virtualPoint } from "../pkg/geo/pick-point"
import type { Picker } from "./pick"
import type { Expr } from "./ui/expr"
import { Sheet, type Selected } from "./ui/sheet"

export interface Data {
  expr: Expr
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
  },
  find(_, at, sheet) {
    const [a] = sheet.select(at, Object.keys(TY_INFO) as TyName[])
    if (a) {
      return a
    }

    return virtualPoint(at, sheet)
  },
  draw(_, found) {
    found?.draw?.()
  },
  select(data, found) {
    data.expr.field.onBeforeChange()
    const cursor = data.expr.field.sel.remove()
    data.expr.field.options.beforeInsert?.(cursor)
    found.ref().insertAt(cursor, L)
    data.expr.field.options.afterInsert?.(cursor)
    data.expr.field.sel = cursor.selection()
    data.expr.field.onAfterChange(false)
    requestAnimationFrame(() => data.expr.field.el.focus())
    return { pick: PICK_CURSOR, data }
  },
  cancel() {},
}
