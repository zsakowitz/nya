import type { GlslContext } from "../../lib/fn"
import { safe } from "../../lib/util"
import type { SReal } from "../../ty"
import { approx, frac, num, pt } from "../../ty/create"
import { FnDist } from "../dist"
import { declareR64 } from "../r64"

export function add(a: SReal, b: SReal) {
  a: if (a.type == "exact" && b.type == "exact") {
    const s1 = a.n * b.d
    if (!safe(s1)) break a
    const s2 = b.n * a.d
    if (!safe(s2)) break a
    const s3 = a.d * b.d
    if (!safe(s3)) break a
    const s4 = s1 + s2
    if (!safe(s4)) break a
    return frac(s4, s3)
  }

  return approx(num(a) + num(b))
}

export function declareAddR64(ctx: GlslContext) {
  declareR64(ctx)
  ctx.glsl`
vec2 _helper_add_r64(vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float t1, t2, e;

  t1 = r64_add(dsa.x, dsb.x);
  e = r64_sub(t1, dsa.x);
  t2 = r64_add(
    r64_add(
      r64_add(r64_sub(dsb.x, e), r64_sub(dsa.x, r64_sub(t1, e))),
      dsa.y
    ),
    dsb.y
  );
  dsc.x = r64_add(t1, t2);
  dsc.y = r64_sub(t2, r64_sub(dsc.x, t1));
  return dsc;
}
`
}

export function addR64(ctx: GlslContext, a: string, b: string) {
  declareAddR64(ctx)
  return `_helper_add_r64(${a}, ${b})`
}

export const OP_ADD = new FnDist("+", "adds two values or points")
  .add(
    ["r64", "r64"],
    "r64",
    (a, b) => add(a.value, b.value),
    (ctx, a, b) => addR64(ctx, a.expr, b.expr),
  )
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => add(a.value, b.value),
    (_, a, b) => `(${a.expr} + ${b.expr})`,
  )
  .add(
    ["point64", "point64"],
    "point64",
    (a, b) => pt(add(a.value.x, b.value.x), add(a.value.y, b.value.y)),
    (ctx, ar, br) => {
      const a = ctx.cache(ar)
      const b = ctx.cache(br)
      return `vec4(${addR64(ctx, `${a}.xy`, `${b}.xy`)}, ${addR64(ctx, `${a}.zw`, `${b}.zw`)})`
    },
  )
  .add(
    ["point32", "point32"],
    "point32",
    (a, b) => pt(add(a.value.x, b.value.x), add(a.value.y, b.value.y)),
    (_, a, b) => `(${a.expr} + ${b.expr})`,
  )
