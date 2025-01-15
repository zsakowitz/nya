import type { OpBinary, PuncUnary } from "../ast/token"
import type { FnDist } from "../fn/dist"
import { FN_INTOCOLOR } from "./32/fn/intocolor"
import { FN_RGB } from "./32/fn/rgb"
import { FN_CMP } from "./64/fn/cmp"
import { FN_IMAG } from "./64/fn/imag"
import { FN_REAL } from "./64/fn/real"
import { OP_ADD } from "./64/op/add"
import { OP_CDOT } from "./64/op/mul"
import { OP_SUB } from "./64/op/sub"
import { OP_AND } from "./bool/op/and"

export const FNS: Record<string, FnDist> = {
  rgb: FN_RGB,
  cmp: FN_CMP,
  imag: FN_IMAG,
  real: FN_REAL,
  intocolor: FN_INTOCOLOR,
}
Object.setPrototypeOf(FNS, null)

export const OP_UNARY: Partial<Record<PuncUnary, FnDist>> = {}
Object.setPrototypeOf(OP_UNARY, null)

export const OP_BINARY: Partial<Record<OpBinary, FnDist>> = {
  "+": OP_ADD,
  "-": OP_SUB,
  "\\cdot ": OP_CDOT,
  "\\and ": OP_AND,
}
Object.setPrototypeOf(OP_BINARY, null)
