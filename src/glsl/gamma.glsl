/*! https://en.wikipedia.org/wiki/Lanczos_approximation */

const float _nya_cxfact_g = 5.0;
const float _nya_cxfact_epsilon = 1e-7;

vec2 _nya_cxfact_drop_imag(vec2 z) {
  if (abs(z.y) <= _nya_cxfact_epsilon) {
    z.y = 0.0;
  }
  return z;
}

vec2 _nya_helper_cx_factorial_pos(vec2 z) {
  vec2 x = vec2(1.0000018972739440364, 0.0);
  x += _helper_div(vec2(76.180082222642137322, 0), z + vec2(1, 0));
  x += _helper_div(vec2(-86.505092037054859197, 0), z + vec2(2, 0));
  x += _helper_div(vec2(24.012898581922685900, 0), z + vec2(3, 0));
  x += _helper_div(vec2(-1.2296028490285820771, 0), z + vec2(4, 0));

  vec2 t = z + vec2(_nya_cxfact_g, 0) + vec2(0.5, 0);
  vec2 y = 2.5066282746310007 * _helper_pow_c32(t, z + vec2(0.5, 0));
  // 2.5066282746310007 = sqrt(2π)
  y = _helper_mul_c32(y, _helper_exp(-t));
  y = _helper_mul_c32(y, x);
  return (y);
}

vec2 _nya_helper_factorial(vec2 z) {
  if (z.x < 1.5) {
    // G(z) = (z-1)!
    // G(z)G(1-z) = π/sin(πz)
    // (z-1)! (1-z-1)! = π/sin(πz)
    // u = z-1
    // u! (-u-1)! = π/sin(πz)
    // u! = π/sin(πz)/(-u-1)!
    // u! = π/(sin(πz)*(-u-1)!)
    vec2 res = -_nya_helper_cx_factorial_pos(-z-vec2(1,0));
    vec2 sinArg = 3.141592653589793 * z;
    vec2 sinVal = vec2(sin(sinArg.x) * cosh(sinArg.y), cos(sinArg.x) * sinh(sinArg.y));
    return _helper_div(
      vec2(3.141592653589793, 0),
      _helper_mul_c32(sinVal, res)
    );
  } else {
    return _nya_helper_cx_factorial_pos(z);
  }
}

vec2 nya_gamma(vec2 z) {
  return _nya_helper_factorial(z - vec2(1, 0));
}
