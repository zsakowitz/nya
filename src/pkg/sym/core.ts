import type { Package } from ".."
import { Precedence, type Nodes } from "../../eval/ast/token"
import { glsl, jsToGlsl } from "../../eval/glsl"
import { js } from "../../eval/js"
import { issue } from "../../eval/ops/issue"
import {
  insertStrict,
  SYM_0,
  SYM_1,
  txr,
  TXR_SYM,
  type Sym,
  type TxrSym,
} from "../../eval/sym"
import type { JsValue } from "../../eval/ty"
import { frac, real } from "../../eval/ty/create"
import { Display } from "../../eval/ty/display"
import { CmdNum } from "../../field/cmd/leaf/num"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdSupSub } from "../../field/cmd/math/supsub"
import { Block, L, R } from "../../field/model"
import { h } from "../../jsx"

declare module "../../eval/ty" {
  interface Tys {
    sym: Sym
  }

  interface TyComponents {
    sym: never
  }
}

export const PKG_SYM_CORE: Package = {
  id: "nya:sym-core",
  name: "symbolic computation core",
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
      // TODO: infinity uses incorrect font in sym output
      var: {
        deriv(value, wrt) {
          if (value.id == wrt) {
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
