import type { Package } from "#/types"
import { Precedence } from "@/eval/ast/token"
import { glsl, js, NO_DRAG } from "@/eval/ast/tx"
import { bindingDeps, withBindingsGlsl, withBindingsJs } from "@/eval/ops/with"

export default {
  name: "with (sequential)",
  label: "an ordered variant of 'with'",
  category: "substitution",
  deps: [],
  eval: {
    tx: {
      binary: {
        withseq: {
          label: "substitutes variables in sequence",
          precedence: Precedence.WordInfix,
          drag: NO_DRAG,
          js(node, props) {
            return props.bindingsJs.withAll(
              withBindingsJs(node.rhs, true, props),
              () => js(node.lhs, props),
            )
          },
          glsl(node, props) {
            return props.bindings.withAll(
              withBindingsGlsl(node.rhs, true, props),
              () => glsl(node.lhs, props),
            )
          },
          deps(node, deps) {
            deps.withBoundIds(bindingDeps(node.rhs, true, deps), () =>
              deps.add(node.lhs),
            )
          },
          sym() {
            // SYM2:
            throw new Error(
              "'withseq' is not allowed in symbolic computation yet.",
            )
          },
        },
      },
    },
  },
} satisfies Package
