import { fnargs } from "../eval/ast/collect"
import { js } from "../eval/js"
import { frac } from "../eval/ty/create"
import { Display } from "../eval/ty/display"
import { OpEq } from "../field/cmd/leaf/cmp"
import { CmdVar } from "../field/cmd/leaf/var"
import { Block, L, R } from "../field/model"
import { h, hx } from "../jsx"
import type { Package } from "../pkg"
import { defineExt, Store } from "../sheet/ext"

const store = new Store(() => {
  const select = hx("div", "flex flex-1 gap-1 text-[110%]")
  const name = h("inline-block text-[1.265rem] *:pr-1.5")
  const el = h(
    "flex items-baseline pb-2 px-4 [.nya-expr:has(&):not(:focus-within)_.nya-display]:sr-only [.nya-expr:has(&):not(:focus-within)_&]:px-4 [.nya-expr:has(&):not(:focus-within)_&]:py-3 [.nya-expr:has(&):not(:focus-within)_&]:mt-0 whitespace-nowrap overflow-x-auto w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)]",
    name,
    select,
  )
  return { el, name, items: select }
})

const EXT_SELECT = defineExt({
  data(expr) {
    let node = expr.field.ast
    let name
    if (node.type == "binding") {
      name = node.name
      node = node.value
    }

    if (
      !(
        expr.js &&
        node.type == "call" &&
        node.name.type == "var" &&
        node.name.kind == "prefix" &&
        !node.name.sub &&
        !node.name.sup &&
        node.name.value == "select" &&
        !node.on
      )
    )
      return

    const args = fnargs(node.args)
    if (args.length != 2) return

    const items = js(args[0]!, expr.sheet.scope.propsJs)
    if (items.list === false) {
      throw new Error("The first argument to 'select' must be a list.")
    }

    const chosen = expr.js.value
    if (chosen.list !== false) {
      throw new Error("The second argument to 'select' must not be a list.")
    }

    const el = store.get(expr)

    while (el.name.firstChild) {
      el.name.firstChild.remove()
    }
    if (name) {
      const block = new Block(null)
      const cursor = block.cursor(R)
      CmdVar.leftOf(cursor, name, expr.sheet.options)
      new OpEq(false).insertAt(cursor, L)
      el.name.append(block.el)
    }

    while (el.items.firstChild) {
      el.items.firstChild.remove()
    }
    for (const item of items.value) {
      const block = new Block(null)
      new Display(block.cursor(R), frac(10, 1)).plainVal({
        type: items.type,
        value: item,
      })
      const btn = hx(
        "button",
        "bg-[--nya-bg-sidebar] border border-[--nya-border] -mr-px last:mr-0 px-2 py-1 rounded-sm first:rounded-l-lg last:rounded-r-lg flex-1 whitespace-nowrap",
        block.el,
      )
      el.items.appendChild(btn)
    }

    return { items, chosen, expr, name }
  },
  el(data) {
    return store.get(data.expr).el
  },
})

export const PKG_SELECT: Package = {
  id: "nya:select",
  name: "multiple-choice form fields",
  label: null,
  eval: {
    fns: {
      select: {
        js(...args) {
          if (args.length != 2) {
            throw new Error("'select' expects two arguments.")
          }
          if (args[0]!.list === false) {
            throw new Error("The first argument to 'select' must be a list.")
          }
          return args[1]!
        },
        glsl(_, ...args) {
          if (args.length != 2) {
            throw new Error("'select' expects two arguments.")
          }
          if (args[0]!.list === false) {
            throw new Error("The first argument to 'select' must be a list.")
          }
          return args[1]!
        },
      },
    },
  },
  sheet: {
    exts: {
      0: [EXT_SELECT],
    },
  },
}
