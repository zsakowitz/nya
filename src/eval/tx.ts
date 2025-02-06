import type { Span } from "../field/model"
import { commalist, fnargs } from "./ast/collect"
import type { Node } from "./ast/token"
import { glsl, glslCall, type PropsGlsl } from "./glsl"
import { js, jsCall, type PropsJs } from "./js"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "./lib/base"
import { id, name, type Bindings } from "./lib/binding"
import { OP_BINARY, OP_UNARY } from "./ops"
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
import type { GlslValue, JsValue } from "./ty"
import { isReal, listGlsl, listJs } from "./ty/coerce"
import { frac, num, real } from "./ty/create"
import { TY_INFO } from "./ty/info"
import { splitValue } from "./ty/split"

export interface AstTxr<T> {
  js(node: T, props: PropsJs): JsValue
  glsl(node: T, props: PropsGlsl): GlslValue
  drag: DragTarget<T>
}

export interface PropsDragTarget {
  bindingsDrag: Bindings<Node>
}

export interface DragTarget<T> {
  num(node: T, props: PropsDragTarget): Span | null
}

function joint<T>(fn: (node: T) => never): AstTxr<T> {
  return {
    js(node) {
      fn(node)
    },
    glsl(node) {
      fn(node)
    },
    drag: {
      num(node) {
        fn(node)
      },
    },
  }
}

function error<T>(data: TemplateStringsArray): AstTxr<T> {
  return joint(() => {
    throw new Error(data[0])
  })
}

function dragNum(node: Node, props: PropsDragTarget) {
  return AST_TXRS[node.type].drag.num(node as never, props)
}

const NO_DRAG: DragTarget<unknown> = {
  num() {
    return null
  },
}

