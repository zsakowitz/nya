import type { Package } from "#/types"
import { Precedence } from "@/eval/ast/token"
import { glsl, js, NO_DRAG, NO_SYM } from "@/eval/ast/tx"
import { bindingDeps, withBindingsGlsl, withBindingsJs } from "@/eval/ops/with"

export default {
  name: "with",
  label: "substitute variables using 'with'",
  category: "substitution",
  deps: [],
  eval: {
    tx: {
      binary: {
        with: {
          label: "substitutes variables simultaneously",
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
} satisfies Package
