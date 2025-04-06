/*! Adapted from @stdlib/math/base/special/erf */

float _erf_polyPP(float x) {
  if (x == 0.0) {
    return -0.3250421072470015;
  }
  return -0.3250421072470015 +
  x *
    (-0.02848174957559851 +
      x * (-0.005770270296489442 + x * -0.000023763016656650163));

}

float _erf_polyQQ(float x) {
  if (x == 0.0) {
    return 0.39791722395915535;
  }
  return 0.39791722395915535 +
  x *
    (0.0650222499887673 +
      x *
        (0.005081306281875766 +
          x * (0.00013249473800432164 + x * -0.000003960228278775368)));
}

float _erf_polyPA(float x) {
  if (x == 0.0) {
    return 0.41485611868374833;
  }
  return 0.41485611868374833 +
  x *
    (-0.3722078760357013 +
      x *
        (0.31834661990116175 +
          x *
            (-0.11089469428239668 +
              x * (0.035478304325618236 + x * -0.002166375594868791))));
}

float _erf_polyQA(float x) {
  if (x == 0.0) {
    return 0.10642088040084423;
  }
  return 0.10642088040084423 +
  x *
    (0.540397917702171 +
      x *
        (0.07182865441419627 +
          x *
            (0.12617121980876164 +
              x * (0.01363708391202905 + x * 0.011984499846799107))));
}

float _erf_polyRA(float x) {
  if (x == 0.0) {
    return -0.6938585727071818;
  }
  return -0.6938585727071818 +
  x *
    (-10.558626225323291 +
      x *
        (-62.375332450326006 +
          x *
            (-162.39666946257347 +
              x *
                (-184.60509290671104 +
                  x * (-81.2874355063066 + x * -9.814329344169145)))));
}

float _erf_polySA(float x) {
  if (x == 0.0) {
    return 19.651271667439257;
  }
  return 19.651271667439257 +
  x *
    (137.65775414351904 +
      x *
        (434.56587747522923 +
          x *
            (645.3872717332679 +
              x *
                (429.00814002756783 +
                  x *
                    (108.63500554177944 +
                      x * (6.570249770319282 + x * -0.0604244152148581))))));
}

float _erf_polyRB(float x) {
  if (x == 0.0) {
    return -0.799283237680523;
  }
  return -0.799283237680523 +
  x *
    (-17.757954917754752 +
      x *
        (-160.63638485582192 +
          x *
            (-637.5664433683896 +
              x * (-1025.0951316110772 + x * -483.5191916086514))));
}

float _erf_polySB(float x) {
  if (x == 0.0) {
    return 30.33806074348246;
  }
  return 30.33806074348246 +
  x *
    (325.7925129965739 +
      x *
        (1536.729586084437 +
          x *
            (3199.8582195085955 +
              x *
                (2553.0504064331644 +
                  x * (474.52854120695537 + x * -22.44095244658582)))));
}

// TODO: these are just zero
float _erf_TINY = 1.0e-300;
float _erf_VERY_TINY = 2.848094538889218e-306;

float _erf_SMALL = 3.725290298461914e-9;

float _erf_ERX = 8.45062911510467529297e-1;

float _erf_EFX = 1.28379167095512586316e-1;
float _erf_EFX8 = 1.02703333676410069053;

float _erf_PPC = 1.28379167095512558561e-1;
float _erf_QQC = 1.0;

float _erf_PAC = -2.36211856075265944077e-3;
float _erf_QAC = 1.0;

float _erf_RAC = -9.86494403484714822705e-3;
float _erf_SAC = 1.0;

float _erf_RBC = -9.86494292470009928597e-3;
float _erfSBC = 1.0;

float _nya_helper_erf(float x) {
  bool sign;
  float ax, z, r, s, y, p, q;
  if (isnan(x)) {
    return 0.0 / 0.0;
  }
  // Special case: +infinity
  if (x == 1.0 / 0.0) {
    return 1.0;
  }
  // Special case: -infinity
  if (x == -1.0 / 0.0) {
    return -1.0;
  }
  // Special case: +-0
  if (x == 0.0) {
    return x;
  }
  if (x < 0.0) {
    sign = true;
    ax = -x;
  } else {
    sign = false;
    ax = x;
  }
  // |x| < 0.84375
  if (ax < 0.84375) {
    if (ax < _erf_SMALL) {
      if (ax < _erf_VERY_TINY) {
        // Avoid underflow:
        return 0.125 * (8.0 * x + _erf_EFX8 * x);
      }
      return x + _erf_EFX * x;
    }
    z = x * x;
    r = _erf_PPC + z * _erf_polyPP(z);
    s = _erf_QQC + z * _erf_polyQQ(z);
    y = r / s;
    return x + x * y;
  }
  // 0.84375 <= |x| < 1.25
  if (ax < 1.25) {
    s = ax - 1.0;
    p = _erf_PAC + s * _erf_polyPA(s);
    q = _erf_QAC + s * _erf_polyQA(s);
    if (sign) {
      return -_erf_ERX - p / q;
    }
    return _erf_ERX + p / q;
  }
  // +inf > |x| >= 6
  if (ax >= 6.0) {
    if (sign) {
      return _erf_TINY - 1.0; // raise inexact
    }
    return 1.0 - _erf_TINY; // raise inexact
  }
  s = 1.0 / (ax * ax);

  // |x| < 1/0.35 ~ 2.857143
  if (ax < 2.857142857142857) {
    r = _erf_RAC + s * _erf_polyRA(s);
    s = _erf_SAC + s * _erf_polySA(s);
  } // |x| >= 1/0.35 ~ 2.857143
  else {
    r = _erf_RBC + s * _erf_polyRB(s);
    s = _erfSBC + s * _erf_polySB(s);
  }
  z = ax; // setLowWord(ax, 0); // pseudo-single (20-bit) precision x
  r = exp(-(z * z) - 0.5625) * exp((z - ax) * (z + ax) + r / s);
  if (sign) {
    return r / ax - 1.0;
  }
  return 1.0 - r / ax;
}
