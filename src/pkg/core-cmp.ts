import type { Package } from "."
import { Precedence } from "../eval/ast/token"
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

export const PKG_CORE_OPS: Package = {
  id: "nya:core-ops",
  name: "basic operators",
  label: null,
  eval: {
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
