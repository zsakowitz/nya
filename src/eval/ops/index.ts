import type { PuncBinaryStr, PuncUnary } from "../ast/token"
import type { GlslContext } from "../lib/fn"
import type { GlslValue, JsValue } from "../ty"

export interface Fn {
  js(...args: JsValue[]): JsValue
  glsl(ctx: GlslContext, ...args: GlslValue[]): GlslValue
}

export const FNS: Record<string, Fn> = Object.create(null)

export const OP_UNARY: Partial<Record<PuncUnary, Fn>> = Object.create(null)

export const OP_BINARY: Partial<Record<PuncBinaryStr, Fn>> = Object.create(null)
