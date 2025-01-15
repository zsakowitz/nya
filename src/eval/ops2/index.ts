import type { OpBinary, PuncUnary } from "../ast/token"
import type { FnDist } from "../fn/dist"

import { FN_CMP } from "./fn/cmp"
import { FN_COS } from "./fn/cos"
import { FN_DEBUGQUADRANT } from "./fn/debugquadrant"
import { FN_DOT } from "./fn/dot"
import { FN_HSV } from "./fn/hsv"
import { FN_IMAG } from "./fn/imag"
import { FN_INTOCOLOR } from "./fn/intocolor"
import { FN_REAL } from "./fn/real"
import { FN_RGB } from "./fn/rgb"
import { FN_SIN } from "./fn/sin"
import { FN_TAN } from "./fn/tan"
import { FN_UNSIGN } from "./fn/unsign"
import { OP_ADD } from "./op/add"
import { OP_AND } from "./op/and"
import { OP_DIV } from "./op/div"
import { OP_MOD } from "./op/mod"
import { OP_CDOT } from "./op/mul"
import { OP_NEG } from "./op/neg"
import { OP_ODOT } from "./op/odot"
import { OP_OR } from "./op/or"
import { OP_POS } from "./op/pos"
import { OP_SUB } from "./op/sub"

export const FNS: Record<string, FnDist> = {
  rgb: FN_RGB,
  cmp: FN_CMP,
  imag: FN_IMAG,
  real: FN_REAL,
  intocolor: FN_INTOCOLOR,
  dot: FN_DOT,
  sin: FN_SIN,
  unsign: FN_UNSIGN,
  hsv: FN_HSV,
  cos: FN_COS,
  tan: FN_TAN,
  debugquadrant: FN_DEBUGQUADRANT,
}
Object.setPrototypeOf(FNS, null)

export const OP_UNARY: Partial<Record<PuncUnary, FnDist>> = {
  "-": OP_NEG,
  "+": OP_POS,
}
Object.setPrototypeOf(OP_UNARY, null)

export const OP_BINARY: Partial<Record<OpBinary, FnDist>> = {
  "+": OP_ADD,
  "-": OP_SUB,
  "\\cdot ": OP_CDOT,
  "\\and ": OP_AND,
  "\\or ": OP_OR,
  "÷": OP_DIV,
  "\\odot ": OP_ODOT,
  juxtaposition: OP_CDOT,
  mod: OP_MOD,
}
Object.setPrototypeOf(OP_BINARY, null)
