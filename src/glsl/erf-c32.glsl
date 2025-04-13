/*! From https://ssteinberg.xyz/2019/07/29/fast-complex-error-function/. */

vec2 csqr(vec2 a) {
  return vec2(a.x * a.x - a.y * a.y, 2.0 * a.x * a.y);
}

vec2 cdiv(vec2 a, vec2 b) {
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) *
  (1.0 / (b.x * b.x + b.y * b.y));
}

vec2 cexpi(float d) {
  return vec2(cos(d), sin(d));
}

vec2 cexp(vec2 z) {
  return exp(z.x) * cexpi(z.y);
}

vec2 _nya_faddeeva(vec2 z) {
  const int M = 4;
  const int N = 1 << M - 1;

  // Precomputed Faddeeva function approximation coefficients (M==4)
  const vec2 A[N] = vec2[N](
    vec2(+0.983046454995208, 0.0),
    vec2(-0.095450491368505, 0.0),
    vec2(-0.106397537035019, 0.0),
    vec2(+0.004553979597404, 0.0),
    vec2(-0.000012773721299, 0.0),
    vec2(-0.000000071458742, 0.0),
    vec2(+0.000000000080803, 0.0),
    vec2(-0.000000000000007, 0.0)
  );

  const vec2 B[N] = vec2[N](
    vec2(0.0, -1.338045597353875),
    vec2(0.0, +0.822618936152688),
    vec2(0.0, -0.044470795125534),
    vec2(0.0, -0.000502542048995),
    vec2(0.0, +0.000011914499129),
    vec2(0.0, -0.000000020157171),
    vec2(0.0, -0.000000000001558),
    vec2(0.0, +0.000000000000003)
  );

  const vec2 C[N] = vec2[N](
    vec2(0.392699081698724, 0.0),
    vec2(1.178097245096172, 0.0),
    vec2(1.963495408493621, 0.0),
    vec2(2.748893571891069, 0.0),
    vec2(3.534291735288517, 0.0),
    vec2(4.319689898685965, 0.0),
    vec2(5.105088062083414, 0.0),
    vec2(5.890486225480862, 0.0)
  );

  const float s = 2.75;

  // Constrain to imag(z)>=0
  float sgni = z.y < 0.0 ? -1.0 : 1.0;
  z *= sgni;

  // Approximate
  vec2 t = z + vec2(0, 0.5) * s;
  vec2 w = vec2(0.0);
  for (int m = 0; m < N; ++m) {
    w += cdiv(A[m] + _helper_mul_c32(t, B[m]), csqr(C[m]) - csqr(t));
  }

  // Invert back
  if (sgni < 0.0) {
    w = 2.0 * cexp(-csqr(z)) - w;
  }

  return w;
}

vec2 erf_pos(vec2 z) {
  vec2 z_1i = _helper_mul_c32(vec2(0, 1), z); // 1i*z
  return vec2(1, 0) - _helper_mul_c32(cexp(-csqr(z)), _nya_faddeeva(z_1i));
}

vec2 _nya_helper_erf(vec2 z) {
  if (z.x < 0.0) {
    return -erf_pos(-z);
  } else {
    return erf_pos(z);
  }
}
