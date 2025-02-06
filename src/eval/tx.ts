import { commalist, fnargs } from "./ast/collect"
import type { Node } from "./ast/token"
import { glsl, glslCall, type PropsGlsl } from "./glsl"
import { js, jsCall, type PropsJs } from "./js"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "./lib/base"
import { id, name } from "./lib/binding"
import { OP_BINARY, OP_UNARY } from "./ops"
import { OP_ABS } from "./ops/op/abs"
import { OP_JUXTAPOSE } from "./ops/op/juxtapose"
import { OP_POINT } from "./ops/op/point"
import { OP_RAISE } from "./ops/op/raise"
import { OP_X } from "./ops/op/x"
import { OP_Y } from "./ops/op/y"
import { VARS } from "./ops/vars"
import { withBindingsGlsl, withBindingsJs } from "./ops/with"
import type { GlslValue, JsValue } from "./ty"
import { listGlsl, listJs } from "./ty/coerce"
import { real } from "./ty/create"

export interface AstTxr<T> {
  js(node: T, props: PropsJs): JsValue
  glsl(node: T, props: PropsGlsl): GlslValue
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
  },
}
