/*! Adapted from @stdlib/math/base/special/gammaln/lib/main.js */

float PI = 3.141592653589793;

float polyvalA1(float x) {
  if (x == 0.0) {
    return 0.06735230105312927;
  }
  return 0.06735230105312927 +
  x *
    (0.007385550860814029 +
      x *
        (0.0011927076318336207 +
          x * (0.00022086279071390839 + x * 0.000025214456545125733)));
}

float polyvalA2(float x) {
  if (x == 0.0) {
    return 0.020580808432516733;
  }
  return 0.020580808432516733 +
  x *
    (0.0028905138367341563 +
      x *
        (0.0005100697921535113 +
          x * (0.00010801156724758394 + x * 0.000044864094961891516)));
}

float polyvalR(float x) {
  if (x == 0.0) {
    return 1.3920053346762105;
  }
  return 1.3920053346762105 +
  x *
    (0.7219355475671381 +
      x *
        (0.17193386563280308 +
          x *
            (0.01864591917156529 +
              x * (0.0007779424963818936 + x * 0.000007326684307446256))));
}

float polyvalS(float x) {
  if (x == 0.0) {
    return 0.21498241596060885;
  }
  return 0.21498241596060885 +
  x *
    (0.325778796408931 +
      x *
        (0.14635047265246445 +
          x *
            (0.02664227030336386 +
              x * (0.0018402845140733772 + x * 0.00003194753265841009))));
}

float polyvalT1(float x) {
  if (x == 0.0) {
    return -0.032788541075985965;
  }
  return -0.032788541075985965 +
  x *
    (0.006100538702462913 +
      x * (-0.0014034646998923284 + x * 0.00031563207090362595));
}

float polyvalT2(float x) {
  if (x == 0.0) {
    return 0.01797067508118204;
  }
  return 0.01797067508118204 +
  x *
    (-0.0036845201678113826 +
      x * (0.000881081882437654 + x * -0.00031275416837512086));
}

float polyvalT3(float x) {
  if (x == 0.0) {
    return -0.010314224129834144;
  }
  return -0.010314224129834144 +
  x *
    (0.0022596478090061247 +
      x * (-0.0005385953053567405 + x * 0.0003355291926355191));
}

float polyvalU(float x) {
  if (x == 0.0) {
    return 0.6328270640250934;
  }
  return 0.6328270640250934 +
  x *
    (1.4549225013723477 +
      x *
        (0.9777175279633727 +
          x * (0.22896372806469245 + x * 0.013381091853678766)));
}

float polyvalV(float x) {
  if (x == 0.0) {
    return 2.4559779371304113;
  }
  return 2.4559779371304113 +
  x *
    (2.128489763798934 +
      x *
        (0.7692851504566728 +
          x * (0.10422264559336913 + x * 0.003217092422824239)));
}

float polyvalW(float x) {
  if (x == 0.0) {
    return 0.08333333333333297;
  }
  return 0.08333333333333297 +
  x *
    (-0.0027777777772877554 +
      x *
        (0.0007936505586430196 +
          x *
            (-0.00059518755745034 +
              x * (0.0008363399189962821 + x * -0.0016309293409657527))));
}

const float A1C = 7.72156649015328655494e-02; // 0x3FB3C467E37DB0C8
const float A2C = 3.22467033424113591611e-01; // 0x3FD4A34CC4A60FAD
const float RC = 1.0;
const float SC = -7.72156649015328655494e-02; // 0xBFB3C467E37DB0C8
const float T1C = 4.83836122723810047042e-01; // 0x3FDEF72BC8EE38A2
const float T2C = -1.47587722994593911752e-01; // 0xBFC2E4278DC6C509
const float T3C = 6.46249402391333854778e-02; // 0x3FB08B4294D5419B
const float UC = -7.72156649015328655494e-02; // 0xBFB3C467E37DB0C8
const float VC = 1.0;
const float WC = 4.18938533204672725052e-01; // 0x3FDACFE390C97D69
const float YMIN = 1.461632144968362245;
const float TWO52 = 4503599627370496.0; // 2**52
const float TWO56 = 72057594037927936.0; // 2**56
const float TINY = 1.3877787807814457e-17;
const float TC = 1.46163214496836224576; // 0x3FF762D86356BE3F
const float TF = -1.21486290535849611461e-01; // 0xBFBF19B9BCC38A42
const float TT = -3.63867699703950536541e-18; // 0xBC50C7CAA48A971F => TT = -(tail of TF)

float lngamma(float x) {
  bool isNegative;
  float nadj, p3, p2, p1, p, q, t, w, y, z, r;
  int flg;

  // nan, inf
  if (isnan(x) || isinf(x)) {
    return x;
  }

  // 0
  if (x == 0.0) {
    return 1.0 / 0.0;
  }

  isNegative = x < 0.0;
  x = abs(x);

  // |x| < 2 ** -56
  if (x < TINY) {
    return -log(x);
  }

  // adjustment for negatives
  if (isNegative) {
    if (x >= TWO52) {
      return 1.0 / 0.0;
    }
    t = sinpi(x);
    if (t == 0.0) {
      return 1.0 / 0.0;
    }
    nadj = log(PI / abs(t * x));
  }

  // 1 or 2
  if (x == 1.0 || x == 2.0) {
    return 0.0;
  }

  if (x < 2.0) {
    if (x <= 0.9) {
      r = -log(x);

      if (x >= YMIN - 1.0 + 0.27) {
        y = 1.0 - x;
        flg = 0;
      } else if (x >= YMIN - 1.0 - 0.27) {
        y = x - (TC - 1.0);
        flg = 1;
      } else {
        y = x;
        flg = 2;
      }
    } else {
      r = 0.0;

      if (x >= YMIN + 0.27) {
        y = 2.0 - x;
        flg = 0;
      } else if (x >= YMIN - 0.27) {
        y = x - TC;
        flg = 1;
      } else {
        y = x - 1.0;
        flg = 2;
      }
    }

    if (flg == 0) {
      z = y * y;
      p1 = A1C + z * polyvalA1(z);
      p2 = z * (A2C + z * polyvalA2(z));
      p = y * p1 + p2;
      r += p - 0.5 * y;
    } else if (flg == 1) {
      z = y * y;
      w = z * y;
      p1 = T1C + w * polyvalT1(w);
      p2 = T2C + w * polyvalT2(w);
      p3 = T3C + w * polyvalT3(w);
      p = z * p1 - (TT - w * (p2 + y * p3));
      r += TF + p;
    } else if (flg == 2) {
      p1 = y * (UC + y * polyvalU(y));
      p2 = VC + y * polyvalV(y);
      r += -0.5 * y + p1 / p2;
    }
  } else if (x < 8.0) {
    flg = int(x);
    y = x - float(flg);
    p = y * (SC + y * polyvalS(y));
    q = RC + y * polyvalR(y);
    r = 0.5 * y + p / q;
    z = 1.0;

    if (flg == 7) {
      z *= y + 6.0;
    }
    if (flg >= 6) {
      z *= y + 5.0;
    }
    if (flg >= 5) {
      z *= y + 4.0;
    }
    if (flg >= 4) {
      z *= y + 3.0;
    }
    if (flg >= 3) {
      z *= y + 2.0;
      r += log(z);
    }
  } else if (x < TWO56) {
    t = log(x);
    z = 1.0 / x;
    y = z * z;
    w = WC + z * polyvalW(y);
    r = (x - 0.5) * (t - 1.0) + w;
  } else {
    r = x * (log(x) - 1.0);
  }

  if (isNegative) {
    r = nadj - r;
  }

  return r;
}
