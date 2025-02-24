import type { Package } from "."
import { commalist } from "../eval/ast/collect"
import { Precedence, type Node, type Piece } from "../eval/ast/token"
import { NO_DRAG } from "../eval/ast/tx"
import { glsl, type PropsGlsl } from "../eval/glsl"
import { js, type PropsJs } from "../eval/js"
import type { Fn } from "../eval/ops"
import { docByIcon, FnDist } from "../eval/ops/dist"
import type { WithDocs } from "../eval/ops/docs"
import {
  join,
  joinGlsl,
  list,
  typeName,
  type GlslValue,
  type JsValue,
  type Val,
} from "../eval/ty"
import {
  coerceTy,
  coerceTyGlsl,
  coerceTyJs,
  coerceType,
  coerceValueGlsl,
  coerceValueJs,
} from "../eval/ty/coerce"
import { declareGlsl } from "../eval/ty/decl"
import { garbageValueGlsl, garbageValueJs } from "../eval/ty/garbage"
import { any, TY_INFO } from "../eval/ty/info"
import { CmdComma } from "../field/cmd/leaf/comma"
import { CmdWord } from "../field/cmd/leaf/word"
import { CmdBrack } from "../field/cmd/math/brack"
import { L } from "../field/model"
import { h, px } from "../jsx"
import { example } from "../sheet/ui/sheet/docs"
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

function piecewiseJs(piecesRaw: Piece[], props: PropsJs): JsValue {
  if (piecesRaw.length == 0) {
    return { type: "bool", value: true, list: false }
  }

  const pieces = piecesRaw.map(({ value, condition }, index) => {
    const cond: JsValue =
      index == piecesRaw.length - 1 && condition.type == "void" ?
        {
          list: false,
          type: "bool",
          value: true,
        }
      : js(condition, props)

    if (cond.list !== false) {
      throw new Error(
        "Lists cannot be used as the condition for a piecewise function yet.",
      )
    }
    if (cond.type != "bool") {
      throw new Error(
        "The 'if' clause in a piecewise function must be a condition like z = 2.",
      )
    }

    return { value: js(value, props), cond }
  })

  try {
    var ret = coerceType(pieces.map((x) => x.value))
  } catch {
    throw new Error(
      `All branches of a piecewise function must have the same type; ${list(pieces.map((x) => typeName(x.value)))} are different types.`,
    )
  }
  for (const { value, cond } of pieces) {
    if (cond.value) {
      return coerceValueJs(value, ret)
    }
  }

  return {
    type: ret.type,
    list: ret.list as number,
    value: garbageValueJs(ret) as Val[],
  }
}

function piecewiseGlsl(piecesRaw: Piece[], props: PropsGlsl): GlslValue {
  if (piecesRaw.length == 0) {
    return { type: "bool", expr: "true", list: false }
  }

  const name = props.ctx.name()

  let isDefinitelyAssigned = false
  const pieces = piecesRaw.map(({ value, condition }, index) => {
    const ctxCond = props.ctx.fork()
    const cond: GlslValue =
      index == piecesRaw.length - 1 && condition.type == "void" ?
        ((isDefinitelyAssigned = true),
        { expr: "true", list: false, type: "bool" })
      : glsl(condition, { ...props, ctx: ctxCond })

    if (cond.list !== false) {
      throw new Error(
        "Lists cannot be used as the condition for a piecewise function yet.",
      )
    }
    if (cond.type != "bool") {
      throw new Error(
        "The 'if' clause in a piecewise function must be a condition like z = 2.",
      )
    }

    const ctxValue = props.ctx.fork()
    const val = glsl(value, { ...props, ctx: ctxValue })

    return { ctxCond, ctxValue, value: val, cond }
  })

  const ret = coerceType(pieces.map((x) => x.value))

  props.ctx.push`${declareGlsl(ret, name)};\n`
  let closers = ""
  for (const { ctxCond, cond, ctxValue, value } of pieces) {
    props.ctx.block += ctxCond.block
    props.ctx.push`if (${cond.expr}) {\n`
    props.ctx.block += ctxValue.block
    props.ctx.push`${name} = ${coerceValueGlsl(props.ctx, value, ret)};\n`
    props.ctx.push`} else {\n`
    closers += "}"
  }
  if (!isDefinitelyAssigned) {
    props.ctx.push`${name} = ${garbageValueGlsl(props.ctx, ret)};\n`
  }
  props.ctx.block += closers + "\n"

  return { ...ret, expr: name }
}

