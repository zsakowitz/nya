import type { Package } from ".."
import { NO_DRAG, sym } from "@/eval/ast/tx"
import { id } from "@/eval/lib/binding"
import { txr } from "@/eval/sym"
import { b, px } from "@/jsx"
import { example } from "@/docs/core"

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
  docs: {
    derivatives() {
      return [
        px`Use Leibniz notation to take derivatives.`,
        example("\\frac{d}{dx}x^{2}forx=[1,2,3]", "=[2,4,6]"),
        px`You can take repeated derivatives as well.`,
        example("\\frac{d}{dx}\\frac{d}{dx}x^{2}", "=2"),
        // SYM: remove once done with derivatives
        // TODO: make this dependent on PKG_SYM_EXTRAS being loaded
        px`To see the expanded derivative as a symbolic expression, write ${b("sym")} before the derivative symbol.`,
        example("sym\\frac{d}{dx}e^{sin x}", "=cos(x)ln(e)e^{sin(x)}"),
      ]
    },
  },
}
