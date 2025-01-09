import { commalist, fnargs } from "./ast/collect"
import type { Node } from "./ast/token"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "./base"
import { GlslContext, GlslHelpers } from "./fn"
import { ADD, RGB } from "./ops"
import type { GlslValue, JsValue, SReal } from "./ty"
import { listGlsl } from "./ty/coerce"
import { real } from "./ty/create"

export interface PropsJs {
  base: SReal
}

export interface PropsGlsl extends PropsJs {
  ctx: GlslContext
}

export function defaultProps(): PropsGlsl {
  return {
    base: real(10),
    ctx: new GlslContext(new GlslHelpers()),
  }
}

export function js(node: Node, props: PropsGlsl): JsValue {
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
    case "void":
    case "var":
    case "num16":
    case "group":
    case "sub":
    case "sup":
    case "raise":
    case "call":
    case "frac":
    case "mixed":
    case "for":
    case "piecewise":
    case "matrix":
    case "bigsym":
    case "big":
    case "root":
    case "index":
    case "juxtaposed":
    case "commalist":
    case "factorial":
    case "error":
    case "punc":
  }

  throw new Error(`Node type '${node.type}' is not implemented yet`)
}

function glslCall(
  name: string,
  args: Node[],
  _asMethod: boolean,
  props: PropsGlsl,
): GlslValue {
  const evald = () => args.map((arg) => glsl(arg, props))

  switch (name) {
    case "rgb":
      return RGB.glsl(props.ctx, ...evald())
  }
  throw new Error(`The '${name}' function is not supported in shaders yet.`)
}

export function glsl(node: Node, props: PropsGlsl): GlslValue {
  switch (node.type) {
    case "num":
      return {
        type: "real",
        list: false,
        expr: parseNumberGlsl(
          node.value,
          node.sub ? asNumericBase(js(node.sub, props)) : props.base,
        ),
      }
    case "op":
      if (node.kind == "+" && node.b) {
        return ADD.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
      }
      break
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
    case "piecewise":
    case "void":
    case "var":
    case "num16":
    case "sub":
    case "sup":
    case "raise":
    case "frac":
    case "mixed":
    case "for":
    case "matrix":
    case "bigsym":
    case "big":
    case "root":
    case "index":
    case "juxtaposed":
    case "commalist":
    case "factorial":
    case "error":
    case "punc":
  }

  throw new Error(`Node type '${node.type}' is not implemented for shaders yet`)
}
