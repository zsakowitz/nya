import type { ParenLhs, ParenRhs } from "../../field/cmd/math/brack"
import { Span } from "../../field/model"
import type { FieldComputed } from "../../sheet/deps"
import type { Deps } from "../deps"
import { glsl, type PropsGlsl } from "../glsl"
import { js, type PropsJs } from "../js"
import { type Bindings } from "../lib/binding"
import { OP_BINARY, OP_UNARY } from "../ops"
import { type GlslValue, type JsVal, type JsValue } from "../ty"
import { coerceValueGlsl, coerceValueJs } from "../ty/coerce"
import type {
  MagicVar,
  Node,
  NodeName,
  Nodes,
  OpBinary,
  PuncBinaryStr,
  PuncUnary,
  Suffix,
  Suffixes,
  SuffixName,
} from "./token"

export interface TxrAst<T> {
  js(node: T, props: PropsJs): JsValue
  glsl(node: T, props: PropsGlsl): GlslValue
  deps(node: T, deps: Deps): void
  drag: DragTarget<T>

  /**
   * If two packages attempt to load the same transformer, the one with a higher
   * `layer` takes precedence. If the same `layer` is used, the first one loaded
   * wins.
   */
  layer?: number
}

export interface PropsDrag {
  bindingsDrag: Bindings<[FieldComputed, Node]>
  field: FieldComputed
  js: PropsJs
}

type DragResult = { span: Span; field: FieldComputed }

type DragResultSigned = DragResult & { signed: boolean }

type DragResultPoint =
  // for when the X and Y coordinates are separate
  | { type: "split"; x: DragResultSigned | null; y: DragResultSigned | null }
  // for when the X and Y coordinates are part of a joint complex number
  | { type: "complex"; span: Span; field: FieldComputed }
  | { type: "glider"; shape: JsVal; value: DragResult }

interface DragTarget<T> {
  num(node: T, props: PropsDrag): DragResult | null
  point(node: T, props: PropsDrag): DragResultPoint | null
}

function joint<T>(
  fn: (node: T) => never,
  deps: (node: T, deps: Deps) => void,
): TxrAst<T> {
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
      point(node) {
        fn(node)
      },
    },
    deps,
    layer: -1,
  }
}

function errorAll<T>(data: TemplateStringsArray): TxrAst<T> {
  return joint(
    () => {
      throw new Error(data[0])
    },
    () => {},
  )
}

function error(
  data: TemplateStringsArray,
): <T>(f: (node: T, deps: Deps) => void) => TxrAst<T> {
  return (f) =>
    joint(() => {
      throw new Error(data[0])
    }, f)
}

export function dragNum(node: Node, props: PropsDrag) {
  const txr = TXR_AST[node.type]
  if (!txr) {
    throw new Error(`The transformer '${node.type}' is not defined.`)
  }
  return txr.drag.num(node as never, props)
}

export function dragPoint(node: Node, props: PropsDrag) {
  const txr = TXR_AST[node.type]
  if (!txr) {
    throw new Error(`The transformer '${node.type}' is not defined.`)
  }
  return txr.drag.point(node as never, props)
}

export const NO_DRAG: DragTarget<unknown> = {
  num() {
    return null
  },
  point() {
    return null
  },
}

export interface TxrMagicVar extends Omit<TxrAst<MagicVar>, "drag"> {
  helpers?: readonly PuncBinaryStr[]
  with?: {
    js(node: MagicVar, props: PropsJs, seq: boolean): Record<string, JsValue>
    glsl(
      node: MagicVar,
      props: PropsGlsl,
      seq: boolean,
    ): Record<string, GlslValue>
    deps(node: MagicVar, deps: Deps, seq: boolean): string[]
  }
}

export type TxrSuffixLhs<T> =
  | { type: "value"; value: T }
  | { type: "node"; value: Node }

export interface TxrSuffixArgs<T, U> {
  lhs: TxrSuffixLhs<U>
  readonly base: U
  rhs: T
  /**
   * Intentionally mutable, so that `a(b)!` can remove `!` from the stack and
   * immediately execute it on `b` if `a` is not a function.
   */
  rest: Suffix[]
}

export interface TxrSuffix<T> {
  drag?: DragTarget<{ lhs: Node; rhs: T }>
  js(node: TxrSuffixArgs<T, JsValue>, props: PropsJs): JsValue
  glsl(node: TxrSuffixArgs<T, GlslValue>, props: PropsGlsl): GlslValue
  deps(node: T, deps: Deps): void
  layer?: number
}

export interface TxrOpUnary extends TxrAst<Node> {}

export interface TxrOpBinary extends TxrAst<{ lhs: Node; rhs: Node }> {}

export interface TxrGroup extends Omit<TxrAst<Node>, "deps"> {}

