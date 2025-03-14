import { Store, type Ext } from "."
import { h, hx } from "../../jsx"
import type { Expr } from "../ui/expr"
import { circle } from "../ui/expr/circle"

const CHECKBOX = new Store((expr) => {
  let show = false

  const circEmpty = circle("empty")
  const circShader = circle("shaderon")
  circEmpty.classList.add("hidden")

  const field = hx("input", {
    type: "checkbox",
    class: "sr-only",
    autocomplete: "off",
  })
  field.checked = show
  field.addEventListener("input", () => setShow(field.checked))

  const el = hx(
    "label",
    "",
    field,
    h("sr-only", "plot this item?"),
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

export function defineHideable<T extends WeakKey, U>(
  ext: Omit<Ext<T, U>, "aside">,
): Ext<T, U> {
  const { plot } = ext
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
    plot: plot && {
      order: plot.order,
      items(data) {
        return plot.items(data)
      },
      draw(data, item) {
        const expr = map.get(data)
        if (expr && !CHECKBOX.get(expr).show) {
          plot.draw(data, item)
        }
      },
      target: plot.target && {
        ...plot.target,
        hits(target, at, hint) {
          const expr = map.get(target.data)
          return (
            expr != null &&
            !CHECKBOX.get(expr).show &&
            plot.target!.hits(target, at, hint)
          )
        },
      },
    },
  }
}
