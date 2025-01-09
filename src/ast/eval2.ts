import {
  approx,
  frac,
  GlslContext,
  GlslHelpers,
  real,
  safe,
  type GlslVal,
  type GlslValue,
  type SReal,
  type Value,
} from "./compute"
import { ADD } from "./ops"
import type { Node } from "./token"

export interface EvalProps {
  base: SReal
  ctx: GlslContext
}

export function parseNumberJs(text: string, base: SReal): SReal {
  const numericValue = base.type == "exact" ? base.n / base.d : base.value

  if (numericValue == 10) {
    const value = +text
    if (text[text.length - 1] == ".") text = text.slice(0, -1)
    if (text[0] == ".") text = "0" + text
    if (text[0] == "-.") text = "-0." + text.slice(3)
    if ("" + value == text) {
      const decimal = text.indexOf(".")
      if (decimal == -1) {
        return { type: "exact", n: value, d: 1 }
      } else {
        const n = parseInt(text.replace(".", ""), 10)
        return frac(n, 10 ** (text.length - decimal - 1))
      }
    } else {
      return approx(value)
    }
  }

  if (
    numericValue &&
    safe(numericValue) &&
    2 <= numericValue &&
    numericValue <= 36 &&
    text.indexOf(".") == -1
  ) {
    const int = parseInt(text, numericValue)
    if (int != int) {
      throw new Error(`${text} is not valid in base ${numericValue}.`)
    }
    if (safe(int)) {
      return { type: "exact", n: int, d: 1 }
    } else {
      return { type: "approx", value: int }
    }
  }

  throw new Error(
    "Bases other than 2-36 and evaluating a non-integer in a particular base are not suppported yet.",
  )
}

export function asNumericBase(value: Value): SReal {
  if (value.list) {
    throw new Error("Currently, only single real numbers can be bases.")
  }

  if (value.type != "real") {
    throw new Error("Currently, only real numbers can be bases.")
  }

  return value.value
}

export function js(node: Node, props: EvalProps): Value {
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

function parseNumberGlslInner(text: string, base: SReal): number {
  const numericValue = base.type == "exact" ? base.n / base.d : base.value

  if (numericValue == 10) {
    return +text
  }

  if (
    numericValue &&
    safe(numericValue) &&
    2 <= numericValue &&
    numericValue <= 36 &&
    text.indexOf(".") == -1
  ) {
    const int = parseInt(text, numericValue)
    if (int != int) {
      throw new Error(`${text} is not valid in base ${numericValue}.`)
    }
    return int
  }

  throw new Error(
    "Bases other than 2-36 and evaluating a non-integer in a particular base are not suppported yet.",
  )
}

export function parseNumberGlsl(text: string, base: SReal): string {
  const value = parseNumberGlslInner(text, base)
  if (value == 1 / 0) {
    return `(1.0/0.0)`
  }
  if (value == -1 / 0) {
    return `(-1.0/0.0)`
  }
  if (value == 0 / 0) {
    return `(0.0/0.0)`
  }
  return value.toExponential()
}

function list(values: string[]): string {
  if (values.length == 0) {
    return "nothing"
  }

  if (values.length == 1) {
    return values[0]!
  }

  if (values.length == 2) {
    return values[0]! + " and " + values[1]!
  }

  return values.slice(0, -1).join(", ") + ", and " + values[values.length - 1]!
}

function commalist(node: Node): Node[] {
  if (node.type == "commalist") {
    return node.items.slice()
  }

  if (node.type == "void") {
    return []
  }

  return [node]
}

function coerce(values: GlslVal[], message: `${string}%%${string}`): GlslValue {
  if (values.every((x) => x.type == "real")) {
    return {
      type: "real",
      list: values.length,
      expr: "[" + values.map((x) => x.expr).join(", ") + "]",
    }
  }

  if (values.every((x) => x.type == "real" || x.type == "complex")) {
    return {
      type: "complex",
      list: values.length,
      expr:
        "[" +
        values
          .map((x) => (x.type == "real" ? `vec2(${x.expr}, 0)` : x.expr))
          .join(", ") +
        "]",
    }
  }

  if (values.every((x) => x.type == "color")) {
    return {
      type: "color",
      list: values.length,
      expr: "[" + values.map((x) => x.expr).join(", ") + "]",
    }
  }

  throw new Error(
    message.replace(
      "%%",
      list(values.map((x) => x.type).filter((x, i, a) => a.indexOf(x) == i)),
    ),
  )
}

function glslCall(
  name: string,
  args: Node[],
  asMethod: boolean,
  props: EvalProps,
): GlslValue {
  switch (name) {
    case "rgb":
  }
  throw new Error(`The '${name}' function is not supported in shaders yet.`)
}

export function glsl(node: Node, props: EvalProps): GlslValue {
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
        return coerce(
          args,
          "List elements must be the same type; %% are different types",
        )
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
        const args = commalist(node)
        if (node.on) {
          args.unshift(node.on)
        }
        return glslCall(node.name.value, args, !!node.on, props)
      }
      break
    case "void":
    case "var":
    case "num16":
    case "sub":
    case "sup":
    case "raise":
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

  throw new Error(`Node type '${node.type}' is not implemented for shaders yet`)
}

export function defaultProps2(): EvalProps {
  return {
    base: real(10),
    ctx: new GlslContext(new GlslHelpers()),
  }
}
