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
            check(node)
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
            check(node)
            throw new Error("'debugast' isn't available in shaders.")
          },
          sym: NO_SYM,
        },
      },
    },
  },
} satisfies Package

function check(node: MagicVar) {
  if (node.sub) {
    throw new Error("Cannot attach subscripts to 'debugast'.")
  }
  if (node.sup) {
    throw new Error("Cannot attach superscripts to 'debugast'.")
  }
  if (node.prop) {
    throw new Error("Dot notation is not valid after 'debugast'.")
  }
}
