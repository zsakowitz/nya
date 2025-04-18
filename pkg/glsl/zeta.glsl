// https://www.shadertoy.com/view/llV3R1
vec2 ccos(vec2 z) {
  return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}
vec2 Dirichletn(vec2 s) {
  vec2 z = vec2(0);
  for (int j = 1; j <= 32; j++) {
    z += _helper_pow_c32(vec2(j, 0), -s) * (j % 2 == 0 ? -1.0 : 1.0);
  }
  return z;
}
vec2 zetaLargeS(vec2 s) {
  vec2 z = vec2(0);
  for (int j = 1; j <= 32; j++) {
    z += _helper_pow_c32(vec2(j, 0), -s);
  }
  return z;
}
vec2 zetaSmallS(vec2 s) {
  vec2 z = vec2(0);

  return _helper_div(Dirichletn(s), vec2(1, 0) - _helper_pow_c32(vec2(2, 0), vec2(1, 0) - s));
}
vec2 zetagtz(vec2 s) {
  return mix(zetaSmallS(s), zetaLargeS(s), smoothstep(1.5, 2.5, s.x));
  /*if(s.x>4.){
        return zetaLargeS(s);
    } else {
        return zetaSmallS(s);
    }*/
}
vec2 zeta(vec2 s) {
  vec2 a = zetagtz(s);
  vec2 sr = vec2(1, 0) - s;
  vec2 b = _helper_mul_c32(
    _helper_mul_c32(zetagtz(sr), nya_gamma(sr)),
    _helper_mul_c32(
      ccos(3.141592653589793 / 2.0 * sr),
      2.0 * _helper_pow_c32(vec2(2.0 * 3.141592653589793, 0), -sr)
    )
  );
  if (s.x > 0.75) {
    return a;
  }
  if (s.x < 0.25) {
    return b;
  }

  return mix(b, a, smoothstep(0.25, 0.75, s.x));
}
