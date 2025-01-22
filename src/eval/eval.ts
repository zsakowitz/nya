import { commalist, fnargs } from "./ast/collect"
import type { Node } from "./ast/token"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "./base"
import { Bindings, id } from "./binding"
import { GlslContext, GlslHelpers } from "./fn"
import { FNS, OP_BINARY, OP_UNARY } from "./ops"
import { iterateGlsl, iterateJs, parseIterate } from "./ops/iterate"
import { OP_ABS } from "./ops/op/abs"
import { add } from "./ops/op/add"
import { OP_AND } from "./ops/op/and"
import { pickCmp } from "./ops/op/cmp"
import { div, OP_DIV } from "./ops/op/div"
import { OP_JUXTAPOSE } from "./ops/op/juxtapose"
import { OP_POINT } from "./ops/op/point"
import { OP_RAISE } from "./ops/op/raise"
import { OP_X } from "./ops/op/x"
import { OP_Y } from "./ops/op/y"
import { piecewiseGlsl, piecewiseJs } from "./ops/piecewise"
import { VARS } from "./ops/vars"
import { withBindingsGlsl, withBindingsJs } from "./ops/with"
import type { GlslValue, JsValue, SReal } from "./ty"
import { isReal, listGlsl, listJs } from "./ty/coerce"
import { frac, num, real } from "./ty/create"
import { TY_INFO } from "./ty/info"
import { splitValue } from "./ty/split"

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
  const fn = FNS[name]

  if (!fn) {
    throw new Error(`The '${name}' function is not supported yet.`)
  }

  return fn.js(...args.map((arg) => js(arg, props)))
}

