import { commalist, fnargs } from "./ast/collect"
import type { Node } from "./ast/token"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "./base"
import { Bindings, id } from "./binding"
import { BUILTINS } from "./builtins"
import { GlslContext, GlslHelpers } from "./fn"
import {
  ABS,
  AND,
  DIV,
  getNamedFn,
  IMAG,
  MUL,
  opCmp,
  OPS_BINARY,
  OPS_UNARY,
  POW,
  REAL,
  SQRT,
} from "./ops"
import { iterateJs } from "./ops/iterate"
import { typeToGlsl, type GlslValue, type JsValue, type SReal } from "./ty"
import { coerceType, coerceValueGlsl, listGlsl, listJs } from "./ty/coerce"
import { real, vreal } from "./ty/create"
import { garbageValueGlsl } from "./ty/garbage"

export interface Iterate {
  name: string
  expr: Node
  limit: Node
  initial: Node | undefined
  condition: { type: "while" | "until"; value: Node } | undefined
}

function parseIterate({
  contents,
  sub,
  sup: limit,
}: Extract<Node, { type: "magicvar" }>): Iterate {
  if (!limit) {
    throw new Error(
      "Maximum iteration count should be a superscript (try iterate⁵⁰).",
    )
  }

  if (sub && !limit) {
    throw new Error("'iterate' expressions cannot take subscripts.")
  }

  let initial: Iterate["initial"]
  let condition: Iterate["condition"]

  loop: while (contents.type == "op") {
    if (!contents.b) break

    switch (contents.kind) {
      case "\\to ":
        break loop
      case "initial":
        if (initial) {
          throw new Error(
            "'iterate' expressions can only have one 'initial ...' clause.",
          )
        }

        initial = contents.b
        contents = contents.a
        continue
      case "while":
      case "until":
        if (condition) {
          throw new Error(
            "'iterate' expressions can only have one 'while ...' or 'until ...' clause.",
          )
        }

        condition = {
          type: contents.kind,
          value: contents.b,
        }
        contents = contents.a
        continue
    }

    throw new Error(
      "'iterate' expressions look like 'iterate z->z²+c', with optional 'initial ...' and 'while ...' clauses afterwards.",
    )
  }

  if (contents.type == "group" && contents.lhs == "(" && contents.rhs == ")") {
    contents = contents.value
  }

  if (!(contents.type == "op" && contents.b && contents.kind == "\\to ")) {
    throw new Error("'iterate' expressions look like 'iterate⁵⁰ z→z²+c'.")
  }

  if (contents.a.type != "var" || contents.a.kind != "var" || contents.a.sup) {
    throw new Error("The left side of a -> expression must be a variable name.")
  }

  return {
    name: id(contents.a),
    expr: contents.b,
    limit,
    initial,
    condition,
  }
}

export interface Props {
  base: SReal
}

export interface PropsJs extends Props {
  /** JS bindings must be values. */
  bindings: Bindings<JsValue>
}

export interface PropsGlsl extends Props {
  ctx: GlslContext
  /** GLSL bindings must contain variable names and be properly typed. */
  bindings: Bindings<GlslValue>
}

export function defaultPropsJs(): PropsJs {
  return {
    base: real(10),
    bindings: new Bindings(),
  }
}

export function defaultPropsGlsl(): PropsGlsl {
  return {
    base: real(10),
    ctx: new GlslContext(new GlslHelpers()),
    bindings: new Bindings(),
  }
}

function jsCall(
  name: string,
  args: Node[],
  _asMethod: boolean,
  props: PropsJs,
): JsValue {
  const fn = getNamedFn(name)

  if (!fn) {
    throw new Error(`The '${name}' function is not supported yet.`)
  }

  if (args.length != fn[0]) {
    throw new Error(`The '${name}' function needs ${fn[0]} arguments.`)
  }

  return fn[1].js(...args.map((arg) => js(arg, props)))
}