export function group(node: { lhs: ParenLhs; rhs: ParenRhs }) {
  const g = TXR_GROUP[`${node.lhs} ${node.rhs}`]
  if (!g) {
    throw new Error(`${node.lhs}...${node.rhs} brackets are not supported yet.`)
  }
  return g
}

export const TXR_GROUP: Partial<Record<`${ParenLhs} ${ParenRhs}`, TxrGroup>> =
  Object.create(null)

export const TXR_MAGICVAR: Record<string, TxrMagicVar> = Object.create(null)

export const TXR_OP_UNARY: Partial<Record<PuncUnary, TxrOpUnary>> =
  Object.create(null)

export const TXR_OP_BINARY: Partial<Record<OpBinary, TxrOpBinary>> =
  Object.create(null)

export const TXR_SUFFIX: { [K in SuffixName]?: TxrSuffix<Suffixes[K]> } =
  Object.create(null)

// Most of these just error instead of specifying any behavior, as actual
// behavior should be left to packages. The ones which aren't immediate errors
// are explained.
export const TXR_AST: { [K in NodeName]?: TxrAst<Nodes[K]> } = {
  // Delegates to `GROUP` so that different packages can specify different groups
  group: {
    js(node, props) {
      return group(node).js(node.value, props)
    },
    glsl(node, props) {
      return group(node).glsl(node.value, props)
    },
    drag: {
      num(node, props) {
        return group(node).drag.num(node.value, props)
      },
      point(node, props) {
        return group(node).drag.point(node.value, props)
      },
    },
    deps(node, deps) {
      deps.add(node.value)
    },
  },

  // Delegates to `MAGIC_VARS` so packages can specify varied magic variables
  magicvar: {
    js(node, props) {
      if (node.value in TXR_MAGICVAR) {
        return TXR_MAGICVAR[node.value]!.js(node as never, props)
      }
      throw new Error(`The '${node.value}' operator is not defined.`)
    },
    glsl(node, props) {
      if (node.value in TXR_MAGICVAR) {
        return TXR_MAGICVAR[node.value]!.glsl(node as never, props)
      }
      throw new Error(`The '${node.value}' operator is not defined.`)
    },
    drag: NO_DRAG,
    deps(node, deps) {
      if (node.value in TXR_MAGICVAR) {
        TXR_MAGICVAR[node.value]!.deps(node as never, deps)
      } else {
        throw new Error(`The '${node.value}' operator is not defined.`)
      }
    },
  },

  // Delegates to `TXR_OP_UNARY`, `TXR_OP_BINARY`, `OP_UNARY`, and `OP_BINARY`
  op: {
    layer: -1,
    deps(node, deps) {
      if (node.b) {
        const txr = TXR_OP_BINARY[node.kind]
        if (txr) {
          txr.deps({ lhs: node.a, rhs: node.b }, deps)
        } else {
          deps.add(node.a)
          deps.add(node.b)
        }
      } else {
        const txr = TXR_OP_UNARY[node.kind]
        if (txr) {
          txr.deps(node.a, deps)
        } else {
          deps.add(node.a)
        }
      }
    },
    drag: {
      num(node, props) {
        if (node.b) {
          const txr = TXR_OP_BINARY[node.kind]
          if (txr) {
            return txr.drag.num({ lhs: node.a, rhs: node.b }, props)
          }
        } else {
          const txr = TXR_OP_UNARY[node.kind]
          if (txr) {
            return txr.drag.num(node.a, props)
          }
        }
        return null
      },
      point(node, props) {
        if (node.b) {
          const txr = TXR_OP_BINARY[node.kind]
          if (txr) {
            return txr.drag.point({ lhs: node.a, rhs: node.b }, props)
          }
        } else {
          const txr = TXR_OP_UNARY[node.kind]
          if (txr) {
            return txr.drag.point(node.a, props)
          }
        }
        return null
      },
    },
    js(node, props) {
      if (node.b) {
        const txr = TXR_OP_BINARY[node.kind]
        if (txr) {
          return txr.js({ lhs: node.a, rhs: node.b }, props)
        }
        const op = OP_BINARY[node.kind]
        if (op) {
          return op.js([js(node.a, props), js(node.b, props)])
        }
      } else {
        const txr = TXR_OP_UNARY[node.kind]
        if (txr) {
          return txr.js(node.a, props)
        }
        const op = OP_UNARY[node.kind]
        if (op) {
          return op.js([js(node.a, props)])
        }
      }
      throw new Error(`The operator '${node.kind}' is not defined.`)
    },
    glsl(node, props) {
      if (node.b) {
        const txr = TXR_OP_BINARY[node.kind]
        if (txr) {
          return txr.glsl({ lhs: node.a, rhs: node.b }, props)
        }
        const op = OP_BINARY[node.kind]
        if (op) {
          return op.glsl(props.ctx, [glsl(node.a, props), glsl(node.b, props)])
        }
      } else {
        const txr = TXR_OP_UNARY[node.kind]
        if (txr) {
          return txr.glsl(node.a, props)
        }
        const op = OP_UNARY[node.kind]
        if (op) {
          return op.glsl(props.ctx, [glsl(node.a, props)])
        }
      }
      throw new Error(`The operator '${node.kind}' is not defined.`)
    },
  },

  // The type system is implemented in project nya core, so it makes sense to
  // have its transformer in libcore.
  tycoerce: {
    deps(node, deps) {
      deps.add(node.value)
    },
    drag: NO_DRAG,
    glsl(node, props) {
      const value = glsl(node.value, props)
      return {
        type: node.name,
        list: value.list,
        expr: coerceValueGlsl(props.ctx, value, {
          type: node.name,
          list: value.list,
        }),
      }
    },
    js(node, props) {
      const value = js(node.value, props)
      return coerceValueJs(value, {
        type: node.name,
        list: value.list,
      })
    },
    layer: -1,
  },

  // Immediately throws whatever error was in the source node
  error: joint(
    ({ reason }) => {
      throw new Error(reason)
    },
    () => {},
  ),

  // A special built-in used for previewing picked objects
  value: {
    deps() {},
    drag: NO_DRAG,
    glsl() {
      throw new Error("Cannot evaluate a 'value' node in a shader.")
    },
    js(node) {
      return node.value
    },
    layer: -1,
  },

  // Delegates to `TXR_SUFFIX` so that different packages can specify suffixes
  suffixed: {
    drag: {
      point(node, props) {
        return null
      },
      num(node, props) {
        return null
      },
    },
    layer: -1,
    js(node, props) {
      const rest = node.suffixes.slice()
      let lhs: TxrSuffixLhs<JsValue> = { type: "node", value: node.base }
      let suffix

      while ((suffix = rest[0])) {
        rest.shift()
        const txr = TXR_SUFFIX[suffix.type] as TxrSuffix<unknown>
        if (!txr) {
          throw new Error(`Suffix '${suffix.type}' is not defined.`)
        }

        lhs = {
          type: "value",
          value: txr.js(
            {
              lhs,
              get base() {
                return lhs.type == "node" ? js(lhs.value, props) : lhs.value
              },
              rhs: suffix,
              rest,
            },
            props,
          ),
        }
      }

      switch (lhs.type) {
        case "value":
          return lhs.value
        case "node":
          return js(lhs.value, props)
      }
    },
    glsl(node, props) {
      const rest = node.suffixes.slice()
      let lhs: TxrSuffixLhs<GlslValue> = { type: "node", value: node.base }
      let suffix

      while ((suffix = rest[0])) {
        rest.shift()
        const txr = TXR_SUFFIX[suffix.type] as TxrSuffix<unknown>
        if (!txr) {
          throw new Error(`Suffix '${suffix.type}' is not defined.`)
        }

        lhs = {
          type: "value",
          value: txr.glsl(
            {
              lhs,
              get base() {
                return lhs.type == "node" ? glsl(lhs.value, props) : lhs.value
              },
              rhs: suffix,
              rest,
            },
            props,
          ),
        }
      }

      switch (lhs.type) {
        case "value":
          return lhs.value
        case "node":
          return glsl(lhs.value, props)
      }
    },
    deps(node, deps) {
      deps.add(node.base)
      for (const suffix of node.suffixes) {
        const txr = TXR_SUFFIX[suffix.type] as TxrSuffix<unknown>
        txr?.deps(suffix, deps)
      }
    },
  },

  // Everything else just errors or adds dependencies.
  void: error`Empty expression.`(() => {}),
  commalist: error`Lists must be surrounded by square brackets.`(
    (node, deps) => {
      for (const x of node.items) {
        deps.add(x)
      }
    },
  ),
  sub: error`Invalid subscript.`((node, deps) => deps.add(node.sub)),
  sup: error`Invalid superscript.`((node, deps) => deps.add(node.sup)),
  big: errorAll`Summation and product notation is not supported yet.`,
  bigsym: errorAll`Invalid sum or product.`,
  num16: errorAll`UScript is not supported yet.`,
  matrix: errorAll`Matrices are not supported yet.`,
  binding: error`Cannot evaluate a variable binding.`((node, deps) =>
    deps.add(node.value),
  ),
  field: errorAll`Field notation is not supported yet.`,
  punc: joint(
    (node) => {
      throw new Error(`Unexpected operator '${node.value}'.`)
    },
    () => {},
  ),
  tyname: errorAll`Cannot evaluate a raw type name.`,
}

Object.setPrototypeOf(TXR_AST, null)
