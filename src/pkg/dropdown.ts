import type { Package } from "."
import { fnargs } from "../eval/ast/collect"
import { js } from "../eval/js"
import { defineExt } from "../sheet/ext"

const EXT_DROPDOWN = defineExt({
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
        node.name.value == "dropdown" &&
        !node.on
      )
    )
      return

    const args = fnargs(node.args)
    if (args.length != 2) return

    return {
      items: js(args[0]!, expr.sheet.scope.propsJs),
      chosen: expr.js.value,
      expr,
      name,
    }
  },
})

export const PKG_DROPDOWN: Package = {
  id: "nya:dropdown",
  name: "dropdown fields",
  label: "allows expressions to be dropdown fields",
  eval: {
    fns: {
      dropdown: {
        js(...args) {
          if (args.length != 2) {
            throw new Error("'dropdown' expects two arguments.")
          }
          if (args[0]!.list === false) {
            throw new Error("The first argument to 'dropdown' must be a list.")
          }
          return args[1]!
        },
        glsl(_, ...args) {
          if (args.length != 2) {
            throw new Error("'dropdown' expects two arguments.")
          }
          if (args[0]!.list === false) {
            throw new Error("The first argument to 'dropdown' must be a list.")
          }
          return args[1]!
        },
      },
    },
  },
  sheet: {
    exts: {
      0: [EXT_DROPDOWN],
    },
  },
}
