import factorial from "@stdlib/math/base/special/factorial"
import type { Package } from "."
import { NO_SYM } from "../eval/ast/tx"
import type { GlslContext } from "../eval/lib/fn"
import { FnDist } from "../eval/ops/dist"
import { num, real } from "../eval/ty/create"

function factorialGlsl(ctx: GlslContext, x: string) {
  ctx.glsl`float sinpiSeries(float x) {
  float xsq = x * x;
  return x * (3.141592653589793 - xsq * (5.167708 - xsq * (2.549761 - xsq * 0.5890122)));
}

float sinpi(float x) {
  if (isnan(x) || isinf(x)) {
    return 0.0 / 0.0;
  }
  if (x == 0.0) {
    return x;
  }
  if (x == floor(x)) {
    return x > 0.0 ? 0.0 : -0.0;
  }
  int i = int(floor(2.0 * x + 0.5));
  float t = -0.5 * float(i) + x;
  float s = bool(i & 2) ? -1.0 : 1.0;
  float y = bool(i & 1) ? cos(3.141592653589793 * t) : sinpiSeries(t);
  return s * y;
}

float sincpi(float x) {
  return isnan(x)
    ? 0.0 / 0.0
    : isinf(x)
    ? 0.0
    : x == 0.0
    ? 1.0
    : sinpi(x) / (3.141592653589793 * x);
}

float stirlingPrefactor(float x, float y) {
  if (isnan(x) || isnan(y)) {
    return 0.0 / 0.0;
  }
  return pow(x / exp(1.0), y);
}

float stirlerrSeries(float x) {
  float S0 = 0.083333336;
  float S1 = 0.0027777778;
  float S2 = 0.0007936508;
  float nn = x * x;
  return (S0 - (S1 - S2 / nn) / nn) / x;
}

float factorialMinimax(float x) {
  float n1 = 2.1618295;
  float n2 = 1.5849807;
  float n3 = 0.4026814;
  float d1 = 2.2390451;
  float d2 = 1.6824219;
  float d3 = 0.43668285;

  float n = 1.0 + x * (n1 + x * (n2 + x * n3));
  float d = 1.0 + x * (d1 + x * (d2 + x * d3));
  float xp1 = x + 1.0;

  return stirlingPrefactor(xp1, x) * sqrt(xp1) * (n / d);
}

float factorialAsymptotic(float x) {
  return stirlingPrefactor(x, x) *
  sqrt(2.0 * 3.141592653589793 * x) *
  exp(stirlerrSeries(x));
}

float factorialPositive(float x) {
  return x > 33.0
    ? 1.0 / 0.0
    : x > 8.0
    ? factorialAsymptotic(x)
    : factorialMinimax(x);
}

float factorial(float x) {
  if (isnan(x) || isinf(x) && x < 0.0) {
    return 0.0 / 0.0;
  }

  bool isInteger = x == floor(x);
  if (x < 0.0) {
    if (isInteger) {
      return 1.0 / 0.0;
    }
    return 1.0 / (sincpi(x) * factorialPositive(-x));
  }
  float approx = factorialPositive(x);
  return isInteger ? round(approx) : approx;
}
`

  return `factorial(${x})`
}

const OP_FACTORIAL = new FnDist("!", "computes a factorial", {
  message: "Cannot take the factorial of %%.",
}).add(
  ["r32"],
  "r32",
  (a) => {
    const val = num(a.value)
    if (val == Math.floor(val) && val < 0) {
      return real(Infinity)
    }
    return real(factorial(val))
  },
  (ctx, a) => factorialGlsl(ctx, a.expr),
)

export const PKG_FACTORIAL: Package = {
  id: "nya:factorial",
  name: "factorial",
  label: "extended factorial operator",
  eval: {
    tx: {
      suffix: {
        factorial: {
          sym: NO_SYM,
          deps(node, deps) {
            if (typeof node.repeats != "number") {
              deps.add(node.repeats)
            }
          },
          js(node) {
            if (node.rhs.repeats != 1) {
              throw new Error("Cannot compute higher-order factorials yet.")
            }
            return OP_FACTORIAL.js([node.base])
          },
          glsl(node, props) {
            if (node.rhs.repeats != 1) {
              throw new Error("Cannot compute higher-order factorials yet.")
            }
            return OP_FACTORIAL.glsl(props.ctx, [node.base])
          },
        },
      },
    },
  },
}
