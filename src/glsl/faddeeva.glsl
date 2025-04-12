/*! Adapted from libcerf. */

// w(z) = e^(-z^2) erfc(-iz)
// w(z) = e^(-z^2) (1 - erf(-iz))

#ifndef nyaerf
float nyaerf(float x);
#endif

float chebInterpolant(float x) {
  // FIXME:
  return 0.0;
}

float im_w_of_x(float x) {
  float ax = abs(x);

  if (ax < 0.51) {
    // Use Taylor expansion (2/sqrt(pi)) * (x - 2/3 x^3  + 4/15 x^5  - 8/105 x^7 ...)

    float x2 = x * x;

    if (ax < 0.083) {
      if (ax < 0.003) {
        return (((-0.085971746064420005629 * x2 + // x^7
          0.3009011112254700197) *
          x2 - // x^5
          0.75225277806367504925) *
          x2 + // x^3
          1.1283791670955125739) *
        x;
      }

      return ((((((+0.00053440090793734269229 * x2 - // x^13
        0.0034736059015927275001) *
        x2 + // x^11
        0.019104832458760001251) *
        x2 - // x^9
        0.085971746064420005629) *
        x2 + // x^7
        0.3009011112254700197) *
        x2 - // x^5
        0.75225277806367504925) *
        x2 + // x^3
        1.1283791670955125739) *
      x;
    }

    if (ax < 0.272) {
      return (((((((((-8.82395720020380130481012927e-7 * x2 + // x^19
        8.38275934019361123956e-6) *
        x2 - // x^17
        7.1253454391645686483238e-5) *
        x2 + // x^15
        0.00053440090793734269229) *
        x2 - // x^13
        0.0034736059015927275001) *
        x2 + // x^11
        0.019104832458760001251) *
        x2 - // x^9
        0.085971746064420005629) *
        x2 + // x^7
        0.3009011112254700197) *
        x2 - // x^5
        0.75225277806367504925) *
        x2 + // x^3
        1.1283791670955125739) *
      x;
    }

    return ((((((((((((+5.8461000084165966602290712e-10 * x2 - // x^25
      7.30762501052074563638866034e-9) *
      x2 + // x^23
      8.40376876209885782941868884e-8) *
      x2 - // x^21
      8.82395720020380130481012927e-7) *
      x2 + // x^19
      8.38275934019361123956e-6) *
      x2 - // x^17
      7.1253454391645686483238e-5) *
      x2 + // x^15
      0.00053440090793734269229) *
      x2 - // x^13
      0.0034736059015927275001) *
      x2 + // x^11
      0.019104832458760001251) *
      x2 - // x^9
      0.085971746064420005629) *
      x2 + // x^7
      0.3009011112254700197) *
      x2 - // x^5
      0.75225277806367504925) *
      x2 + // x^3
      1.1283791670955125739) *
    x;
  }

  if (ax < 12.0) {
    return abs(chebInterpolant(ax)) * sign(x);
  }

  float r = 1.0 / x;

  if (ax < 150.0) {
    if (ax < 23.2) {
      return ((((((((((+3.6073371500083758e5 * (r * r) + 3.7971970000088164e4) *
        (r * r) +
        4.4672905882456671e3) *
        (r * r) +
        5.9563874509942218e2) *
        (r * r) +
        9.1636730015295726e1) *
        (r * r) +
        1.6661223639144676e1) *
        (r * r) +
        3.7024941420321507) *
        (r * r) +
        1.057855469152043) *
        (r * r) +
        4.2314218766081724e-01) *
        (r * r) +
        2.8209479177387814e-01) *
        (r * r) +
        5.6418958354775628e-01) *
      r;
    }

    return ((((((+9.1636730015295726e1 * (r * r) + 1.6661223639144676e1) *
      (r * r) +
      3.7024941420321507) *
      (r * r) +
      1.057855469152043) *
      (r * r) +
      4.2314218766081724e-01) *
      (r * r) +
      2.8209479177387814e-01) *
      (r * r) +
      5.6418958354775628e-01) *
    r;
  }

  if (ax < 6.9e7) {
    return (((+1.057855469152043 * (r * r) + 4.2314218766081724e-01) * (r * r) +
      2.8209479177387814e-01) *
      (r * r) +
      5.6418958354775628e-01) *
    r;
  }

  // 1-term expansion, important to avoid overflow
  return 0.56418958354775629 / x;
}

vec2 w_of_z(vec2 z) {
  float x = z.x;
  float xa = abs(x);
  float y = z.y;
  float ya = abs(y);
  float z2 = xa * xa + y * y;
  const float ispi = 0.5641895835477562869; // 1 / sqrt(pi)

  if (ya < 1e-9 * xa) {
    float wi = im_w_of_x(x);
    float e2 = xa > 27.0 ? 0.0 : exp(-xa * xa);
    if (ya == 0.0) {
      return vec2(e2, wi);
    } else {
      return vec2(e2 + y * 2.0 * (x * wi - ispi), wi - 2.0 * x * y * e2);
    }
  }

  return vec2(1, 0);
}
