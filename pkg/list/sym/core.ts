import type { Package } from "#/types"
import { Precedence, type Nodes } from "@/eval/ast/token"
import { glsl, jsToGlsl } from "@/eval/glsl"
import { js } from "@/eval/js"
import { issue } from "@/eval/ops/issue"
import {
  insertStrict,
  simplify,
  SYM_0,
  SYM_1,
  txr,
  TXR_SYM,
  type Sym,
  type TxrSym,
} from "@/eval/sym"
import type { JsValue } from "@/eval/ty"
import { frac, real } from "@/eval/ty/create"
import { Display } from "@/eval/ty/display"
import { CmdDot, CmdNum } from "@/field/cmd/leaf/num"
import { OpPlusMinus } from "@/field/cmd/leaf/op"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdSupSub } from "@/field/cmd/math/supsub"
import { Block } from "@/field/model"
import { L, R } from "@/field/dir"
import { h } from "@/jsx"

declare module "@/eval/ty" {
  interface Tys {
    sym: Sym
  }
}

// FIXME: if g(x) = x^2, sym g(a) = x^2 (should be a^2)

export default {
  name: "symbolics core",
  label: null,
  category: "symbolic computation",
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
        extras: null,
      },
    },
  },
  eval: {
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
        simplify({ fn, args: rawArgs }, props) {
          const args = rawArgs.map((x) => simplify(x, props))
          if (args.every((x) => x.type == "js")) {
            try {
              return {
                type: "js",
                value: fn.js(
                  props.ctxJs,
                  args.map((x) => x.value),
                ),
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
          return value.fn.js(
            props.ctxJs,
            value.args.map((a) => txr(a).js(a, props)),
          )
        },
        glsl(value, props) {
          return value.fn.glsl(
            props.ctx,
            value.args.map((a) => txr(a).glsl(a, props)),
          )
        },
      },
      // TODO: infinity uses incorrect font in sym output
      var: {
        deriv(value, props) {
          if (value.id == props.wrt) {
            return SYM_1
          }

          return SYM_0
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
          return value
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
          let prec: number = Precedence.Numeric
          let el = block.ends[L]
          while (el) {
            if (el instanceof OpPlusMinus) {
              prec = Precedence.Sum
            } else if (!(el instanceof CmdNum || el instanceof CmdDot)) {
              prec = Precedence.NotApplicable
            }
            el = el[R]
          }
          return { block, lhs: prec, rhs: prec }
        },
        simplify(value) {
          return value
        },

        deps() {},
        js(value) {
          return value.value
        },
        glsl(value, props) {
          return jsToGlsl(value.value, props.ctx)
        },
      },
      dep: {
        deps(value, deps) {
          deps.trackById(value.id)
          txr(value.value).deps(value.value, deps)
        },
        deriv(value, props) {
          return {
            type: "dep",
            id: value.id,
            value: txr(value.value).deriv(value.value, props),
          }
        },
        display({ value }) {
          return txr(value).display(value)
        },
        glsl({ value }, props) {
          return txr(value).glsl(value, props)
        },
        js({ value }, props) {
          return txr(value).js(value, props)
        },
        simplify(value, props) {
          return {
            type: "dep",
            id: value.id,
            value: simplify(value.value, props),
          }
        },
        uses({ value }, name) {
          return txr(value).uses(value, name)
        },
        layer: -1,
      },
    },
  },
} satisfies Package
