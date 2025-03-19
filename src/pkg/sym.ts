import type { Package } from "."
import { Precedence, type MagicVar, type Nodes } from "../eval/ast/token"
import { NO_DRAG, sym, TXR_AST } from "../eval/ast/tx"
import { glsl, jsToGlsl } from "../eval/glsl"
import { js } from "../eval/js"
import { Bindings, id } from "../eval/lib/binding"
import { FnDist } from "../eval/ops/dist"
import { issue } from "../eval/ops/issue"
import { insertStrict, txr, TXR_SYM, type Sym, type TxrSym } from "../eval/sym"
import type { JsValue } from "../eval/ty"
import { frac, real } from "../eval/ty/create"
import { Display } from "../eval/ty/display"
import { CmdNum } from "../field/cmd/leaf/num"
import { CmdWord } from "../field/cmd/leaf/word"
import { CmdSupSub } from "../field/cmd/math/supsub"
import { Block, L, R } from "../field/model"
import { h } from "../jsx"

declare module "../eval/ty" {
  interface Tys {
    sym: Sym
  }

  interface TyComponents {
    sym: never
  }
}

export const PKG_SYM: Package = {
  id: "nya:sym",
  name: "symbolic computation",
  label: null,
  ty: {
    info: {
      sym: {
        name: "symbolic expression",
        namePlural: "symbolic expressions",
        get glsl(): never {
          throw new Error("Cannot construct symbolic expressions in shaders.")
        },
        toGlsl() {
          throw new Error("Symbolic expressions are not supported in shaders.")
        },
        garbage: {
          js: { type: "undef" },
          get glsl(): never {
            throw new Error("Cannot construct symbolic expressions in shaders.")
          },
        },
        coerce: {},
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            const txr: TxrSym<unknown> | undefined = TXR_SYM[value.type]
            if (!txr) {
              throw new Error(
                `Symbolic expression type '${value.type}' is not defined.`,
              )
            }

            insertStrict(
              props.cursor,
              txr.display(value),
              Precedence.Comma,
              Precedence.Comma,
            )
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#00786F] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_-_1.5px)] font-['Times_New_Roman'] italic text-[100%]",
                "f",
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        components: null,
        extras: null,
      },
    },
  },
  eval: {
    tx: {
      magic: {
        sym: {
          deps(node, deps) {
            deps.add(node.contents)
          },
          js(node, props) {
            validateSym(node)
            const tx = TXR_AST[node.contents.type]
            if (!tx?.sym) {
              throw new Error(
                `Cannot transform '${node.contents.type}' into a symbolic computation.`,
              )
            }

            return {
              type: "sym",
              list: false,
              value: tx.sym(node.contents as never, props),
            } satisfies JsValue<"sym", false>
          },
          glsl() {
            throw new Error("Cannot construct symbolic expressions in shaders.")
          },
          sym(node, props) {
            validateSym(node)
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
      },
      ast: {
        deriv: {
          deps(node, deps) {
            const of = sym(node.of, {
              // FIXME: this bans functions in deriv nodes
              bindingsSym: new Bindings(),
              base: real(10),
            })
            const value = txr(of).deriv(of, id(node.wrt))
            const deriv = txr(value).simplify(value)
            txr(deriv).deps(deriv, deps)
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
    sym: {
      call: {
        deriv(value, wrt) {
          return (
            value.fn.deriv?.(value.args, wrt) ??
            issue(
              `Cannot compute the derivative of ${"name" in value.fn ? `'${value.fn.name}'` : "this function"} yet.`,
            )()
          )
        },
        uses(value, name) {
          return value.args.some((x) => txr(x).uses(x, name))
        },
        // SYM: better displaying of function calls when the argument doesn't need parentheses
        display(value) {
          if (!value.fn.display) {
            console.warn(value.fn)
            throw new Error(
              `Cannot display function '${"name" in value.fn ? value.fn.name : "<unknown name>"}'`,
            )
          }
          return value.fn.display(value.args)
        },
        simplify({ fn, args: rawArgs }) {
          const args = rawArgs.map((x) => txr(x).simplify(x))
          if (args.every((x) => x.type == "js")) {
            try {
              return {
                type: "js",
                value: fn.js(args.map((x) => x.value)),
              }
            } catch {}
          }
          return fn.simplify?.(args) ?? { type: "call", fn, args }
        },

        deps(value, deps) {
          for (const arg of value.args) {
            txr(arg).deps(arg, deps)
          }
        },
        js(value, props) {
          return value.fn.js(value.args.map((a) => txr(a).js(a, props)))
        },
        glsl(value, props) {
          return value.fn.glsl(
            props.ctx,
            value.args.map((a) => txr(a).glsl(a, props)),
          )
        },
      },
      var: {
        deriv(value, wrt) {
          if (value.id == wrt) {
            return {
              type: "js",
              value: {
                type: "r64",
                list: false,
                value: real(1),
              } satisfies JsValue<"r64", false>,
            }
          }

          return { type: "var", id: value.id, source: value.source }
        },
        uses(value, name) {
          return value.id == name
        },
        display(value) {
          const block = new Block(null)
          const cursor = block.cursor(R)
          new CmdWord(
            value.source.name,
            value.source.kind,
            value.source.italic,
          ).insertAt(cursor, L)
          if (value.source.sub) {
            const block = new Block(null)
            new CmdSupSub(block, null).insertAt(cursor, L)
            const c = block.cursor(R)
            for (const char of value.source.sub) {
              if ("0" <= char && char <= "9") {
                new CmdNum(char).insertAt(c, L)
              } else {
                new CmdWord(char, undefined, true).insertAt(c, L)
              }
            }
          }
          return { block, lhs: Precedence.Var, rhs: Precedence.Var }
        },
        simplify(value) {
          return { ...value, type: "var" }
        },

        deps(value, deps) {
          deps.trackById(value.id)
        },
        js(value, props) {
          return js(
            {
              type: "var",
              kind: "var",
              span: null,
              value: value.source.name,
              sub:
                value.source.sub ?
                  {
                    type: "var",
                    kind: "var",
                    span: null,
                    value: value.source.sub,
                  }
                : undefined,
            } satisfies Nodes["var"] & { type: "var" },
            props,
          )
        },
        glsl(value, props) {
          return glsl(
            {
              type: "var",
              kind: "var",
              span: null,
              value: value.source.name,
              sub:
                value.source.sub ?
                  {
                    type: "var",
                    kind: "var",
                    span: null,
                    value: value.source.sub,
                  }
                : undefined,
            } satisfies Nodes["var"] & { type: "var" },
            props,
          )
        },
      },
      js: {
        deriv() {
          return {
            type: "js",
            value: {
              type: "r64",
              list: false,
              value: real(0),
            } satisfies JsValue<"r64", false>,
          }
        },
        uses() {
          return false
        },
        display(value) {
          const block = new Block(null)
          new Display(block.cursor(R), frac(10, 1)).output(value.value, false)
          return { block, lhs: Precedence.Sum, rhs: Precedence.Sum }
        },
        simplify(value) {
          return { type: "js", value: value.value }
        },

        deps() {},
        js(value) {
          return value.value
        },
        glsl(value, props) {
          return jsToGlsl(value.value, props.ctx)
        },
      },
    },
  },
}

function validateSym(node: MagicVar) {
  if (node.prop) {
    throw new Error(
      "Cannot access a particular property of a 'sym' expression.",
    )
  }
  if (node.sub) {
    throw new Error("Cannot apply subscripts to 'sym' expressions.")
  }
  if (node.sup) {
    throw new Error("Cannot apply superscripts to 'sym' expressions.")
  }
}