export const AST_TXRS: {
  [K in Node["type"]]: AstTxr<Extract<Node, { type: K }>>
} = {
  num: {
    js(node, props) {
      return parseNumberJs(
        node.value,
        node.sub ? asNumericBase(js(node.sub, props)) : props.base,
      )
    },
    glsl(node, props) {
      return parseNumberGlsl(
        node.value,
        node.sub ? asNumericBase(js(node.sub, props)) : props.base,
      )
    },
    drag: {
      num(node) {
        return node.span
      },
    },
  },
  op: {
    js(node, props) {
      if (!node.b) {
        const op = OP_UNARY[node.kind]
        if (op) {
          return op.js(js(node.a, props))
        }
        throw new Error(`The operator '${node.kind}' is not supported yet.`)
      }
      switch (node.kind) {
        case "base":
          return js(
            node.a,
            Object.create(props, {
              base: {
                value:
                  (
                    node.b.type == "var" &&
                    node.b.kind == "var" &&
                    !node.b.sub &&
                    !node.b.sup &&
                    (node.b.value == "mrrp" || node.b.value == "meow")
                  ) ?
                    real(10)
                  : asNumericBase(
                      js(
                        node.b,
                        Object.create(props, { base: { value: real(10) } }),
                      ),
                    ),
              },
            }),
          )
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
          return props.bindingsJs.withAll(
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
    },
    glsl(node, props) {
      if (!node.b) {
        const op = OP_UNARY[node.kind]
        if (op) {
          return op.glsl(props.ctx, glsl(node.a, props))
        }
        throw new Error(`The operator '${node.kind}' is not supported yet.`)
      }
      switch (node.kind) {
        case "base":
          return glsl(
            node.a,
            Object.create(props, {
              base: {
                value:
                  (
                    node.b.type == "var" &&
                    node.b.kind == "var" &&
                    !node.b.sub &&
                    !node.b.sup &&
                    (node.b.value == "mrrp" || node.b.value == "meow")
                  ) ?
                    real(10)
                  : asNumericBase(
                      js(
                        node.b,
                        Object.create(props, { base: { value: real(10) } }),
                      ),
                    ),
              },
            }),
          )
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
    },
    drag: {
      num() {
        return null
      },
    },
  },
  group: {
    js(node, props) {
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
      throw new Error(
        `${node.lhs}...${node.rhs} brackets are not supported yet.`,
      )
    },
    glsl(node, props) {
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
      throw new Error(
        `${node.lhs}...${node.rhs} brackets are not supported yet.`,
      )
    },
    drag: {
      num(node, props) {
        if (node.lhs == "(" && node.rhs == ")") {
          return dragNum(node.value, props)
        }
        return null
      },
    },
  },
  call: {
    js(node, props) {
      if (
        node.name.type == "var" &&
        node.name.kind == "prefix" &&
        !node.name.sub &&
        !node.name.sup
      ) {
        const args = node.on ? commalist(node.args) : fnargs(node.args)
        if (node.on) {
          args.unshift(node.on)
        }
        return jsCall(node.name.value, args, !!node.on, props)
      }
      throw new Error("Cannot call anything except built-in functions yet.")
    },
    glsl(node, props) {
      if (
        node.name.type == "var" &&
        node.name.kind == "prefix" &&
        !node.name.sub &&
        !node.name.sup
      ) {
        const args = node.on ? commalist(node.args) : fnargs(node.args)
        if (node.on) {
          args.unshift(node.on)
        }
        return glslCall(node.name.value, args, !!node.on, props)
      }
      throw new Error("Cannot call anything except built-in functions yet.")
    },
    drag: NO_DRAG,
  },
  juxtaposed: {
    js(node, props) {
      if (node.nodes.length == 0) {
        throw new Error("Cannot implicitly multiply zero things.")
      }
      return node.nodes
        .map((x) => js(x, props))
        .reduce((a, b) => OP_JUXTAPOSE.js(a, b))
    },
    glsl(node, props) {
      if (node.nodes.length == 0) {
        throw new Error("Cannot implicitly multiply zero things.")
      }
      return node.nodes
        .map((x) => glsl(x, props))
        .reduce((a, b) => OP_JUXTAPOSE.glsl(props.ctx, a, b))
    },
    drag: NO_DRAG,
  },
  var: {
    js(node, props) {
      const value = props.bindingsJs.get(id(node))
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

      let n
      try {
        n = name(node)
      } catch {
        n = node.value + (node.sub ? "..." : "")
      }
      throw new Error(`The variable '${n}' is not defined.`)
    },
    glsl(node, props) {
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

      let n
      try {
        n = name(node)
      } catch {
        n = node.value + (node.sub ? "..." : "")
      }
      throw new Error(`The variable '${n}' is not defined.`)
    },
    drag: {
      num(node, props) {
        if (node.sup) return null

        const value = props.bindingsDrag.get(id(node))
        if (value) {
          return dragNum(value, props)
        }

        return null
      },
    },
  },
  frac: {
    js(node, props) {
      return OP_DIV.js(js(node.a, props), js(node.b, props))
    },
    glsl(node, props) {
      return OP_DIV.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
    },
    drag: NO_DRAG,
  },
  raise: {
    js(node, props) {
      return OP_RAISE.js(js(node.base, props), js(node.exponent, props))
    },
    glsl(node, props) {
      return OP_RAISE.glsl(
        props.ctx,
        glsl(node.base, props),
        glsl(node.exponent, props),
      )
    },
    drag: NO_DRAG,
  },
  cmplist: {
    js(node, props) {
      return node.ops
        .map((op, i) => {
          const a = js(node.items[i]!, props)
          const b = js(node.items[i + 1]!, props)
          return pickCmp(op).js(a, b)
        })
        .reduce((a, b) => OP_AND.js(a, b))
    },
    glsl(node, props) {
      return node.ops
        .map((op, i) => {
          const a = glsl(node.items[i]!, props)
          const b = glsl(node.items[i + 1]!, props)
          return pickCmp(op).glsl(props.ctx, a, b)
        })
        .reduce((a, b) => OP_AND.glsl(props.ctx, a, b))
    },
    drag: NO_DRAG,
  },
  piecewise: {
    js(node, props) {
      return piecewiseJs(node.pieces, props)
    },
    glsl(node, props) {
      return piecewiseGlsl(node.pieces, props)
    },
    drag: NO_DRAG,
  },
  error: joint(({ reason }) => {
    throw new Error(reason)
  }),
  magicvar: {
    js(node, props) {
      if (node.value == "iterate") {
        const parsed = parseIterate(node, { source: "expr" })
        const { data, count } = iterateJs(parsed, { eval: props, seq: false })
        if (parsed.retval == "count") {
          return { type: "r64", list: false, value: real(count) }
        } else {
          return data[parsed.retval!.id]!
        }
      }
      throw new Error(`The '${node.value}' operator is not supported yet.`)
    },
    glsl(node, props) {
      if (node.value == "iterate") {
        const parsed = parseIterate(node, { source: "expr" })
        const { data, count } = iterateGlsl(parsed, { eval: props, seq: false })
        if (parsed.retval == "count") {
          return count
        } else {
          return data[parsed.retval!.id]!
        }
      }
      throw new Error(`The '${node.value}' operator is not supported yet.`)
    },
    drag: NO_DRAG,
  },
  void: error`Empty expression.`,
  index: {
    js(node, props) {
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
    },
    glsl(node, props) {
      const on = glsl(node.on, props)
      if (on.list === false) {
        throw new Error("Cannot index on a non-list.")
      }
      const indexVal = js(node.index, props)
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
    },
    drag: NO_DRAG,
  },
  mixed: {
    js(node, props) {
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
    },
    glsl(node, props) {
      const value = add(
        parseNumberJs(node.integer, props.base).value,
        div(
          parseNumberJs(node.a, props.base).value,
          parseNumberJs(node.b, props.base).value,
        ),
      )
      return splitValue(num(value))
    },
    drag: NO_DRAG,
  },
  root: {
    js(node, props) {
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
    },
    glsl(node, props) {
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
    },
    drag: NO_DRAG,
  },
  commalist: error`Lists must be surrounded by square brackets.`,
  sub: error`Invalid subscript.`,
  sup: error`Invalid superscript.`,
  big: error`Summation and product notation is not supported yet.`,
  bigsym: error`Invalid sum or product.`,
  factorial: error`Factorials are not supported yet.`,
  num16: error`UScript is not supported yet.`,
  matrix: error`Matrices are not supported yet.`,
  binding: error`Cannot evaluate a variable binding.`,
  punc: joint((node) => {
    throw new Error(`Unexpected operator '${node.value}'.`)
  }),
}
