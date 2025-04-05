import type { PuncBinaryStr, PuncUnary } from "../ast/token"
import type { GlslContext } from "../lib/fn"
import type { JsContext } from "../lib/jsctx"
import type { PropsDeriv, Sym, SymDisplay } from "../sym"
import type { GlslValue, JsValue } from "../ty"

export interface Fn {
  js(ctx: JsContext, args: JsValue[]): JsValue
  glsl(ctx: GlslContext, args: GlslValue[]): GlslValue
  // SYM: proper displays for more things
  display?(args: Sym[]): SymDisplay
  // SYM: make this required
  deriv?(args: Sym[], wrt: PropsDeriv): Sym
  // SYM: implement this in more places
  simplify?(args: Sym[]): Sym | undefined
}

export const FNS: Record<string, Fn> = Object.create(null)

export const OP_UNARY: Partial<Record<PuncUnary, Fn>> = Object.create(null)

export const OP_BINARY: Partial<Record<PuncBinaryStr, Fn>> = Object.create(null)
