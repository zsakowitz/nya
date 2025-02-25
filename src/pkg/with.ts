import type { Package } from "."
import { Precedence } from "../eval/ast/token"
import { NO_DRAG } from "../eval/ast/tx"
import { glsl } from "../eval/glsl"
import { js } from "../eval/js"
import { bindingDeps, withBindingsGlsl, withBindingsJs } from "../eval/ops/with"

export const PKG_WITH: Package = {
  id: "nya:with",
  name: "with",
  label: "substitute variables using 'with'",
  eval: {
    tx: {
      binary: {
        with: {
          precedence: Precedence.WordInfix,
          drag: NO_DRAG,
          js(node, props) {
            return props.bindingsJs.withAll(
              withBindingsJs(node.rhs, false, props),
              () => js(node.lhs, props),
            )
          },
          glsl(node, props) {
            return props.bindings.withAll(
              withBindingsGlsl(node.rhs, false, props),
              () => glsl(node.lhs, props),
            )
          },
          deps(node, deps) {
            deps.withBoundIds(bindingDeps(node.rhs, false, deps), () =>
              deps.add(node.lhs),
            )
          },
        },
      },
    },
  },
}
