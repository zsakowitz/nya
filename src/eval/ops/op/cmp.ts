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
export const OP_NE = new FnDist("≠", "compares two values via the ≠ operator")

export function pickCmp(op: PuncCmp) {
  switch (op.dir) {
    case "<":
      return (
        op.neg ?
          op.eq ?
            OP_NLTE
          : OP_NLT
        : op.eq ? OP_LTE
        : OP_LT
      )
    case ">":
      return (
        op.neg ?
          op.eq ?
            OP_NGTE
          : OP_NGT
        : op.eq ? OP_GTE
        : OP_GT
      )
    case "=":
      return op.neg ? OP_NE : OP_EQ
  }
  throw new Error("That comparison operator is not supported yet.")
}
