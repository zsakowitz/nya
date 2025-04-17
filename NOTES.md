## URL Parameters

general configuration:

- `?onlypkg=<comma-separated package ids>`
- `?addons=<comma-separated package ids>`

configure sheet:

- `?nogrid`
- `?showaddons`
- `?cvsize=<n>`
- `?shaderpixelsize=<1..=16>`
- `?logfrag`

show other pieces of content:

- `?/docs(/tab(/page)?)?`
- `?showmanifest`

## other things

(arccos x).imag = arccosh x for 1≤x

Search in `09ebb184-7d76-4d37-a61a-30d9b6f12578` for

```
complexSin: Qs(ge`float u = z.x; float v = z.y;
```

```c
float factorial(float x) {
if (isnan(x) || (isinf(x) && x < 0.0)) { return NaN; }
    bool isInteger = x == floor(x);
    if (x < 0.0) {
      if (isInteger) return Infinity;
      return 1.0 / (sincpi(x) * factorialPositive(-x));
    }
    float approx = factorialPositive(x);
    return isInteger ? round(approx) : approx;
    }

float factorialPositive(float x)
            {return (x>33.0)?Infinity:(x>8.0)?factorialAsymptotic(x):factorialMinimax(x)}

float factorialMinimax(float x) {

    float n1 = 2.1618295;
    float n2 = 1.5849807;
    float n3 = 0.4026814;
    float d1 = 2.2390451;
    float d2 = 1.6824219;
    float d3 = 0.43668285;

    float n = 1.0 + x*(n1 + x*(n2 + x*n3));
    float d = 1.0 + x*(d1 + x*(d2 + x*d3));
    float xp1 = x+1.0;

    return stirlingPrefactor(xp1,x)*sqrt(xp1)*(n/d);


}

float factorialAsymptotic(float x) {
  return stirlingPrefactor(x,x)*sqrt(2.0*PI*x)*exp(stirlerrSeries(x));
}

float stirlingPrefactor(float x, float y) {
  if (isnan(x) || isnan(y)) { return NaN; }
    return pow(x/exp(1.0), y);
}

float stirlerrSeries(float x) {
    float S0 = 0.083333336;
    float S1 = 0.0027777778;
    float S2 = 0.0007936508;
    float nn = x*x;
    return (S0-(S1-S2/nn)/nn)/x;
}

float sincpi(float x) {
          return isnan(x) ? NaN : isinf(x) ? 0.0 : x == 0.0 ? 1.0 : sinpi(x)/(PI*x);
}

float sinpi(float x) {
  if (isnan(x) || isinf(x)) { return NaN; }
    if (x==0.0) { return x; }
    if (x == floor(x)) { return x > 0.0 ? 0.0 : -0.0; }
    int i = int(round(2.0*x));
    float t = -0.5 * float(i) + x;
    float s = bool(i & 2) ? -1.0 : 1.0;
    float y = bool(i & 1) ? cos(PI * t) : sinpiSeries(t);
    return s*y;
}

float sinpiSeries(float x) {
  float xsq = x*x;
    return x*(PI-xsq*(5.167708-xsq*(2.549761-xsq*0.5890122)));
}


```

```js
// sin(a+bi) = 1/2 (e^b sin a + e^-b sin a + i e^b cos a - i e^-b cos a)
// \frac{1}{2}\left(e^{b}\cdot \left(\operatorname{sin}a+i\operatorname{cos}a\right)+e^{-b}\cdot \left(\operatorname{sin}a+i\operatorname{cos}a\right)\right)
// sinh b = (e^b - e^-b) / 2
// cosh b = (e^b + e^-b) / 2
```
