import { Span } from "../../field/model"
import type { FieldComputed } from "../../sheet/deps"
import type { Deps } from "../deps"
import { glsl, type PropsGlsl } from "../glsl"
import { js, type PropsJs } from "../js"
import { type Bindings } from "../lib/binding"
import { indexGlsl, indexJs } from "../ops/op"
import { OP_ABS } from "../ops/op/abs"
import { OP_POINT } from "../ops/op/point"
import { type GlslValue, type JsVal, type JsValue } from "../ty"
import { coerceValueGlsl, coerceValueJs, listGlsl, listJs } from "../ty/coerce"
import { commalist } from "./collect"
import type { MagicVar, Node, NodeName, Nodes, PuncBinaryStr } from "./token"

export interface AstTxr<T> {
  js(node: T, props: PropsJs): JsValue
  glsl(node: T, props: PropsGlsl): GlslValue
  deps(node: T, deps: Deps): void
  drag: DragTarget<T>
}

export interface PropsDrag {
  bindingsDrag: Bindings<[FieldComputed, Node]>
  field: FieldComputed
  js: PropsJs
}

export type DragResult = { span: Span; field: FieldComputed }

export type DragResultSigned = DragResult & { signed: boolean }

export type DragResultPoint =
  // for when the X and Y coordinates are separate
  | { type: "split"; x: DragResultSigned | null; y: DragResultSigned | null }
  // for when the X and Y coordinates are part of a joint complex number
  | { type: "complex"; span: Span; field: FieldComputed }
  | { type: "glider"; shape: JsVal; value: DragResult }

export interface DragTarget<T> {
  num(node: T, props: PropsDrag): DragResult | null
  point(node: T, props: PropsDrag): DragResultPoint | null
}

export function joint<T>(
  fn: (node: T) => never,
  deps: (node: T, deps: Deps) => void,
): AstTxr<T> {
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
  }
}

export function errorAll<T>(data: TemplateStringsArray): AstTxr<T> {
  return joint(
    () => {
      throw new Error(data[0])
    },
    () => {},
  )
}

export function error(
  data: TemplateStringsArray,
): <T>(f: (node: T, deps: Deps) => void) => AstTxr<T> {
  return (f) =>
    joint(() => {
      throw new Error(data[0])
    }, f)
}

export function dragNum(node: Node, props: PropsDrag) {
  const txr = AST_TXRS[node.type]
  if (!txr) {
    throw new Error(`The transformer '${node.type}' is not defined.`)
  }
  return txr.drag.num(node as never, props)
}

export function dragPoint(node: Node, props: PropsDrag) {
  const txr = AST_TXRS[node.type]
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

export interface MagicVarTxr {
  helpers?: readonly PuncBinaryStr[]
  js: AstTxr<MagicVar>["js"]
  glsl: AstTxr<MagicVar>["glsl"]
  deps: AstTxr<MagicVar>["deps"]
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

export const MAGIC_VARS: Record<string, MagicVarTxr> = Object.create(null)

export const AST_TXRS: { [K in NodeName]?: AstTxr<Nodes[K]> } = {
  group: {
    js(node, props) {
      if (node.lhs == "(" && node.rhs == ")") {
        if (node.value.type == "commalist") {
          return OP_POINT.js(...node.value.items.map((x) => js(x, props)))
        }
        return js(node.value, props)
      }
      if (node.lhs == "[" && node.rhs == "]") {
        if (node.value.type == "op" && node.value.kind == "for") {
          return js(node.value, props)
        }
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
        if (node.value.type == "op" && node.value.kind == "for") {
          return glsl(node.value, props)
        }
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
      point(node, props) {
        if (
          node.lhs == "(" &&
          node.rhs == ")" &&
          node.value.type == "commalist" &&
          node.value.items.length == 2
        ) {
          const x = dragNum(node.value.items[0]!, props)
          const y = dragNum(node.value.items[1]!, props)
          if (x || y) {
            return {
              type: "split",
              x: x && { ...x, signed: false },
              y: y && { ...y, signed: false },
            }
          }
        }
        return null
      },
    },
    deps(node, deps) {
      deps.add(node.value)
    },
  },
  error: joint(
    ({ reason }) => {
      throw new Error(reason)
    },
    () => {},
  ),
  magicvar: {
    js(node, props) {
      if (node.value in MAGIC_VARS) {
        return MAGIC_VARS[node.value]!.js(node as never, props)
      }
      throw new Error(`The '${node.value}' operator is not defined.`)
    },
    glsl(node, props) {
      if (node.value in MAGIC_VARS) {
        return MAGIC_VARS[node.value]!.glsl(node as never, props)
      }
      throw new Error(`The '${node.value}' operator is not defined.`)
    },
    drag: NO_DRAG,
    deps(node, deps) {
      if (node.value in MAGIC_VARS) {
        MAGIC_VARS[node.value]!.deps(node as never, deps)
      } else {
        throw new Error(`The '${node.value}' operator is not defined.`)
      }
    },
  },
  void: error`Empty expression.`(() => {}),
  index: {
    js(node, props) {
      return indexJs(js(node.on, props), js(node.index, props))
    },
    glsl(node, props) {
      return indexGlsl(glsl(node.on, props), js(node.index, props))
    },
    drag: NO_DRAG,
    deps(node, deps) {
      deps.add(node.on)
      deps.add(node.index)
    },
  },
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
  factorial: errorAll`Factorials are not supported yet.`,
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
  },
}
Object.setPrototypeOf(AST_TXRS, null)
