import type { ParenLhs, ParenRhs } from "@/field/cmd/math/brack"
import type { Span } from "@/field/model"
import type { FieldComputed } from "@/sheet/deps"
import type { Deps } from "../deps"
import type { PropsGlsl, PropsSym } from "../glsl"
import type { PropsJs } from "../js"
import type { Bindings } from "../lib/binding"
import { OP_BINARY, OP_UNARY } from "../ops"
import type { Sym } from "../sym"
import type { GlslValue, JsVal, JsValue } from "../ty"
import { TY_INFO } from "../ty/info"
import { commalist } from "./collect"
import type {
  MagicVar,
  Node,
  NodeName,
  Nodes,
  OpBinary,
  PuncBinaryStr,
  PuncUnary,
  Suffix,
  SuffixName,
  Suffixes,
} from "./token"

// SHAPE: make all txr shapes consistent

export interface TxrAst<T> {
  js(node: T, props: PropsJs): JsValue
  glsl(node: T, props: PropsGlsl): GlslValue
  sym(node: T, props: PropsSym): Sym
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

export type DragResultPoint =
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
    sym(node) {
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
  /**
   * If `true`, the magic variable will scope like a regular function (think
   * `sym` or `eval`). If `false`, it will consume every token ahead of it
   * (think `iterate`), as well as an optional property, subscript, and
   * superscript.
   */
  fnlike?: boolean
  /**
   * If `true`, variables immediately following the function name will become
   * deitalicized and will merge into a single word.
   */
  takesWord?: boolean
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

export interface WordInfo {
  value: string
  sub?: Node
}

/** For things like `unit` and `element`. */
export interface TxrWordPrefix {
  js(contents: WordInfo, props: PropsJs): JsValue
  glsl(contents: WordInfo, props: PropsGlsl): GlslValue
  sym(contents: WordInfo, props: PropsSym): Sym
  layer?: number
}

type TxrSuffixLhs<T> =
  | { type: "value"; value: T }
  | { type: "node"; value: Node }

interface TxrSuffixArgs<T, U> {
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
  sym(node: TxrSuffixArgs<T, Sym>, props: PropsSym): Sym
  deps(node: T, deps: Deps): void
  layer?: number
}

export interface TxrOpUnary extends TxrAst<Node> {}

export interface TxrOpBinary extends TxrAst<{ lhs: Node; rhs: Node }> {}

export interface TxrGroup extends Omit<TxrAst<Node>, "deps"> {}

function group(node: { lhs: ParenLhs; rhs: ParenRhs }) {
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
    sym(node, props) {
      const s = group(node).sym

      // SYM: require group sym txrs
      if (!s) {
        throw new Error(
          `Group ${node.lhs}...${node.rhs} cannot be turned into a symbolic computation yet.`,
        )
      }

      return s(node.value, props)
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
    sym(node, props) {
      if (node.value in TXR_MAGICVAR) {
        const s = TXR_MAGICVAR[node.value]!.sym

        // SYM: require magic var txrs
        if (!s) {
          throw new Error(
            `Magic variable '${node.value}' cannot be turned into a symbolic computation yet.`,
          )
        }

        return s(node as never, props)
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
          return op.js(props.ctxJs, [js(node.a, props), js(node.b, props)])
        }
      } else {
        const txr = TXR_OP_UNARY[node.kind]
        if (txr) {
          return txr.js(node.a, props)
        }
        const op = OP_UNARY[node.kind]
        if (op) {
          return op.js(props.ctxJs, [js(node.a, props)])
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
    sym(node, props) {
      if (node.b) {
        const txr = TXR_OP_BINARY[node.kind]
        if (txr) {
          // SYM: require txrs
          if (!txr.sym) {
            throw new Error(
              `Binary operator '${node.kind}' cannot be turned into a symbolic computation yet.`,
            )
          }

          return txr.sym({ lhs: node.a, rhs: node.b }, props)
        }
        const op = OP_BINARY[node.kind]
        if (op) {
          return {
            type: "call",
            fn: op,
            args: [sym(node.a, props), sym(node.b, props)],
          }
        }
      } else {
        const txr = TXR_OP_UNARY[node.kind]
        if (txr) {
          // SYM: require txrs
          if (!txr.sym) {
            throw new Error(
              `Binary operator '${node.kind}' cannot be turned into a symbolic computation yet.`,
            )
          }

          return txr.sym(node.a, props)
        }
        const op = OP_UNARY[node.kind]
        if (op) {
          return {
            type: "call",
            fn: op,
            args: [sym(node.a, props)],
          }
        }
      }
      throw new Error(`The operator '${node.kind}' is not defined.`)
    },
  },

  // Immediately throws whatever error was in the source node
  error: joint(
    ({ reason }) => {
      throw new Error(reason)
    },
    () => {},
  ),

  // A special builtin used for previewing picked objects and `.x`-style accessors
  value: {
    deps() {},
    drag: NO_DRAG,
    js(node) {
      return node.value
    },
    glsl() {
      throw new Error("Cannot evaluate a 'value' node in a shader.")
    },
    sym(node) {
      return { type: "js", value: node.value }
    },
    layer: -1,
  },

  // A special builtin used for `.x`-style accessors
  valueGlsl: {
    deps() {},
    drag: NO_DRAG,
    js() {
      throw new Error("Cannot evaluate a 'valueGlsl' node outside of shaders.")
    },
    glsl(node) {
      return node.value
    },
    sym() {
      throw new Error(
        "Cannot convert a 'valueGlsl' node to a symbolic expression.",
      )
    },
    layer: -1,
  },

  // A special builtin used for `.x`-style accessors
  sym: {
    deps() {},
    drag: NO_DRAG,
    js() {
      throw new Error(
        "Cannot evaluate a 'sym' node outside of symbolic expressions.",
      )
    },
    glsl() {
      throw new Error(
        "Cannot evaluate a 'sym' node outside of symbolic expressions.",
      )
    },
    sym(node) {
      return node.value
    },
    layer: -1,
  },

  // Delegates to `TXR_SUFFIX` so that different packages can specify suffixes
  suffixed: {
    drag: {
      point({ base, suffixes }, props) {
        // TODO: method chains which lead to gliders (e.g. l1.translate(...).glider(.4)) don't work

        if (
          !(
            (suffixes.length == 1 &&
              suffixes[0]!.type == "call" &&
              base.type == "var" &&
              base.kind == "prefix" &&
              base.value == "glider" &&
              !base.sub &&
              !base.sup) ||
            (suffixes[0]!.type == "method" &&
              suffixes[0]!.name.type == "var" &&
              suffixes[0]!.name.kind == "prefix" &&
              suffixes[0]!.name.value == "glider")
          )
        ) {
          return null
        }

        const args = commalist(suffixes[0]!.args)
        if (suffixes[0]!.type == "method") {
          args.unshift(base)
        }
        if (args.length != 2) return null

        const pos = dragNum(args[1]!, props)
        if (!pos) return null

        try {
          var shape = js(args[0]!, props.js)
          if (!TY_INFO[shape.type].glide) return null
          if (shape.list !== false) return null
        } catch {
          return null
        }

        return {
          type: "glider",
          shape,
          value: pos,
        }
      },
      num() {
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
    sym(node, props) {
      const rest = node.suffixes.slice()
      let lhs: TxrSuffixLhs<Sym> = { type: "node", value: node.base }
      let suffix

      while ((suffix = rest[0])) {
        rest.shift()
        const txr = TXR_SUFFIX[suffix.type] as TxrSuffix<unknown>
        if (!txr) {
          throw new Error(`Suffix '${suffix.type}' is not defined.`)
        }

        lhs = {
          type: "value",
          value: txr.sym(
            {
              lhs,
              get base() {
                return lhs.type == "node" ? sym(lhs.value, props) : lhs.value
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
          return sym(lhs.value, props)
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
}

Object.setPrototypeOf(TXR_AST, null)

export function sym(node: Node, props: PropsSym): Sym {
  const txr = TXR_AST[node.type]
  if (!txr) {
    throw new Error(`Transformer '${node.type}' is not defined.`)
  }

  // SYM: require txrs
  if (!txr.sym) {
    throw new Error(
      `Node type '${node.type}' cannot be turned into a symbolic computation yet.`,
    )
  }

  return txr.sym(node as never, props)
}

export function NO_SYM(..._: any): never {
  throw new Error(
    "You are using a construct which is not yet supported in symbolic computation.",
  )
}

export function glsl(node: Node, props: PropsGlsl): GlslValue {
  const txr = TXR_AST[node.type]
  if (!txr) {
    throw new Error(`The '${node.type}' transformer is not defined.`)
  }
  return txr.glsl(node as never, props)
}

export function js(node: Node, props: PropsJs): JsValue {
  const txr = TXR_AST[node.type]
  if (!txr) {
    throw new Error(`The '${node.type}' transformer is not defined.`)
  }
  return txr.js(node as never, props)
}
