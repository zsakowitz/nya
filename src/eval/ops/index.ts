import type { PuncBinaryStr, PuncUnary } from "../ast/token"
import type { GlslContext } from "../lib/fn"
import type { GlslValue, JsValue } from "../ty"

import { FN_CMP } from "./fn/cmp"
import { FN_JOIN } from "./fn/join"
import { FN_LN } from "./fn/ln"
import { FN_UNSIGN } from "./fn/unsign"
import { FN_VALID } from "./fn/valid"

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

export const OP_UNARY: Partial<Record<PuncUnary, Fn>> = Object.create(null)

export const OP_BINARY: Partial<Record<PuncBinaryStr, Fn>> = Object.create(null)
