import type { PuncBinaryStr, PuncUnary } from "../ast/token"
import type { GlslContext } from "../lib/fn"
import type { GlslValue, JsValue } from "../ty"

import { FN_CMP } from "./fn/cmp"
import { FN_JOIN } from "./fn/join"
import { FN_LN } from "./fn/ln"
import { FN_UNSIGN } from "./fn/unsign"
import { FN_VALID } from "./fn/valid"

import { OP_ADD } from "./op/add"
import {
  OP_EQ,
  OP_GT,
  OP_GTE,
  OP_LT,
  OP_LTE,
  OP_NEQ,
  OP_NGT,
  OP_NGTE,
  OP_NLT,
  OP_NLTE,
} from "./op/cmp"
import { OP_CROSS } from "./op/cross"
import { OP_DIV } from "./op/div"
import { OP_MOD } from "./op/mod"
import { OP_CDOT } from "./op/mul"
import { OP_NEG } from "./op/neg"
import { OP_ODOT } from "./op/odot"
import { OP_POS } from "./op/pos"
import { OP_SUB } from "./op/sub"

export interface Fn {
  js(...args: JsValue[]): JsValue
  glsl(ctx: GlslContext, ...args: GlslValue[]): GlslValue
}

export const FNS: Record<string, Fn> = {
  cmp: FN_CMP,
  unsign: FN_UNSIGN,
  valid: FN_VALID,
  ln: FN_LN,
  join: FN_JOIN,
}
Object.setPrototypeOf(FNS, null)

export const OP_UNARY: Partial<Record<PuncUnary, Fn>> = {
  "-": OP_NEG,
  "+": OP_POS,
}
Object.setPrototypeOf(OP_UNARY, null)

export const OP_BINARY: Partial<Record<string, Fn>> = {
  "+": OP_ADD,
  "-": OP_SUB,
  "\\cdot ": OP_CDOT,
  "÷": OP_DIV,
  "\\odot ": OP_ODOT,
  mod: OP_MOD,
  "\\times ": OP_CROSS,
  "cmp-lt": OP_LT,
  "cmp-lte": OP_LTE,
  "cmp-nlt": OP_NLT,
  "cmp-nlte": OP_NLTE,
  "cmp-gt": OP_GT,
  "cmp-gte": OP_GTE,
  "cmp-ngt": OP_NGT,
  "cmp-ngte": OP_NGTE,
  "cmp-eq": OP_EQ,
  "cmp-neq": OP_NEQ,
} satisfies Partial<Record<PuncBinaryStr, Fn>>
Object.setPrototypeOf(OP_BINARY, null)
