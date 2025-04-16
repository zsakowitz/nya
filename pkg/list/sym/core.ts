import type { Package } from "#/types"
import { Precedence, type Nodes } from "@/eval/ast/token"
import { glsl, js } from "@/eval/ast/tx"
import { jsToGlsl } from "@/eval/js-to-glsl"
import { issue } from "@/eval/ops/issue"
import { simplify, SYM_0, SYM_1, txr } from "@/eval/sym"
import type { JsValue } from "@/eval/ty"
import { frac, real } from "@/eval/ty/create"
import { Display } from "@/eval/ty/display"
import { CmdDot, CmdNum } from "@/field/cmd/leaf/num"
import { OpPlusMinus } from "@/field/cmd/leaf/op"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdSupSub } from "@/field/cmd/math/supsub"
import { L, R } from "@/field/dir"
import { Block } from "@/field/model"

export default {
  name: "symbolics core",
  label: null,
  category: "symbolic computation",
  deps: [],
  eval: {
    sym: {
      call: {
        label: "function calls",
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
        label: "variables",
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
        label: "constant values",
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
        label: "tracked dependencies",
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
