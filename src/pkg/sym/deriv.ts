import type { Package } from ".."
import { NO_DRAG, sym } from "../../eval/ast/tx"
import { id } from "../../eval/lib/binding"
import { txr } from "../../eval/sym"

export const PKG_DERIV: Package = {
  id: "nya:deriv",
  name: "derivatives",
  label: "via leibniz notation",
  eval: {
    tx: {
      ast: {
        deriv: {
          deps(node, deps) {
            deps.add(node.of)
            deps.add(node.wrt)
          },
          drag: NO_DRAG,
          glsl(node, props) {
            const of = sym(node.of, props)
            const value = txr(of).deriv(of, id(node.wrt))
            const deriv = txr(value).simplify(value)
            return txr(deriv).glsl(deriv, props)
          },
          js(node, props) {
            const of = sym(node.of, props)
            const value = txr(of).deriv(of, id(node.wrt))
            const deriv = txr(value).simplify(value)
            return txr(deriv).js(deriv, props)
          },
          sym(node, props) {
            const of = sym(node.of, props)
            const value = txr(of).deriv(of, id(node.wrt))
            return txr(value).simplify(value)
          },
        },
      },
    },
  },
}
