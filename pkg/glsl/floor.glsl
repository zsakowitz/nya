vec2 cx_floor(vec2 z) {
  vec2 b = floor(z);
  float x = fract(z.x);
  float y = fract(z.y);

  if (1.0 <= x + y) {
    if (x >= y) {
      return b + vec2(1, 0);
    } else {
      return b + vec2(0, 1);
    }
  } else {
    return b;
  }
}

vec2 cx_ceil(vec2 z) {
  z.x += 0.5;
  z.y += 0.5;

  vec2 b = floor(z);
  float x = fract(z.x);
  float y = fract(z.y);

  if (1.0 < x + y) {
    if (x >= y) {
      return b + vec2(1, 0);
    } else {
      return b + vec2(0, 1);
    }
  } else {
    return b;
  }
}

vec2 x() {
  vec4 nya_helper_9 = vec4(
    helper_oklab(
      vec3(
        (vec4(vec2(3.0000001192092896e-1, -1.1920928966180355e-8).x, 0, 0, 0) +
          helper_mul_q32(
            vec4(vec2(4.000000059604645e-1, -5.960464455334602e-9).x, 0, 0, 0),
            vec4(vec4(0, 0, 1, 0).xz, 0, 0, 0)
          )).x +
          vec2(4.000000059604645e-1, -5.960464455334602e-9).x,
        vec2(5e-1, 0e0).x * (v_coords.xy.x / vec2(5e0, 0e0).x) +
          vec2(2.5e-1, 0e0).x,
        vec2(5e-1, 0e0).x * (v_coords.zw.x / vec2(5e0, 0e0).x) +
          vec2(2.5e-1, 0e0).x
      )
    ),
    1.0
  );

}