export function js(node: Node, props: PropsJs): JsValue {
  switch (node.type) {
    case "num":
      return parseNumberJs(
        node.value,
        node.sub ? asNumericBase(js(node.sub, props)) : props.base,
      )
    case "op":
      if (!node.b) {
        const op = OP_UNARY[node.kind]
        if (op) {
          return op.js(js(node.a, props))
        }
        throw new Error(`The operator '${node.kind}' is not supported yet.`)
      }
      switch (node.kind) {
        case "base":
          return js(node.a, {
            ...props,
            base:
              (
                node.b.type == "var" &&
                node.b.kind == "var" &&
                !node.b.sub &&
                !node.b.sup &&
                (node.b.value == "mrrp" || node.b.value == "meow")
              ) ?
                real(10)
              : asNumericBase(js(node.b, { ...props, base: real(10) })),
          })
        case ".":
          if (node.b.type == "var" && !node.b.sub) {
            if (node.b.kind == "var") {
              const value =
                node.b.value == "x" ? OP_X.js(js(node.a, props))
                : node.b.value == "y" ? OP_Y.js(js(node.a, props))
                : null

              if (value == null) {
                break
              }

              if (node.b.sup) {
                return OP_RAISE.js(value, js(node.b.sup, props))
              } else {
                return value
              }
            } else if (node.b.kind == "prefix") {
              return jsCall(node.b.value, [node.a], true, props)
            }
          }
          break
        case "with":
        case "withseq": {
          return props.bindings.withAll(
            withBindingsJs(node.b, node.kind == "withseq", props),
            () => js(node.a, props),
          )
        }
      }
      const op = OP_BINARY[node.kind]
      if (op) {
        return op.js(js(node.a, props), js(node.b, props))
      }
      throw new Error(`The operator '${node.kind}' is not supported yet.`)
    case "group":
      if (node.lhs == "(" && node.rhs == ")") {
        if (node.value.type == "commalist") {
          return OP_POINT.js(...node.value.items.map((x) => js(x, props)))
        }
        return js(node.value, props)
      }
      if (node.lhs == "[" && node.rhs == "]") {
        return listJs(commalist(node.value).map((item) => js(item, props)))
      }
      if (node.lhs == "|" && node.rhs == "|") {
        return OP_ABS.js(js(node.value, props))
      }
      break
    case "call":
      if (
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
      if (node.nodes.length == 0) {
        throw new Error("Cannot juxtapose zero nodes.")
      }
      return node.nodes
        .map((x) => js(x, props))
        .reduce((a, b) => OP_JUXTAPOSE.js(a, b))
    case "var": {
      const value = props.bindings.get(id(node))
      if (value) {
        if (node.sup) {
          return OP_RAISE.js(value, js(node.sup, props))
        } else {
          return value
        }
      }

      builtin: {
        if (node.sub) break builtin

        const value = VARS[node.value]?.js
        if (!value) break builtin

        if (!node.sup) return value
        return OP_RAISE.js(value, js(node.sup, props))
      }

      throw new Error(`The variable '${node.value}' is not defined.`)
    }
    case "frac":
      return OP_DIV.js(js(node.a, props), js(node.b, props))
    case "raise":
      return OP_RAISE.js(js(node.base, props), js(node.exponent, props))
    case "cmplist":
      return node.ops
        .map((op, i) => {
          const a = js(node.items[i]!, props)
          const b = js(node.items[i + 1]!, props)
          return pickCmp(op).js(a, b)
        })
        .reduce((a, b) => OP_AND.js(a, b))
    case "piecewise":
      return piecewiseJs(node.pieces, props)
    case "root":
      if (node.root) {
        return OP_RAISE.js(
          js(node.contents, props),
          OP_DIV.js(
            { list: false, type: "r64", value: frac(1, 1) },
            js(node.root, props),
          ),
        )
      } else {
        return OP_RAISE.js(js(node.contents, props), {
          list: false,
          type: "r64",
          value: frac(1, 2),
        })
      }
    case "error":
      throw new Error(node.reason)
    case "magicvar":
      if (node.value == "iterate") {
        const parsed = parseIterate(node, { source: "expr" })
        const { data, count } = iterateJs(parsed, { eval: props, seq: false })
        if (parsed.retval == "count") {
          return { type: "r64", list: false, value: real(count) }
        } else {
          return data[parsed.retval!.id]!
        }
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
      if (index.list !== false) {
        throw new Error("Cannot index with a list yet.")
      }
      if (!isReal(index)) {
        throw new Error("Indexes must be numbers for now.")
      }
      const value = num(index.value) - 1
      return {
        type: on.type,
        list: false,
        value: on.value[value] ?? TY_INFO[on.type].garbage.js,
      }
    }
    case "commalist":
      throw new Error("Lists must be surrounded by square brackets.")
    case "sub":
      throw new Error("Invalid subscript.")
    case "sup":
      throw new Error("Lone superscript.")
    case "mixed":
      return {
        type: "r64",
        list: false,
        value: add(
          parseNumberJs(node.integer, props.base).value,
          div(
            parseNumberJs(node.a, props.base).value,
            parseNumberJs(node.b, props.base).value,
          ),
        ),
      }
    case "num16":
    case "for":
    case "matrix":
    case "bigsym":
    case "big":
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
  const fn = FNS[name]

  if (!fn) {
    throw new Error(`The '${name}' function is not supported in shaders yet.`)
  }

  return fn.glsl(props.ctx, ...args.map((arg) => glsl(arg, props)))
}

export function glsl(node: Node, props: PropsGlsl): GlslValue {
  switch (node.type) {
    case "num":
      return parseNumberGlsl(
        node.value,
        node.sub ?
          asNumericBase(js(node.sub, { ...props, bindings: new Bindings() }))
        : props.base,
      )
    case "op":
      if (!node.b) {
        const op = OP_UNARY[node.kind]
        if (op) {
          return op.glsl(props.ctx, glsl(node.a, props))
        }
        throw new Error(`The operator '${node.kind}' is not supported yet.`)
      }
      switch (node.kind) {
        case "base":
          return glsl(node.a, {
            ...props,
            base:
              (
                node.b.type == "var" &&
                node.b.kind == "var" &&
                !node.b.sub &&
                !node.b.sup &&
                (node.b.value == "mrrp" || node.b.value == "meow")
              ) ?
                real(10)
              : asNumericBase(
                  js(node.b, {
                    ...props,
                    base: real(10),
                    bindings: new Bindings(),
                  }),
                ),
          })
        case "with":
        case "withseq": {
          return props.bindings.withAll(
            withBindingsGlsl(node.b, node.kind == "withseq", props),
            () => glsl(node.a, props),
          )
        }
        case ".":
          if (node.b.type == "var" && !node.b.sub) {
            if (node.b.kind == "var") {
              const value =
                node.b.value == "x" ? OP_X.glsl(props.ctx, glsl(node.a, props))
                : node.b.value == "y" ?
                  OP_Y.glsl(props.ctx, glsl(node.a, props))
                : null

              if (value == null) {
                break
              }

              if (node.b.sup) {
                return OP_RAISE.glsl(props.ctx, value, glsl(node.b.sup, props))
              } else {
                return value
              }
            } else if (node.b.kind == "prefix") {
              return glslCall(node.b.value, [node.a], true, props)
            }
          }
      }
      const op = OP_BINARY[node.kind]
      if (op) {
        return op.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
      }
      throw new Error(`The operator '${node.kind}' is not supported yet.`)
    case "group":
      if (node.lhs == "(" && node.rhs == ")") {
        if (node.value.type == "commalist") {
          return OP_POINT.glsl(
            props.ctx,
            ...node.value.items.map((x) => glsl(x, props)),
          )
        }
        return glsl(node.value, props)
      }
      if (node.lhs == "[" && node.rhs == "]") {
        return listGlsl(
          props.ctx,
          commalist(node.value).map((item) => glsl(item, props)),
        )
      }
      if (node.lhs == "|" && node.rhs == "|") {
        return OP_ABS.glsl(props.ctx, glsl(node.value, props))
      }
      break
    case "call":
      if (
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
      if (node.nodes.length == 0) {
        throw new Error("Cannot juxtapose zero nodes.")
      }
      return node.nodes
        .map((x) => glsl(x, props))
        .reduce((a, b) => OP_JUXTAPOSE.glsl(props.ctx, a, b))
    case "var": {
      const value = props.bindings.get(id(node))
      if (value) {
        if (node.sup) {
          return OP_RAISE.glsl(props.ctx, value, glsl(node.sup, props))
        } else {
          return value
        }
      }

      builtin: {
        if (node.sub) break builtin

        const value = VARS[node.value]?.glsl
        if (!value) break builtin

        if (!node.sup) return value
        return OP_RAISE.glsl(props.ctx, value, glsl(node.sup, props))
      }

      throw new Error(`The variable '${node.value}' is not defined.`)
    }
    case "frac":
      return OP_DIV.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
    case "raise":
      return OP_RAISE.glsl(
        props.ctx,
        glsl(node.base, props),
        glsl(node.exponent, props),
      )
    case "cmplist":
      return node.ops
        .map((op, i) => {
          const a = glsl(node.items[i]!, props)
          const b = glsl(node.items[i + 1]!, props)
          return pickCmp(op).glsl(props.ctx, a, b)
        })
        .reduce((a, b) => OP_AND.glsl(props.ctx, a, b))
    case "piecewise":
      return piecewiseGlsl(node.pieces, props)
    case "error":
      throw new Error(node.reason)
    case "magicvar":
      if (node.value == "iterate") {
        const parsed = parseIterate(node, { source: "expr" })
        const { data, count } = iterateGlsl(parsed, { eval: props, seq: false })
        if (parsed.retval == "count") {
          return count
        } else {
          return data[parsed.retval!.id]!
        }
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
      if (indexVal.list !== false) {
        throw new Error("Cannot index with a list yet.")
      }
      if (!isReal(indexVal)) {
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
    case "commalist":
      throw new Error("Lists must be surrounded by square brackets.")
    case "sub":
      throw new Error("Invalid subscript.")
    case "sup":
      throw new Error("Lone superscript.")
    case "mixed":
      const value = add(
        parseNumberJs(node.integer, props.base).value,
        div(
          parseNumberJs(node.a, props.base).value,
          parseNumberJs(node.b, props.base).value,
        ),
      )
      return splitValue(num(value))
    case "root":
      if (node.root) {
        return OP_RAISE.glsl(
          props.ctx,
          glsl(node.contents, props),
          OP_DIV.glsl(
            props.ctx,
            { list: false, type: "r64", expr: "vec2(1, 0)" },
            glsl(node.root, props),
          ),
        )
      } else {
        return OP_RAISE.glsl(props.ctx, glsl(node.contents, props), {
          list: false,
          type: "r64",
          expr: "vec2(0.5, 0)",
        })
      }
    case "num16":
    case "for":
    case "matrix":
    case "bigsym":
    case "big":
    case "factorial":
    case "punc":
  }

  throw new Error(
    `Node type '${node.type}' is not implemented for shaders yet.`,
  )
}
