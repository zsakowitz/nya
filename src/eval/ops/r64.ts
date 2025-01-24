import type { GlslContext } from "../lib/fn"

export function declareR64(ctx: GlslContext) {
  ctx.glsl`
float r64_mul(float a, float b) { return mix(0.0, a * b, b != 0.0 ? 1.0 : 0.0); }
float r64_add(float a, float b) { return mix(a, a + b, b != 0.0 ? 1.0 : 0.0); }
float r64_sub(float a, float b) { return mix(a, a - b, b != 0.0 ? 1.0 : 0.0); }
`
}
