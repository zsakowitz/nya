import type { GlslContext } from "../../lib/fn"
import { safe } from "../../lib/util"
import type { JsVal, SReal } from "../../ty"
import { approx, frac, num, pt } from "../../ty/create"
import { FnDist } from "../dist"
import { declareR64 } from "../r64"

export function sub(a: SReal, b: SReal) {
  a: if (a.type == "exact" && b.type == "exact") {
    const s1 = a.n * b.d
    if (!safe(s1)) break a
    const s2 = b.n * a.d
    if (!safe(s2)) break a
    const s3 = a.d * b.d
    if (!safe(s3)) break a
    const s4 = s1 - s2
    if (!safe(s4)) break a
    return frac(s4, s3)
  }

  return approx(num(a) - num(b))
}

export function declareSubR64(ctx: GlslContext) {
  declareR64(ctx)
  ctx.glsl`
vec2 _helper_sub_r64(vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float e, t1, t2;

  t1 = r64_sub(dsa.x, dsb.x);
  e = r64_sub(t1, dsa.x);
  t2 = r64_sub(
    r64_add(
      r64_add(r64_sub(r64_sub(0.0, dsb.x), e), r64_sub(dsa.x, r64_sub(t1, e))),
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

function r64(ctx: GlslContext, a: string, b: string) {
  declareSubR64(ctx)
  return `_helper_sub_r64(${a}, ${b})`
}

function complex(a: JsVal<"c32" | "c64">, b: JsVal<"c32" | "c64">) {
  return pt(sub(a.value.x, b.value.x), sub(a.value.y, b.value.y))
}

export const OP_SUB = new FnDist("-", "subtracts two values")
  .add(
    ["r64", "r64"],
    "r64",
    (a, b) => sub(a.value, b.value),
    (ctx, a, b) => r64(ctx, a.expr, b.expr),
  )
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => sub(a.value, b.value),
    (_, a, b) => `(${a.expr} - ${b.expr})`,
  )
  .add(["c64", "c64"], "c64", complex, (ctx, ar, br) => {
    const a = ctx.cache(ar)
    const b = ctx.cache(br)
    return `vec4(${r64(ctx, `${a}.xy`, `${b}.xy`)}, ${r64(ctx, `${a}.zw`, `${b}.zw`)})`
  })
  .add(["c32", "c32"], "c32", complex, (_, a, b) => `(${a.expr} - ${b.expr})`)
  .add(
    ["q32", "q32"],
    "q32",
    (a, b) => [
      sub(a.value[0], b.value[0]),
      sub(a.value[1], b.value[1]),
      sub(a.value[2], b.value[2]),
      sub(a.value[3], b.value[3]),
    ],
    (_, a, b) => `(${a.expr} - ${b.expr})`,
  )
