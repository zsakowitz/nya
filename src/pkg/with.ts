import { Precedence } from "@/eval/ast/token"
import { NO_DRAG, NO_SYM } from "@/eval/ast/tx"
import { glsl } from "@/eval/glsl"
import { js } from "@/eval/js"
import { bindingDeps, withBindingsGlsl, withBindingsJs } from "@/eval/ops/with"
import type { Package } from "."

export const PKG_WITH: Package = {
  id: "nya:with",
  name: "with",
  label: "substitute variables using 'with'",
  category: "substitution",
  eval: {
    tx: {
      binary: {
        with: {
          sym: NO_SYM,
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
  // TODO: docs on substitution
}