const OP_OR = new FnDist("or", "returns true if either of its inputs are true")

export const FN_VALID = new FnDist<"bool">(
  "valid",
  "returns true if a value is valid for the given type (whether a number is finite, whether a color is displayable, etc.)",
)

const FN_FIRSTVALID: Fn & WithDocs = {
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
          ctx.push`if (${FN_VALID.glsl1(ctx, { type: arg.type, expr: value }).expr}) { ${ret} = ${value}; } else {\n`
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

const TRUE: Node = { type: "var", kind: "var", span: null, value: "true" }

function parseBraces(node: Node): Piece[] {
  const clauses = commalist(node)

  return clauses.map((node, index, array): Piece => {
    if (node.type == "op" && node.b && node.kind == ":") {
      return {
        condition: node.a,
        value: node.b,
      }
    }

    if (index == array.length - 1) {
      return { condition: TRUE, value: node }
    }

    return { condition: node, value: TRUE }
  })
}

export const PKG_BOOL: Package = {
  id: "nya:bool-ops",
  name: "boolean operations",
  label: "basic support for boolean values",
  load() {
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
      group: {
        "{ }": {
          js(node, props) {
            return piecewiseJs(parseBraces(node), props)
          },
          glsl(node, props) {
            return piecewiseGlsl(parseBraces(node), props)
          },
          drag: NO_DRAG,
        },
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
  docs: {
    "piecewise functions"() {
      return [
        px`Piecewise functions let a function specify different outputs depending on some condition. Type ${h("font-semibold", "cases")} to create one.`,
        example(
          String.raw`\begin{cases}x^{2}&x>0\\x-3&\end{cases}\operatorname{for}x=\left[-3,-2,-1,0,1,2,3\right]`,
          String.raw`=\left[-6,-5,-4,-3,1,4,9\right]`,
        ),
        px`Type a semicolon to add more cases. If multiple conditions match, the first one will be chosen.`,
        example(
          String.raw`\begin{cases}x^{2}&x>0\\x-3&x>-2\\8&\end{cases}\operatorname{for}x=\left[-3,-2,-1,0,1,2,3\right]`,
          String.raw`=\left[-8,-8,-4,-3,1,4,9\right]`,
        ),
        px`All branches of a piecewise function must evaluate to the same type.`,
        px`The outputs are coerced to be the same type. Thus, if multiple branches of the piecewise output lists of different lengths, the output will be chopped to the smallest list.`,
        example(
          String.raw`\begin{cases}\left[2\right]&4<3\\\left[3,4\right]&\end{cases}`,
          String.raw`=\left[3\right]`,
        ),
        px`Because project nya aims to be compatible with Desmos, you can also use flat piecewise syntax.`,
        example(
          String.raw`\left\{x>0:x^{2},x-3\right\}\operatorname{for}x=\left[-3,-2,-1,0,1,2,3\right]`,
          String.raw`=\left[-6,-5,-4,-3,1,4,9\right]`,
        ),
        px`Note that in project nya, empty curly braces evaluate to ${h("font-semibold", "true")}, not 1. This matches how Desmos works under the hood, rather than what it shows to the user.`,
        example(String.raw`\left\{\right\}`, String.raw`=\operatorname{true}`),
      ]
    },
  },
}
