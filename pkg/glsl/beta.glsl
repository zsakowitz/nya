float beta_gammasign(float x) {
  return x > 0.0 || mod(floor(x), 2.0) == 0.0 ? 1.0 : -1.0;
}

float beta_sign(float x, float y) {
  return beta_gammasign(x) * beta_gammasign(y) * beta_gammasign(x + y);
}

float beta_ln(float x, float y) {
  return _nya_helper_lngamma(x) + _nya_helper_lngamma(y) - _nya_helper_lngamma(x + y);
}

float beta(float x, float y) {
  return beta_sign(x, y) * exp(beta_ln(x, y));
}
