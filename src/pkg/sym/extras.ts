import type { Package } from ".."
import { type MagicVar } from "../../eval/ast/token"
import { TXR_AST } from "../../eval/ast/tx"
import { js } from "../../eval/js"
import { FnDist } from "../../eval/ops/dist"
import { issue } from "../../eval/ops/issue"
import { txr, type Sym } from "../../eval/sym"
import type { JsValue } from "../../eval/ty"

export const PKG_SYM_EXTRAS: Package = {
  id: "nya:sym-extras",
  name: "symbolic computation extras",
  label: null,
  eval: {
    tx: {
      magic: {
        /** Creates a symbolic expression "quoting" its contents. */
        sym: {
          fnlike: true,
          deps(node, deps) {
            deps.add(node.contents)
          },
          js(node, props) {
            validateSym(node, "sym")
            const tx = TXR_AST[node.contents.type]
            if (!tx?.sym) {
              throw new Error(
                `Cannot transform '${node.contents.type}' into a symbolic computation.`,
              )
            }

            const value = tx.sym(node.contents as never, props)

            return {
              type: "sym",
              list: false,
              value: txr(value).simplify(value),
            } satisfies JsValue<"sym", false>
          },
          glsl() {
            throw new Error("Cannot construct symbolic expressions in shaders.")
          },
          sym(node, props) {
            validateSym(node, "sym")
            const tx = TXR_AST[node.contents.type]
            if (!tx?.sym) {
              throw new Error(
                `Cannot transform '${node.contents.type}' into a symbolic computation.`,
              )
            }

            return {
              type: "js",
              value: {
                type: "sym",
                list: false,
                value: tx.sym(node.contents as never, props),
              } satisfies JsValue<"sym", false>,
            }
          },
        },

        /** Interpolates a value into a symbolic expression. */
        unsym: {
          fnlike: true,
          deps(node, deps) {
            deps.add(node.contents)
          },
          js() {
            throw new Error(
              "'unsym' can only be called inside a symbolic expression.",
            )
          },
          glsl() {
            throw new Error(
              "'unsym' can only be called inside a symbolic expression.",
            )
          },
          sym(node, props) {
            validateSym(node, "unsym")
            return { type: "js", value: js(node.contents, props) }
          },
        },

        /** Evaluates a symbolic expression. */
        eval: {
          fnlike: true,
          deps(node, deps) {
            deps.add(node.contents)
          },
          js(node, props) {
            validateSym(node, "eval")
            const sym = js(node.contents, props)
            if (sym.type != "sym" || sym.list !== false) {
              throw new Error("'eval' expects a single symbolic expression.")
            }

            const val = sym.value as Sym
            return txr(val).js(val, props)
          },
          glsl(node, props) {
            validateSym(node, "eval")
            const sym = js(node.contents, props)
            if (sym.type != "sym" || sym.list !== false) {
              throw new Error("'eval' expects a single symbolic expression.")
            }

            const val = sym.value as Sym
            return txr(val).glsl(val, props)
          },
          sym(node, props) {
            validateSym(node, "eval")
            const sym = js(node.contents, props)
            if (sym.type != "sym" || sym.list !== false) {
              throw new Error("'eval' expects a single symbolic expression.")
            }

            return sym.value as Sym
          },
        },
      },
    },
    fn: {
      simplify: new FnDist("simplify", "Simplifies an expression.", {
        message: "Cannot simplify %%.",
        // SYM: derivative of contents
      }).add(
        ["sym"],
        "sym",
        (a) => txr(a.value).simplify(a.value),
        issue("Symbolic computation is not supported in shaders."),
      ),
    },
  },
}

function validateSym(node: MagicVar, kind: "sym" | "eval" | "unsym") {
  // FIXME: remove this now that `fnlike` works
  if (node.prop) {
    throw new Error(
      `Cannot access a particular property of a${kind == "sym" ? "" : "n"} '${kind}' expression.`,
    )
  }
  if (node.sub) {
    throw new Error(`Cannot apply subscripts to '${kind}' expressions.`)
  }
  if (node.sup) {
    throw new Error(`Cannot apply superscripts to '${kind}' expressions.`)
  }
}
