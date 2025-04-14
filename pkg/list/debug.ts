import type { Package } from "#/types"
import type { MagicVar } from "@/eval/ast/token"
import { NO_SYM } from "@/eval/ast/tx"

export default {
  name: "debug utilities",
  label: "for project nya developers",
  category: "miscellaneous",
  eval: {
    tx: {
      magic: {
        debugast: {
          fnlike: true,
          deps() {},
          js(node) {
            check(node, "debugast")
            return {
              type: "text",
              list: false,
              value: [
                {
                  type: "plain",
                  value: JSON.stringify(
                    node.contents,
                    (k, v) => (k == "span" ? undefined : v),
                    4,
                  ),
                },
              ],
            }
          },
          glsl(node) {
            check(node, "debugast")
            throw new Error("'debugast' isn't available in shaders.")
          },
          sym: NO_SYM,
        },
      },
    },
  },
} satisfies Package

function check(node: MagicVar, why: "debugast") {
  if (node.sub) {
    throw new Error(`Cannot attach subscripts to '${why}'.`)
  }
  if (node.sup) {
    throw new Error(`Cannot attach superscripts to '${why}'.`)
  }
  if (node.prop) {
    throw new Error(`Dot notation is not valid after '${why}'.`)
  }
}
