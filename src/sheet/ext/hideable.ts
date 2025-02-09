import { Store, type Ext } from "."
import { h, hx } from "../../jsx"
import type { Expr } from "../ui/expr"
import { circle } from "../ui/expr/circle"

const CHECKBOX = new Store((expr) => {
  let show = false

  const circEmpty = circle("empty")
  const circShader = circle("shaderon")
  circEmpty.classList.add("hidden")

  const field = hx("input", { type: "checkbox", class: "sr-only" })
  field.checked = show
  field.addEventListener("input", () => setShow(field.checked))

  const el = hx(
    "label",
    "",
    field,
    h("sr-only", "plot this shader?"),
    circEmpty,
    circShader,
  )

  return {
    el,
    get show() {
      return show
    },
    set show(v) {
      setShow(v)
    },
  }

  function setShow(v: boolean) {
    show = v
    circEmpty.classList.toggle("hidden", !v)
    circShader.classList.toggle("hidden", v)
    expr.sheet.paper.queue()
  }
})

export function defineHideable<
  T extends WeakKey,
  U extends {},
  V extends {},
  W extends {},
>(ext: Omit<Ext<T, U, V, W>, "aside">): Ext<T, U, V, W> {
  const { plot2d } = ext
  const map = new WeakMap<T, Expr>()

  return {
    ...ext,
    data(expr) {
      const data = ext.data(expr)
      if (data != null) {
        map.set(data, expr)
        return data
      }
    },
    aside(data) {
      const expr = map.get(data)
      if (expr) {
        return CHECKBOX.get(expr).el
      }
    },
    plot2d(data, paper) {
      if (!CHECKBOX.get(map.get(data)!).show) {
        plot2d?.(data, paper)
      }
    },
  }
}
