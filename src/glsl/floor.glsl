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
  vec2 b = ceil(z);
  float x = fract(z.x);
  float y = fract(z.y);

  if (1.0 > x + y) {
    if (x < y) {
      return b - vec2(1, 0);
    } else {
      return b - vec2(0, 1);
    }
  } else {
    return b;
  }
}

