import type { Package } from ".."
import { type MagicVar } from "@/eval/ast/token"
import { TXR_AST } from "@/eval/ast/tx"
import { js } from "@/eval/js"
import { txr, type Sym } from "@/eval/sym"
import type { JsValue } from "@/eval/ty"
import { b, px } from "@/jsx"
import { example } from "@/sheet/ui/sheet/docs"

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
          sym() {
            throw new Error(
              "Cannot call 'sym' in a symbolic expression. Maybe you meant 'eval' or 'unsym' instead?",
            )
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

        /** SYM: substitute a value for a variable */
      },
    },
  },
  docs: {
    "symbolic computation"() {
      return [
        px`The ${b("sym")} function lets you create symbolic expressions. A symbolic expression is not evaluated, and shows up like an algebraic expression.`,
        example(String.raw`sym(x^{2*3}+y)`, String.raw`=x^6+y`),
        px`Combining ${b("sym")} with derivative notation lets you see the symbolic derivative of a function.`,
        example(
          String.raw`\operatorname{sym}\frac{d}{dx}\operatorname{cos}6x`,
          // SYM: check this is correct once output gets prettified
          String.raw`=(6)(-sin((6)x))`,
        ),
        px`The ${b("eval")} function acts as the inverse of ${b("sym")}: it evaluates a symbolic expression.`,
        example(String.raw`eval(symz^2)withz=4`, "=16"),
      ]
    },
    "symbolic computation (advanced)"() {
      return [
        px`In the rare cases where you need to explicitly include values in a symbolic expression, use the ${b("unsym")} function.`,
        example(String.raw`symz^{unsym n}withn=4`, "=z^4"),
        px`If you defined a symbolic expression in one variable and want to include it in another symbolic expression, use ${b("eval")}, not ${b("unsym")}.`,
        example(String.raw`s_1=symz^2`, null),
        example(String.raw`symz^{evals_1}`, "=z^{z^2}"),
        px`(${b("eval")} directly puts one expression in another, whereas ${b("unsym")} pastes it like any other value, as if it were writing quotation marks inside another quotation. Think: "some words and 'unsym'd content'" versus "some words and eval'd content".)`,
        px`Combining ${b("sym")}, ${b("eval")}, and ${b("iterate")} lets you take arbitrary derivatives of functions:`,
        example(
          String.raw`\operatorname{iterate}^{4}z\to \operatorname{sym}\frac{d}{dx}\operatorname{eval}z\operatorname{from}z=\operatorname{sym}x^{12}`,
          String.raw`=12(11(10(9x^8)))`,
        ),
      ]
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
