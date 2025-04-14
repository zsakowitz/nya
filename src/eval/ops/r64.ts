import type { GlslContext } from "../lib/fn"

export function declareR64(ctx: GlslContext) {
  ctx.glsl`
float r64_mul(float a, float b) { return mix(0.0, a * b, b != 0.0 ? 1.0 : 0.0); }
float r64_add(float a, float b) { return mix(a, a + b, b != 0.0 ? 1.0 : 0.0); }
float r64_sub(float a, float b) { return mix(a, a - b, b != 0.0 ? 1.0 : 0.0); }
`
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

export function declareMulR64(ctx: GlslContext) {
  declareR64(ctx)
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