export function js(node: Node, props: PropsJs): JsValue {
  switch (node.type) {
    case "num":
      return {
        type: "real",
        list: false,
        value: parseNumberJs(
          node.value,
          node.sub ? asNumericBase(js(node.sub, props)) : props.base,
        ),
      }
    case "op":
      if (!node.b) {
        const op = OPS_UNARY[node.kind]
        if (op) {
          return op.js(js(node.a, props))
        }
        throw new Error(`The operator '${node.kind}' is not supported yet.`)
      }
      switch (node.kind) {
        case "base":
          return js(node.a, {
            ...props,
            base: asNumericBase(js(node.b, { ...props, base: real(10) })),
          })
        case ".":
          if (node.b.type == "var" && !node.b.sub && node.b.kind == "var") {
            const value =
              node.b.value == "x" || node.b.value == "real" ?
                REAL.js(js(node.a, props))
              : node.b.value == "y" || node.b.value == "imag" ?
                IMAG.js(js(node.a, props))
              : null

            if (value == null) {
              break
            }

            if (node.b.sup) {
              return POW.js(value, js(node.b.sup, props))
            } else {
              return value
            }
          }
      }
      const op = OPS_BINARY[node.kind]
      if (op) {
        return op.js(js(node.a, props), js(node.b, props))
      }
      throw new Error(`The operator '${node.kind}' is not supported yet.`)
    case "group":
      if (node.lhs == "(" && node.rhs == ")") {
        return js(node.value, props)
      }
      if (node.lhs == "[" && node.rhs == "]") {
        const args = commalist(node.value).map((item) => js(item, props))
        if (args.length == 0) {
          return {
            type: "real",
            list: true,
            value: [],
          }
        }
        if (args.every((x) => x.list === false)) {
          return listJs(args)
        }
        throw new Error("Cannot store a list inside another list.")
      }
      if (node.lhs == "|" && node.rhs == "|") {
        return ABS.js(js(node.value, props))
      }
      break
    case "call":
      if (
        !node.on &&
        node.name.type == "var" &&
        node.name.kind == "prefix" &&
        !node.name.sub &&
        !node.name.sup
      ) {
        const args = fnargs(node.args)
        if (node.on) {
          args.unshift(node.on)
        }
        return jsCall(node.name.value, args, !!node.on, props)
      }
      break
    case "juxtaposed":
      return MUL.js(js(node.a, props), js(node.b, props))
    case "var": {
      builtin: {
        if (node.sub) break builtin

        const value = BUILTINS[node.value]?.js
        if (!value) break builtin

        if (!node.sup) return value
        return POW.js(value, js(node.sup, props))
      }

      const value = props.bindings.get(id(node))
      if (value) {
        if (node.sup) {
          return POW.js(value, js(node.sup, props))
        } else {
          return value
        }
      }

      throw new Error(`The variable '${node.value}' is not defined.`)
    }
    case "frac":
      return DIV.js(js(node.a, props), js(node.b, props))
    case "raise":
      return POW.js(js(node.base, props), js(node.exponent, props))
    case "cmplist":
      return node.ops
        .map((op, i) => {
          const a = js(node.items[i]!, props)
          const b = js(node.items[i + 1]!, props)
          return opCmp(op).js(a, b)
        })
        .reduce((a, b) => AND.js(a, b))
    case "piecewise":
      throw new Error("Piecewises are not supported outside of shaders yet.")
    case "root":
      if (node.root) {
        return POW.js(
          js(node.contents, props),
          DIV.js(vreal(1), js(node.root, props)),
        )
      } else {
        return SQRT.js(js(node.contents, props))
      }
    case "error":
      throw new Error(node.reason)
    case "magicvar":
      if (node.value == "iterate") {
        return iterateJs(parseIterate(node), props)
      }
      break
    case "void":
    case "num16":
    case "sub":
    case "sup":
    case "mixed":
    case "for":
    case "matrix":
    case "bigsym":
    case "big":
    case "index":
    case "commalist":
    case "factorial":
    case "punc":
  }

  throw new Error(`Node type '${node.type}' is not implemented yet.`)
}

function glslCall(
  name: string,
  args: Node[],
  _asMethod: boolean,
  props: PropsGlsl,
): GlslValue {
  const fn = getNamedFn(name)

  if (!fn) {
    throw new Error(`The '${name}' function is not supported in shaders yet.`)
  }

  if (args.length != fn[0]) {
    throw new Error(`The '${name}' function needs ${fn[0]} arguments.`)
  }

  return fn[1].glsl(props.ctx, ...args.map((arg) => glsl(arg, props)))
}

