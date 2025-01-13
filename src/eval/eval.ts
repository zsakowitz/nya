import { commalist, fnargs } from "./ast/collect"
import type { Node } from "./ast/token"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "./base"
import { Bindings, id, parseBindingVars } from "./binding"
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
import { iterateGlsl, iterateJs, parseIterate } from "./ops/iterate"
import { varDeclToGlsl, type GlslValue, type JsValue, type SReal } from "./ty"
import { coerceType, coerceValueGlsl, listGlsl, listJs } from "./ty/coerce"
import { num, real, vreal } from "./ty/create"
import { garbageValJs, garbageValueGlsl } from "./ty/garbage"

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
          break
        case "with": {
          const bindings = parseBindingVars(node.b)
          const result: Record<string, JsValue> = {}
          for (const [id, node, name] of bindings) {
            if (id in result) {
              throw new Error(
                `Variable '${name}' declared twice. Maybe you want a 'withseq ...' clause instead of 'with ...'?`,
              )
            }
            result[id] = js(node, props)
          }
          return props.bindings.withAll(result, () => js(node.a, props))
        }
        case "withseq": {
          const bindings = parseBindingVars(node.b)
          const result: Record<string, JsValue> = {}
          for (const [name, node] of bindings) {
            result[name] = props.bindings.withAll(result, () => js(node, props))
          }
          return props.bindings.withAll(result, () => js(node.a, props))
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
      const value = props.bindings.get(id(node))
      if (value) {
        if (node.sup) {
          return POW.js(value, js(node.sup, props))
        } else {
          return value
        }
      }

      builtin: {
        if (node.sub) break builtin

        const value = BUILTINS[node.value]?.js
        if (!value) break builtin

        if (!node.sup) return value
        return POW.js(value, js(node.sup, props))
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
      throw new Error(
        "Piecewise functions are not supported outside of shaders yet.",
      )
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
      throw new Error("Empty expression.")
    case "index": {
      const on = js(node.on, props)
      if (!on.list) {
        throw new Error("Cannot index on a non-list.")
      }
      const index = js(node.index, props)
      if (index.list) {
        throw new Error("Cannot index with a list yet.")
      }
      if (index.type != "real") {
        throw new Error("Indexes must be numbers for now.")
      }
      const value = num(index.value) - 1
      return {
        ...on,
        list: false,
        value: on.value[value] ?? garbageValJs(on).value,
      } as any
    }
    case "num16":
    case "sub":
    case "sup":
    case "mixed":
    case "for":
    case "matrix":
    case "bigsym":
    case "big":
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
        case "with": {
          const bindings = parseBindingVars(node.b)
          const result: Record<string, GlslValue> = Object.create(null)
          for (const [id, node, name] of bindings) {
            if (id in result) {
              throw new Error(
                `Variable '${name}' declared twice. Maybe you want a 'withseq ...' clause instead of 'with ...'?`,
              )
            }
            result[id] = glsl(node, props)
          }
          return props.bindings.withAll(result, () => glsl(node.a, props))
        }
        case "withseq": {
          const bindings = parseBindingVars(node.b)
          const result: Record<string, GlslValue> = {}
          for (const [name, node] of bindings) {
            result[name] = props.bindings.withAll(result, () =>
              glsl(node, props),
            )
          }
          return props.bindings.withAll(result, () => glsl(node.a, props))
        }
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
        if (args.some((x) => x.list !== false)) {
          throw new Error("Cannot store a list inside another list.")
        }
        return listGlsl(props.ctx, args)
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
      const value = props.bindings.get(id(node))
      if (value) {
        if (node.sup) {
          return POW.glsl(props.ctx, value, glsl(node.sup, props))
        } else {
          return value
        }
      }

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

      props.ctx.push`${varDeclToGlsl(ret, name)};\n`
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
      if (node.value == "iterate") {
        return iterateGlsl(parseIterate(node), props)
      }
      break
    case "void":
      throw new Error("Empty expression.")
    case "index":
      const on = glsl(node.on, props)
      if (on.list === false) {
        throw new Error("Cannot index on a non-list.")
      }
      const indexVal = js(node.index, { ...props, bindings: new Bindings() })
      if (indexVal.list) {
        throw new Error("Cannot index with a list yet.")
      }
      if (indexVal.type != "real") {
        throw new Error("Indices must be numbers for now.")
      }
      const index = num(indexVal.value)
      if (index != Math.floor(index) || index <= 0 || index > on.list) {
        throw new Error(
          `Index ${index} is out-of-bounds on list of length ${on.list}.`,
        )
      }
      return {
        type: on.type,
        list: false,
        expr: `${on.expr}[${index - 1}]`,
      }
    case "num16":
    case "sub":
    case "sup":
    case "mixed":
    case "for":
    case "matrix":
    case "bigsym":
    case "big":
    case "root":
    case "commalist":
    case "factorial":
    case "punc":
  }

  throw new Error(
    `Node type '${node.type}' is not implemented for shaders yet.`,
  )
}
