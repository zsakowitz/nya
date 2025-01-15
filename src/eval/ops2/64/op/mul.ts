import { declareR64 } from ".."
import type { GlslContext } from "../../../fn"
import { FnDist } from "../../../fn/dist"
import type { SReal } from "../../../ty"
import { approx, frac, num, pt } from "../../../ty/create"
import type { JsVal } from "../../../ty2"
import { safe } from "../../../util"
import { add, declareAddR64 } from "./add"
import { declareSubR64, sub } from "./sub"

function mul(a: SReal, b: SReal) {
  a: if (a.type == "exact" && b.type == "exact") {
    const s1 = a.n * b.n
    if (!safe(s1)) break a
    const s2 = b.d * a.d
    if (!safe(s2)) break a
    return frac(s1, s2)
  }

  return approx(num(a) * num(b))
}

export function declareMulR64(ctx: GlslContext) {
  ctx.glsl`
vec2 _helper_mul_r64(vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float c11, c21, c2, e, t1, t2;
  float a1, a2, b1, b2, cona, conb, split = 8193.;

  cona = r64_mul(dsa.x, split);
  conb = r64_mul(dsb.x, split);
  a1 = r64_sub(cona, r64_sub(cona, dsa.x));
  b1 = r64_sub(conb, r64_sub(conb, dsb.x));
  a2 = r64_sub(dsa.x, a1);
  b2 = r64_sub(dsb.x, b1);

  c11 = r64_mul(dsa.x, dsb.x);
  c21 = r64_add(r64_mul(a2, b2), r64_add(r64_mul(a2, b1), r64_add(r64_mul(a1, b2), r64_sub(r64_mul(a1, b1), c11))));

  c2 = r64_add(r64_mul(dsa.x, dsb.y), r64_mul(dsa.y, dsb.x));

  t1 = r64_add(c11, c2);
  e = r64_sub(t1, c11);
  t2 = r64_add(r64_add(r64_mul(dsa.y, dsb.y), r64_add(r64_sub(c2, e), r64_sub(c11, r64_sub(t1, e)))), c21);

  dsc.x = r64_add(t1, t2);
  dsc.y = r64_sub(t2, r64_sub(dsc.x, t1));

  return dsc;
}
`
}

function r64(ctx: GlslContext, a: string, b: string) {
  declareR64(ctx)
  declareMulR64(ctx)
  return `_helper_mul_r64(${a}, ${b})`
}

function complex(
  { value: { x: a, y: b } }: JsVal<"c32" | "c64">,
  { value: { x: c, y: d } }: JsVal<"c32" | "c64">,
) {
  return pt(sub(mul(a, c), mul(b, d)), add(mul(b, c), mul(a, d)))
}

export const OP_CDOT = new FnDist("·")
  .add(
    ["r64", "r64"],
    "r64",
    (a, b) => mul(a.value, b.value),
    (ctx, a, b) => r64(ctx, a.expr, b.expr),
  )
  .add(["c64", "c64"], "c64", complex, (ctx, a, b) => {
    declareAddR64(ctx)
    declareSubR64(ctx)
    ctx.glsl`
vec4 _helper_mul_c64(vec4 a, vec4 b) {
  return vec4(
    _helper_sub_r64(_helper_mul_r64(a.xy, b.xy), _helper_mul_r64(a.zw, b.zw)),
    _helper_add_r64(_helper_mul_r64(a.zw, b.xy), _helper_mul_r64(a.xy, b.zw))
  );
}
`
    return `_helper_mul_c64(${a.expr}, ${b.expr})`
  })
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => mul(a.value, b.value),
    (_, a, b) => `(${a.expr} * ${b.expr})`,
  )
  .add(["c32", "c32"], "c32", complex, (ctx, a, b) => {
    ctx.glsl`
vec2 _helper_mul_c32(vec2 a, vec2 b) {
  return vec2(
    a.x * b.x - a.y * b.y,
    a.y * b.x + a.x * b.y
  );
}
`
    return `_helper_mul_c32(${a.expr}, ${b.expr})`
  })
