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
