const vec2 PI = vec2(3.141592653589793, 0);
const float PI_HALF = 1.5707963267948966;

vec2 divide(vec2 a, vec2 b) {
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) /
  (b.x * b.x + b.y * b.y);
}

vec2 divide(float a, vec2 b) {
  return a / b;
}

vec2 multiply(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
}

vec2 multiply(float a, vec2 b) {
  return a * b;
}

vec2 powcx(float a, vec2 b) {
  return powcx(vec2(a, 0), b);
}

vec2 sincx(vec2 z) {
  return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

float d(float k, float n) {
  float S = k;
  for (float j = k; j <= n; j++) {
    float num = factorial(n + j - 1.0) * pow(4.0, j);
    float denom = factorial(n - j) * factorial(2.0 * j);
    S += num / denom;
  }
  return n * S;
}

vec2 zeta_pos(vec2 s, float n) {
  vec2 c = divide(
    vec2(1, 0),
    multiply(d(0.0, n), vec2(1, 0) - powcx(vec2(2, 0), vec2(1, 0) - s))
  );
  vec2 S = vec2(0);
  for (float k = 1.0; k < 20.0; k++) {
    if (k > n) break;
    float sign_ = mod(k - 1.0, 2.0) == 1.0 ? -1.0 : 1.0;
    S += divide(sign_ * d(k, n), powcx(k, s));
  }
  return multiply(c, S);
}

/*! https://www.shadertoy.com/view/Ms2fWR */
vec2 helper_zeta_c32(vec2 z) {
  if (z == vec2(0)) {
    return vec2(-0.5, 0);
  }
  if (z.x == 1.0) {
    return vec2(0.0 / 0.0);
  }
  if (z == vec2(1.0 / 0.0, 0)) {
    return vec2(1, 0);
  }
  if (z.x == -1.0 / 0.0 || z.y == 1.0 / 0.0) {
    return vec2(0.0 / 0.0);
  }
  float digits = round(1.3 * 15.0 + 0.9 * abs(z.y));
  if (z.x > -(digits - 1.0) / 2.0) {
    return zeta_pos(z, digits);
  } else {
    vec2 next = vec2(1, 0) - z;
    vec2 c = multiply(powcx(vec2(2, 0), z), powcx(PI, -next));
    c = multiply(c, sincx(PI_HALF * z));
    c = multiply(c, nya_gamma(next));
    float digits = round(1.3 * 15.0 + 0.9 * abs(z.y));
    return multiply(c, zeta_pos(next, digits));
  }
}

