import { fnDist, fnNum, type GlslContext } from "./fn"
import { isZero } from "./ty/check"
import { approx, frac, num, pt, real } from "./ty/create"
import { hypot, safe } from "./util"

export const ADD = fnNum<[0, 0]>(
  "+",
  {
    approx([a, b]) {
      return approx(a + b)
    },
    exact(a, b) {
      const s1 = a.n * b.d
      if (!safe(s1)) return null
      const s2 = b.n * a.d
      if (!safe(s2)) return null
      const s3 = a.d * b.d
      if (!safe(s3)) return null
      const s4 = s1 + s2
      if (!safe(s4)) return null
      return frac(s4, s3)
    },
    point(a, b) {
      return pt(this.real(a.x, b.x), this.real(a.y, b.y))
    },
  },
  {
    real(_, a, b) {
      return `(${a} + ${b})`
    },
    complex(_, a, b) {
      return `(${a} + ${b})`
    },
  },
)

export const SUB = fnNum<[0, 0]>(
  "-",
  {
    approx([a, b]) {
      return approx(a - b)
    },
    exact(a, b) {
      const s1 = a.n * b.d
      if (!safe(s1)) return null
      const s2 = b.n * a.d
      if (!safe(s2)) return null
      const s3 = a.d * b.d
      if (!safe(s3)) return null
      const s4 = s1 - s2
      if (!safe(s4)) return null
      return frac(s4, s3)
    },
    point(a, b) {
      return pt(this.real(a.x, b.x), this.real(a.y, b.y))
    },
  },
  {
    real(_, a, b) {
      return `(${a} - ${b})`
    },
    complex(_, a, b) {
      return `(${a} - ${b})`
    },
  },
)

function declareMul(ctx: GlslContext) {
  ctx.declare`vec2 _helper_mul(vec2 a, vec2 b) {
  return vec2(
    a.x * b.x - a.y * b.y,
    a.y * b.x + a.x * b.y
  );
}
`
}

export const MUL = fnNum<[0, 0]>(
  "·",
  {
    approx([a, b]) {
      return approx(a * b)
    },
    exact(a, b) {
      const s1 = a.n * b.n
      if (!safe(s1)) return null
      const s2 = a.d * b.d
      return frac(s1, s2)
    },
    point({ x: a, y: b }, { x: c, y: d }) {
      return pt(
        SUB.real(this.real(a, c), this.real(b, d)),
        ADD.real(this.real(b, c), this.real(a, d)),
      )
    },
  },
  {
    real(_, a, b) {
      return `(${a} * ${b})`
    },
    complex(ctx, a, b) {
      declareMul(ctx)
      return `_helper_mul(${a}, ${b})`
    },
  },
)

export const DIV = fnNum<[0, 0]>(
  "÷",
  {
    approx([a, b], [ar]) {
      if (ar.type == "exact" && ar.n == 0 && b != 0) {
        return real(0)
      }
      return approx(a / b)
    },
    exact(a, b) {
      const s1 = a.n * b.d
      if (!safe(s1)) return null
      const s2 = a.d * b.n
      return frac(s1, s2)
    },
    point({ x: a, y: b }, { x: c, y: d }) {
      //   (a+bi) / (c+di)
      // = (a+bi)(c-di) / (c+di)(c-di)
      // = (a+bi)(c-di) / (c²-d²i²)
      // = (a+bi)(c-di) / (c²+d²)
      const x = ADD.real(MUL.real(a, c), MUL.real(b, d))
      const y = SUB.real(MUL.real(b, c), MUL.real(a, d))
      const denom = ADD.real(MUL.real(c, c), MUL.real(d, d))
      return pt(this.real(x, denom), this.real(y, denom))
    },
  },
  {
    real(_, a, b) {
      return `(${a} / ${b})`
    },
    complex(ctx, a, b) {
      ctx.declare`vec2 _helper_div(vec2 a, vec2 b) {
  return vec2(
    a.x * b.x + a.y * b.y,
    a.y * b.x - a.x * b.y
  ) / (b.x * b.x + b.y * b.y);
}
`
      return `_helper_div(${a}, ${b})`
    },
  },
)

function declareExp(ctx: GlslContext) {
  ctx.declare`vec2 _helper_exp(vec2 a) {
  return a.x * vec2(cos(a.y), sin(a.y));
}
`
}

export const EXP = fnNum<[0]>(
  "exp",
  {
    approx([a]) {
      return approx(Math.exp(a))
    },
    exact(a) {
      if (a.n == 0) {
        return real(1)
      }
      return null
    },
    point(a) {
      const e = this.real(a.x)
      const y = num(a.y)

      return pt(
        MUL.real(e, approx(Math.cos(y))),
        MUL.real(e, approx(Math.sin(y))),
      )
    },
  },
  {
    real(_, a) {
      return `exp(${a})`
    },
    complex(ctx, a) {
      declareExp(ctx)
      return `_helper_exp(${a})`
    },
  },
)

function declareLnUnchecked(ctx: GlslContext) {
  ctx.declare`vec2 _helper_ln_unchecked(vec2 z) {
  return vec2(log(length(z)), atan(z.y, z.x));
}
`
}

export const POW = fnNum<[0, 0]>(
  "^",
  {
    approx([a, b]) {
      return approx(a ** b)
    },
    point(a, b) {
      if (isZero(b)) {
        if (b.x.type == "exact" && b.y.type == "exact") {
          return pt(real(1), real(0))
        } else {
          return pt(approx(1), approx(0))
        }
      }

      if (isZero(a)) {
        if (a.x.type == "exact" && a.y.type == "exact") {
          return pt(real(0), real(0))
        } else {
          return pt(approx(0), approx(0))
        }
      }

      return EXP.complex(
        MUL.complex(
          b,
          pt(
            approx(Math.log(hypot(num(a.x), num(a.y)))),
            approx(Math.atan2(num(a.y), num(a.x))),
          ),
        ),
      )
    },
  },
  {
    real(_, a, b) {
      return `pow(${a}, ${b})`
    },
    complex(ctx, a, b) {
      declareMul(ctx)
      declareExp(ctx)
      declareLnUnchecked(ctx)
      ctx.declare`vec2 _helper_pow(vec2 a, vec2 b) {
  if (a == vec2(0)) {
    return vec2(0);
  } else {
    return _helper_exp(_helper_mul(b, _helper_ln_unchecked(a)));
  }
}
`
      return `_helper_pow(${a}, ${b})`
    },
  },
)

export const RGB = fnDist<[0, 0, 0]>("rgb", {
  ty(r, g, b, a) {
    if (
      r?.type == "real" &&
      g?.type == "real" &&
      b?.type == "real" &&
      a == null
    ) {
      return "color"
    }
    return null
  },
  js(r, g, b) {
    if (r.type == "real" && g.type == "real" && b.type == "real") {
      return {
        type: "color",
        value: { type: "color", r: r.value, g: g.value, b: b.value },
      }
    }
    return null
  },
  glsl(_, r, g, b) {
    if (r.type == "real" && g.type == "real" && b.type == "real") {
      return `vec3(${r.expr}, ${g.expr}, ${b.expr})`
    }
    return null
  },
})
