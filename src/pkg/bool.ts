import type { Package } from "."
import { Precedence } from "../eval/ast/token"
import { NO_DRAG } from "../eval/ast/tx"
import type { Fn } from "../eval/ops"
import { docByIcon, FnDist } from "../eval/ops/dist"
import type { WithDocs } from "../eval/ops/docs"
import { piecewiseGlsl, piecewiseJs } from "../eval/ops/piecewise"
import { join, joinGlsl } from "../eval/ty"
import { coerceTy, coerceTyGlsl, coerceTyJs } from "../eval/ty/coerce"
import { any, TY_INFO } from "../eval/ty/info"
import { CmdComma } from "../field/cmd/leaf/comma"
import { CmdWord } from "../field/cmd/leaf/word"
import { CmdBrack } from "../field/cmd/math/brack"
import { L } from "../field/model"
import { h } from "../jsx"
import { OP_AND } from "./core-cmp"

declare module "../eval/ty" {
  interface Tys {
    bool: boolean
  }

  interface TyComponents {
    bool: never
  }
}

declare module "../eval/ast/token" {
  interface PuncListInfix {
    "\\and ": 0
    "\\or ": 0
    and: 0
    or: 0
  }
}

const OP_OR = new FnDist("or", "returns true if either of its inputs are true")

export const FN_VALID = new FnDist<"bool">(
  "valid",
  "returns true if a value is valid for the given type (whether a number is finite, whether a color is displayable, etc.)",
)

export const FN_FIRSTVALID: Fn & WithDocs = {
  name: "firstvalid",
  label:
    "returns the first value which is valid for its type (the first finite number, the first color which is displayable, etc.)",
  js(args) {
    const ty = coerceTy(args)

    return join(
      args.map((arg) => coerceTyJs(arg, ty)),
      ty,
      (...args) => {
        for (const arg of args) {
          if (FN_VALID.js1(arg).value) {
            return arg.value
          }
        }

        return TY_INFO[ty].garbage.js
      },
    )
  },
  glsl(ctx, args) {
    const ty = coerceTy(args)

    return joinGlsl(
      ctx,
      args.map((arg) => coerceTyGlsl(ctx, arg, ty)),
      ty,
      (...args) => {
        const ret = ctx.name()
        ctx.push`${TY_INFO[ty].glsl} ${ret};\n`

        let close = ""
        for (const arg of args) {
          const value = ctx.cache(arg)
          ctx.push`if (${FN_VALID.glsl1(ctx, { type: arg.type, expr: value }).expr}) { ${ret} = ${value} } else {\n`
          close += "}"
        }
        ctx.push`${ret} = ${TY_INFO[ty].garbage.glsl}; ${close}\n`

        return ret
      },
    )
  },
  docs() {
    const list = () =>
      CmdBrack.render("[", "]", null, {
        el: h(
          "",
          any(),
          new CmdComma().el,
          any(),
          new CmdComma().el,
          h("nya-cmd-dot nya-cmd-dot-l", "."),
          h("nya-cmd-dot", "."),
          h("nya-cmd-dot", "."),
        ),
      })

    return [
      docByIcon([any(), any()], any(), true),
      docByIcon([list(), any()], any(), true),
      docByIcon([any(), list()], any(), true),
      docByIcon([list(), list()], any(), true),
    ]
  },
}

export const PKG_BOOL: Package = {
  id: "nya:bool-ops",
  name: "boolean operations",
  label: "basic support for boolean values",
  init() {
    OP_AND.add(
      ["bool", "bool"],
      "bool",
      (a, b) => a.value && b.value,
      (_, a, b) => `(${a.expr} && ${b.expr})`,
    )

    OP_OR.add(
      ["bool", "bool"],
      "bool",
      (a, b) => a.value || b.value,
      (_, a, b) => `(${a.expr} || ${b.expr})`,
    )

    FN_VALID.add(
      ["bool"],
      "bool",
      () => true,
      () => "true",
    )
  },
  ty: {
    info: {
      bool: {
        name: "true/false value",
        namePlural: "true/false values",
        glsl: "bool",
        garbage: { js: false, glsl: "false" },
        coerce: {},
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            new CmdWord("" + value, "var").insertAt(props.cursor, L)
          },
        },
        icon() {
          return h(
            "",
            h(
              "size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] inline-block relative",
              h(
                "text-[#c74440] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px]",
                h(
                  "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
                ),
                h(
                  "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-[#388c46] rounded-full",
                ),
              ),
              h(
                "text-[#388c46] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px] [clip-path:polygon(100%_100%,100%_0%,0%_100%)]",
                h(
                  "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
                ),
                h(
                  "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#c74440] rounded-full",
                ),
              ),
            ),
          )
        },
      },
    },
  },
  eval: {
    vars: {
      false: {
        label: "result of a false statement (2=3, 7>9, √4=5)",
        js: { type: "bool", value: false, list: false },
        glsl: { type: "bool", expr: "false", list: false },
        display: false,
      },
      true: {
        label: "result of a true statement (3=3, 7<9, √4=2)",
        js: { type: "bool", value: true, list: false },
        glsl: { type: "bool", expr: "true", list: false },
        display: false,
      },
    },
    op: {
      binary: {
        "\\and ": { precedence: Precedence.BoolAnd, fn: OP_AND },
        and: { precedence: Precedence.BoolAnd, fn: OP_AND },
        "\\or ": { precedence: Precedence.BoolOr, fn: OP_OR },
        or: { precedence: Precedence.BoolOr, fn: OP_OR },
      },
    },
    fns: {
      valid: FN_VALID,
      firstvalid: FN_FIRSTVALID,
    },
    txrs: {
      piecewise: {
        js(node, props) {
          return piecewiseJs(node.pieces, props)
        },
        glsl(node, props) {
          return piecewiseGlsl(node.pieces, props)
        },
        drag: NO_DRAG,
        deps(node, deps) {
          for (const { condition, value } of node.pieces) {
            deps.add(condition)
            deps.add(value)
          }
        },
      },
    },
  },
}