export function glsl(node: Node, props: PropsGlsl): GlslValue {
  switch (node.type) {
    case "num":
      return {
        type: "real",
        list: false,
        expr: parseNumberGlsl(
          node.value,
          node.sub ?
            asNumericBase(js(node.sub, { ...props, bindings: new Bindings() }))
          : props.base,
        ),
      }
    case "op":
      if (!node.b) {
        const op = OPS_UNARY[node.kind]
        if (op) {
          return op.glsl(props.ctx, glsl(node.a, props))
        }
        throw new Error(`The operator '${node.kind}' is not supported yet.`)
      }
      switch (node.kind) {
        case "base":
          return glsl(node.a, {
            ...props,
            base: asNumericBase(
              js(node.b, {
                ...props,
                base: real(10),
                bindings: new Bindings(),
              }),
            ),
          })
        case ".":
          if (node.b.type == "var" && !node.b.sub && node.b.kind == "var") {
            const value =
              node.b.value == "x" || node.b.value == "real" ?
                REAL.glsl(props.ctx, glsl(node.a, props))
              : node.b.value == "y" || node.b.value == "imag" ?
                IMAG.glsl(props.ctx, glsl(node.a, props))
              : null

            if (value == null) {
              break
            }

            if (node.b.sup) {
              return POW.glsl(props.ctx, value, glsl(node.b.sup, props))
            } else {
              return value
            }
          }
      }
      const op = OPS_BINARY[node.kind]
      if (op) {
        return op.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
      }
      throw new Error(`The operator '${node.kind}' is not supported yet.`)
    case "group":
      if (node.lhs == "(" && node.rhs == ")") {
        return glsl(node.value, props)
      }
      if (node.lhs == "[" && node.rhs == "]") {
        const args = commalist(node.value).map((item) => glsl(item, props))
        if (args.length == 0) {
          return {
            type: "real",
            expr: "[]",
            list: 0,
          }
        }
        if (args.some((x) => x.list !== false)) {
          throw new Error("Cannot store a list inside another list.")
        }
        return listGlsl(args)
      }
      if (node.lhs == "|" && node.rhs == "|") {
        return ABS.glsl(props.ctx, glsl(node.value, props))
      }
      break
    case "call":
      if (
        !node.on &&
        node.name.type == "var" &&
        node.name.kind == "prefix" &&
        !node.name.sub &&
        !node.name.sup
      ) {
        const args = fnargs(node.args)
        if (node.on) {
          args.unshift(node.on)
        }
        return glslCall(node.name.value, args, !!node.on, props)
      }
      break
    case "juxtaposed":
      return MUL.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
    case "var": {
      builtin: {
        if (node.sub) break builtin

        const value = BUILTINS[node.value]?.glsl
        if (!value) break builtin

        if (!node.sup) return value
        return POW.glsl(props.ctx, value, glsl(node.sup, props))
      }

      throw new Error(`The variable '${node.value}' is not defined.`)
    }
    case "frac":
      return DIV.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
    case "raise":
      return POW.glsl(
        props.ctx,
        glsl(node.base, props),
        glsl(node.exponent, props),
      )
    case "cmplist":
      return node.ops
        .map((op, i) => {
          const a = glsl(node.items[i]!, props)
          const b = glsl(node.items[i + 1]!, props)
          return opCmp(op).glsl(props.ctx, a, b)
        })
        .reduce((a, b) => AND.glsl(props.ctx, a, b))
    case "piecewise": {
      const name = props.ctx.name()

      let isDefinitelyAssigned = false
      const pieces = node.pieces.map(({ value, condition }, index) => {
        if (index == node.pieces.length - 1 && condition.type == "void") {
          isDefinitelyAssigned = true
          condition = { type: "var", kind: "var", value: "true" }
        }

        const ctxCond = props.ctx.fork()
        const cond = glsl(condition, { ...props, ctx: ctxCond })
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

      const ret = coerceType(pieces.map((x) => x.value))!

      props.ctx.push`${typeToGlsl(ret)} ${name};\n`
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
        props.ctx.push`${name} = ${garbageValueGlsl(ret)};\n`
      }
      props.ctx.block += closers + "\n"

      return { ...ret, expr: name }
    }
    case "error":
      throw new Error(node.reason)
    case "magicvar":
    case "void":
    case "num16":
    case "sub":
    case "sup":
    case "mixed":
    case "for":
    case "matrix":
    case "bigsym":
    case "big":
    case "root":
    case "index":
    case "commalist":
    case "factorial":
    case "punc":
  }

  throw new Error(
    `Node type '${node.type}' is not implemented for shaders yet.`,
  )
}
