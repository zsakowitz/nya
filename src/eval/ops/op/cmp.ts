import type { PuncCmp } from "../../ast/token"
import { FnDist } from "../dist"

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

export function pickCmp(op: PuncCmp) {
  switch (op) {
    case "cmp-eq":
      return OP_EQ
    case "cmp-neq":
      return OP_NEQ
    case "cmp-lt":
      return OP_LT
    case "cmp-lte":
      return OP_LTE
    case "cmp-gt":
      return OP_GT
    case "cmp-gte":
      return OP_GTE
    case "cmp-nlt":
      return OP_NLT
    case "cmp-nlte":
      return OP_NLTE
    case "cmp-ngt":
      return OP_NGT
    case "cmp-ngte":
      return OP_NGTE
    case "cmp-tilde":
    case "cmp-approx":
    case "cmp-ntilde":
    case "cmp-napprox":
  }

  throw new Error(`The comparison operator '${op}' is not supported yet.`)
}
