import type { Package } from "."
import { Precedence } from "../eval/ast/token"
import { NO_DRAG } from "../eval/ast/tx"
import { glsl } from "../eval/glsl"
import { js } from "../eval/js"
import { OP_BINARY } from "../eval/ops"
import { FnDist } from "../eval/ops/dist"

export const OP_LT = new FnDist("<", "compares two values via the < operator")
export const OP_GT = new FnDist(">", "compares two values via the > operator")

export const OP_LTE = new FnDist("≤", "compares two values via the ≤ operator")
export const OP_GTE = new FnDist("≥", "compares two values via the ≥ operator")

export const OP_NLT = new FnDist("≮", "compares two values via the ≮ operator")
export const OP_NGT = new FnDist("≯", "compares two values via the ≯ operator")

export const OP_NLTE = new FnDist("≰", "compares two values via the ≰ operator")
export const OP_NGTE = new FnDist("≱", "compares two values via the ≱ operator")

export const OP_EQ = new FnDist("=", "compares two values via the = operator")
export const OP_NEQ = new FnDist("≠", "compares two values via the ≠ operator")

export const OP_AND = new FnDist("and", "returns true if both inputs are true")

export const PKG_CORE_CMP: Package = {
  id: "nya:core-cmp",
  name: "basic comparison operators",
  label: null,
  eval: {
    txrs: {
      cmplist: {
        js(node, props) {
          return node.ops
            .map((op, i) => {
              const a = js(node.items[i]!, props)
              const b = js(node.items[i + 1]!, props)
              return OP_BINARY[op]!.js(a, b)
            })
            .reduce((a, b) => OP_AND.js(a, b))
        },
        glsl(node, props) {
          return node.ops
            .map((op, i) => {
              const a = glsl(node.items[i]!, props)
              const b = glsl(node.items[i + 1]!, props)
              return OP_BINARY[op]!.glsl(props.ctx, a, b)
            })
            .reduce((a, b) => OP_AND.glsl(props.ctx, a, b))
        },
        drag: NO_DRAG,
        deps(node, deps) {
          for (const item of node.items) {
            deps.add(item)
          }
        },
      },
    },
    op: {
      binary: {
        "cmp-lt": { fn: OP_LT, precedence: Precedence.Comparison },
        "cmp-gt": { fn: OP_GT, precedence: Precedence.Comparison },
        "cmp-lte": { fn: OP_LTE, precedence: Precedence.Comparison },
        "cmp-gte": { fn: OP_GTE, precedence: Precedence.Comparison },
        "cmp-nlt": { fn: OP_NLT, precedence: Precedence.Comparison },
        "cmp-ngt": { fn: OP_NGT, precedence: Precedence.Comparison },
        "cmp-nlte": { fn: OP_NLTE, precedence: Precedence.Comparison },
        "cmp-ngte": { fn: OP_NGTE, precedence: Precedence.Comparison },
        "cmp-eq": { fn: OP_EQ, precedence: Precedence.Comparison },
        "cmp-neq": { fn: OP_NEQ, precedence: Precedence.Comparison },
      },
    },
  },
}
