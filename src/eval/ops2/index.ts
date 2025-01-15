import type { OpBinary, PuncUnary } from "../ast/token"
import type { FnDist } from "../fn/dist"
import { FN_INTOCOLOR } from "./32/fn/intocolor"
import { FN_RGB } from "./32/fn/rgb"
import { FN_SIN } from "./32/fn/sin"
import { OP_DIV } from "./32/op/div"
import { FN_CMP } from "./64/fn/cmp"
import { FN_DOT } from "./64/fn/dot"
import { FN_IMAG } from "./64/fn/imag"
import { FN_REAL } from "./64/fn/real"
import { FN_UNSIGN } from "./64/fn/unsign"
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
  dot: FN_DOT,
  sin: FN_SIN,
  unsign: FN_UNSIGN,
}
Object.setPrototypeOf(FNS, null)

export const OP_UNARY: Partial<Record<PuncUnary, FnDist>> = {}
Object.setPrototypeOf(OP_UNARY, null)

export const OP_BINARY: Partial<Record<OpBinary, FnDist>> = {
  "+": OP_ADD,
  "-": OP_SUB,
  "\\cdot ": OP_CDOT,
  "÷": OP_DIV,
  "\\and ": OP_AND,
}
Object.setPrototypeOf(OP_BINARY, null)
