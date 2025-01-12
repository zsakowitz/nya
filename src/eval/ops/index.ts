import type { PuncCmp, PuncInfix, PuncPm, PuncUnary } from "../ast/token"
import { fnBool, fnDist, fnNum, type Fn, type GlslContext } from "../fn"
import { isZero } from "../ty/check"
import { coerceTy, coerceValGlsl, coerceValJs, listJs } from "../ty/coerce"
import {
  approx,
  bool,
  frac,
  num,
  pt,
  real,
  vapprox,
  vfrac,
  vreal,
} from "../ty/create"
import { hypot, safe } from "../util"

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

export const CROSS = fnNum<[0, 0]>(
  "cross product",
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
    point() {
      throw new Error("Cannot calculate a cross product of complex numbers.")
    },
  },
  {
    real(_, a, b) {
      return `(${a} * ${b})`
    },
    complex() {
      throw new Error("Cannot calculate a cross product of complex numbers.")
    },
  },
)

export const ODOT = fnNum<[0, 0]>(
  "⊙",
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
      return pt(this.real(a, c), this.real(b, d))
    },
  },
  {
    real(_, a, b) {
      return `(${a} * ${b})`
    },
    complex(_, a, b) {
      return `(${a} * ${b})`
    },
  },
)

function declareDiv(ctx: GlslContext) {
  ctx.declare`vec2 _helper_div(vec2 a, vec2 b) {
  return vec2(
    a.x * b.x + a.y * b.y,
    a.y * b.x - a.x * b.y
  ) / (b.x * b.x + b.y * b.y);
}
`
}

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
      declareDiv(ctx)
      return `_helper_div(${a}, ${b})`
    },
  },
)

export const MOD = fnNum<[0, 0]>(
  "mod",
  {
    approx([a, b], [ar]) {
      if (ar.type == "exact" && ar.n == 0 && b != 0) {
        return real(0)
      }
      return approx(((a % b) + b) % b)
    },
    point() {
      throw new Error(
        "The 'mod' operator cannot be applied to complex numbers.",
      )
    },
  },
  {
    real(ctx, a, b) {
      ctx.declare`float _helper_mod(float a, float b) {
  return mod(mod(a, b) + b, b);
}
`
      return `_helper_mod(${a}, ${b})`
    },
    complex() {
      throw new Error(
        "The 'mod' operator cannot be applied to complex numbers.",
      )
    },
  },
)

function declareExp(ctx: GlslContext) {
  ctx.declare`vec2 _helper_exp(vec2 a) {
  return exp(a.x) * vec2(cos(a.y), sin(a.y));
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

function declareLn(ctx: GlslContext) {
  ctx.declare`vec2 _helper_ln(vec2 z) {
  if (z == vec2(0)) {
    return vec2(-1.0 / 0.0, 0);
  }

  return vec2(log(length(z)), atan(z.y, z.x));
}
`
}

export const LN = fnNum<[0]>(
  "ln",
  {
    approx([a]) {
      return approx(Math.log(a))
    },
    point(a) {
      if (isZero(a)) {
        return pt(real(-Infinity), real(0))
      }

      const x = num(a.x)
      const y = num(a.y)

      return pt(approx(Math.log(hypot(x, y))), approx(Math.atan2(y, x)))
    },
  },
  {
    real(_, a) {
      return `log(${a})`
    },
    complex(ctx, z) {
      declareLn(ctx)
      return `_helper_ln(${z})`
    },
  },
)

export const POW = fnNum<[0, 0]>(
  "^",
  {
    approx([a, b], [ar, br]) {
      if (br.type == "exact" && br.n == 0) {
        return frac(1, 0)
      }
      if (ar.type == "exact" && ar.n == 0) {
        return frac(0, 0)
      }
      // FIXME: things like cube roots don't work reliably for negative numbers
      return approx(a ** b)
    },
    exact(a, b) {
      let n = a.n ** b.n
      if (!safe(n)) return null
      n **= 1 / b.d
      if (!safe(n)) return null

      let d = a.d ** b.n
      if (!safe(d)) return null
      d **= 1 / b.d
      if (!safe(d)) return null

      return frac(n, d)
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
    return _helper_exp(
      _helper_mul(
        b,
        vec2(
          log(length(a)),
          atan(a.y, a.x)
        )
      )
    );
  }
}
`
      return `_helper_pow(${a}, ${b})`
    },
  },
)

export const SQRT = fnNum<[0]>(
  "sqrt",
  {
    approx([a]) {
      return approx(Math.sqrt(a))
    },
    exact(a) {
      const sn = Math.sqrt(a.n)
      const sd = Math.sqrt(a.d)
      if (sn == Math.floor(sn) && sd == Math.floor(sd)) {
        return frac(sn, sd)
      } else {
        return approx(sn / sd)
      }
    },
    point(a) {
      return EXP.complex(
        pt(
          approx(Math.log(hypot(num(a.x), num(a.y))) / 2),
          approx(Math.atan2(num(a.y), num(a.x)) / 2),
        ),
      )
    },
  },
  {
    real(_, a) {
      return `sqrt(${a})`
    },
    complex(ctx, a) {
      declareExp(ctx)
      ctx.declare`vec2 _helper_sqrt(vec2 a) {
  return _helper_exp(
    vec2(
      log(length(a)),
      atan(a.y, a.x)
    ) / 2.0
  );
}
`
      return `_helper_sqrt(${a})`
    },
  },
)

export const REAL = fnDist<[0]>("real", {
  ty(a) {
    return a.type == "bool" || a.type == "complex" || a.type == "real" ?
        "real"
      : null
  },
  js(a) {
    switch (a.type) {
      case "bool":
        return vreal(a.value ? 1 : NaN)
      case "real":
        return a
      case "complex":
        return { type: "real", value: a.value.x }
      case "color":
        return null
    }
  },
  glsl(_, a) {
    switch (a.type) {
      case "bool":
        return `(${a.expr} ? 1.0 : 0.0/0.0)`
      case "real":
        return a.expr
      case "complex":
        return `${a.expr}.x`
      case "color":
        return null
    }
  },
})

export const IMAG = fnDist<[0]>("imag", {
  ty(a) {
    return a.type == "bool" || a.type == "complex" || a.type == "real" ?
        "real"
      : null
  },
  js(a) {
    switch (a.type) {
      case "bool":
        return { type: "real", value: a.value ? real(0) : real(NaN) }
      case "real":
        return { type: "real", value: real(0) }
      case "complex":
        return { type: "real", value: a.value.y }
      case "color":
        return null
    }
  },
  glsl(_, a) {
    switch (a.type) {
      case "bool":
        return `(${a.expr} ? 0.0 : 0.0/0.0)`
      case "real":
        return `0.0`
      case "complex":
        return `${a.expr}.y`
      case "color":
        return null
    }
  },
})

export const RGB = fnDist<[0, 0, 0]>("rgb", {
  ty(r, g, b) {
    if (r.type == "real" && g.type == "real" && b.type == "real") {
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
      return `(vec3(${r.expr}, ${g.expr}, ${b.expr}) / 255.0)`
    }
    return null
  },
})

export const HSV = fnDist<[0, 0, 0]>("hsv", {
  ty(h, s, v) {
    if (h.type == "real" && s.type == "real" && v.type == "real") {
      return "color"
    }
    return null
  },
  js(hr, sr, vr) {
    if (!(hr.type == "real" && sr.type == "real" && vr.type == "real")) {
      return null
    }
    const h = num(hr.value) / 360
    const s = num(sr.value)
    const v = num(vr.value)

    // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
    let r, g, b
    let i = Math.floor(h * 6)
    let f = h * 6 - i
    let p = v * (1 - s)
    let q = v * (1 - f * s)
    let t = v * (1 - (1 - f) * s)
    switch (i % 6) {
      case 0:
        ;(r = v), (g = t), (b = p)
        break
      case 1:
        ;(r = q), (g = v), (b = p)
        break
      case 2:
        ;(r = p), (g = v), (b = t)
        break
      case 3:
        ;(r = p), (g = q), (b = v)
        break
      case 4:
        ;(r = t), (g = p), (b = v)
        break
      case 5:
        ;(r = v), (g = p), (b = q)
        break
      default:
        throw new Error("Never occurs.")
    }
    return {
      type: "color",
      value: {
        type: "color",
        r: real(255.0 * r),
        g: real(255.0 * g),
        b: real(255.0 * b),
      },
    }
  },
  glsl(ctx, h, s, v) {
    if (!(h.type == "real" && s.type == "real" && v.type == "real")) {
      return null
    }
    ctx.declare`const vec4 _helper_hsv_const = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);

vec3 _helper_hsv(vec3 c) {
  vec3 p = abs(fract(c.xxx + _helper_hsv_const.xyz) * 6.0 - _helper_hsv_const.www);
  return c.z * mix(_helper_hsv_const.xxx, clamp(p - _helper_hsv_const.xxx, 0.0, 1.0), c.y);
}
`
    return `_helper_hsv(vec3(${h.expr}, ${s.expr}, ${v.expr}) / vec3(360.0, 1.0, 1.0))`
  },
})

export const ABS = fnDist<[0]>("abs", {
  ty(a) {
    if (a.type == "color") {
      return null
    }

    return "real"
  },
  js(a) {
    switch (a.type) {
      case "real":
        if (a.value.type == "exact") {
          return vfrac(Math.abs(a.value.n), a.value.d)
        } else {
          return vapprox(Math.abs(a.value.value))
        }
      case "complex":
        return vapprox(hypot(num(a.value.x), num(a.value.y)))
      case "bool":
        return coerceValJs(a, { type: "real" })
      case "color":
        return null
    }
  },
  glsl(_, a) {
    switch (a.type) {
      case "real":
        return `abs(${a.expr})`
      case "complex":
        return `length(${a.expr})`
      case "bool":
        return `(${a.expr} ? 1.0 : 0.0/0.0)`
      case "color":
        return null
    }
  },
})

export const ANGLE = fnDist<[0]>("angle", {
  ty(a) {
    if (a.type == "color") {
      return null
    }

    return "real"
  },
  js(a) {
    switch (a.type) {
      case "real":
        if (isNaN(num(a.value))) {
          return vapprox(NaN)
        } else if (num(a.value) < 0) {
          return vapprox(Math.PI)
        } else {
          return vfrac(0, 1)
        }
      case "complex":
        return vapprox(Math.atan2(num(a.value.y), num(a.value.x)))
      case "bool":
        if (a.value) {
          return vfrac(0, 1)
        } else {
          return vapprox(NaN)
        }
      case "color":
        return null
    }
  },
  glsl(ctx, a) {
    switch (a.type) {
      case "real":
        ctx.declare`float _helper_angle(float x) {
  if (isnan(x)) {
    return 0.0/0.0;
  } else if (x < 0.0) {
    return 3.141592653589793;
  } else {
    return 0.0;
  }
}
`
        return `_helper_angle(${a.expr})`
      case "complex":
        ctx.declare`float _helper_angle(vec2 x) {
  return atan(x.y, x.x);
}
`
        return `_helper_angle(${a.expr})`
      case "bool":
        return `(${a.expr} ? 0.0 : 0.0/0.0)`
      case "color":
        return null
    }
  },
})

function createEq(negate: boolean) {
  const name = negate ? "≠" : "="
  const op = negate ? "!=" : "=="

  return fnDist<[0, 0]>(name, {
    ty(a, b) {
      // ensure they are coercible; ignore result
      coerceTy([a, b])
      return "bool"
    },
    js(a, b) {
      const { type, value } = listJs([a, b])

      switch (type) {
        case "real":
          return bool((num(value[0]!) == num(value[1]!)) != negate)
        case "complex":
          return bool(
            (num(value[0]!.x) == num(value[1]!.x) &&
              num(value[0]!.y) == num(value[1]!.y)) != negate,
          )
        case "color":
          return bool(
            (num(value[0]!.r) == num(value[1]!.r) &&
              num(value[0]!.g) == num(value[1]!.g) &&
              num(value[0]!.b) == num(value[1]!.b)) != negate,
          )
        case "bool":
          return bool((value[0]! == value[1]!) != negate)
      }
    },
    glsl(_, ar, br) {
      const ty = coerceTy([ar, br])!
      const a = coerceValGlsl(ar, ty)
      const b = coerceValGlsl(br, ty)
      return `(${a} ${op} ${b})`
    },
  })
}

export const EQ = createEq(false)
export const NE = createEq(true)

function createCmp(
  negate: boolean,
  cmp: (a: number, b: number) => boolean,
  name: string,
  glsl: string,
): Fn<[0, 0]> {
  return fnDist<[0, 0]>(name, {
    ty(a, b) {
      // ensure they are coercible; ignore result
      coerceTy([a, b])
      return "bool"
    },
    js(a, b) {
      const { type, value } = listJs([a, b])

      switch (type) {
        case "real":
          return bool(cmp(num(value[0]!), num(value[1]!)) != negate)
      }

      return null
    },
    glsl(_, ar, br) {
      const a = coerceValGlsl(ar, { type: "real" })
      const b = coerceValGlsl(br, { type: "real" })
      return `${negate ? "(!" : ""}(${a} ${glsl} ${b})${negate ? ")" : ""}`
    },
  })
}

export const LT = createCmp(false, (a, b) => a < b, "<", "<")
export const LTE = createCmp(false, (a, b) => a <= b, "≤", "<=")
export const NLT = createCmp(true, (a, b) => a < b, "not <", "<")
export const NLTE = createCmp(true, (a, b) => a <= b, "not ≤", "<=")

export const GT = createCmp(false, (a, b) => a > b, ">", ">")
export const GTE = createCmp(false, (a, b) => a >= b, "≥", ">=")
export const NGT = createCmp(true, (a, b) => a > b, "not >", ">")
export const NGTE = createCmp(true, (a, b) => a >= b, "not ≥", ">=")

// prettier-ignore
export function opCmp(op: PuncCmp) {
  switch (op.dir) {
    case "=":
      return op.neg ? NE : EQ
    case "<":
      return op.neg ? op.eq ? NLTE : NLT : op.eq ? LTE : LT
    case ">":
      return op.neg ? op.eq ? NGTE : NGT : op.eq ? GTE : GT
    case "~":
    case "≈":
  }

  throw new Error(`The ${op.dir} operator is not supported yet.`)
}

export const AND = fnBool<0[]>(
  "and",
  (...args) => args.every((x) => x),
  (_, ...args) =>
    args.length == 0 ? "true"
    : args.length == 1 ? args[0]!
    : `(${args.join(" && ")})`,
)

export const OR = fnBool<0[]>(
  "or",
  (...args) => args.some((x) => x),
  (_, ...args) =>
    args.length == 0 ? "false"
    : args.length == 1 ? args[0]!
    : `(${args.join(" || ")})`,
)

export const DEBUGQUADRANT = fnDist<[0]>("debugquadrant", {
  ty(a) {
    if (a.type != "complex") {
      throw new Error("'debugquadrant' only operates on complex values.")
    }
    return "color"
  },
  js() {
    throw new Error("'debugquadrant' can only run in shaders.")
  },
  glsl(ctx, a) {
    ctx.declare`vec3 _helper_debugquadrant(vec2 z) {
  return vec3(
    (z.x < v_coords.x ? 255.0 : 0.0),
    (z.y < v_coords.y ? 255.0 : 0.0),
    255.0
  );
}`

    return `_helper_debugquadrant(${a.expr})`
  },
})

export const POS = fnNum<[0]>(
  "+",
  {
    approx(_, [a]) {
      return a
    },
    point(a) {
      return a
    },
  },
  {
    complex(_, a) {
      return a
    },
    real(_, a) {
      return a
    },
  },
)

export const NEG = fnNum<[0]>(
  "-",
  {
    approx(a) {
      return approx(-a)
    },
    exact({ n, d }) {
      return frac(-n, d)
    },
    point({ x, y }) {
      return pt(this.real(x), this.real(y))
    },
  },
  {
    complex(_, a) {
      return `(-${a})`
    },
    real(_, a) {
      return `(-${a})`
    },
  },
)

export const INTOCOLOR = fnDist<[0]>("intocolor", {
  ty() {
    return "color"
  },
  js() {
    throw new Error("Cannot plot colors outside of a shader.")
  },
  glsl(ctx, a) {
    switch (a.type) {
      case "bool":
        return `(${a.expr} ? vec4(vec3(0x2d, 0x70, 0xb3) / 255.0, 1.0) : vec4(0))`
      case "color":
        return `vec4(${a.expr}, 1.0)`
      case "real":
        return `vec4(${
          HSV.glsl(
            ctx,
            { ...a, list: false },
            { expr: "1.0", list: false, type: "real" },
            { expr: "1.0", list: false, type: "real" },
          ).expr
        }, 1.0)`
      case "complex":
        return `vec4(${DEBUGQUADRANT.glsl1(ctx, a).expr}, 1)`
    }
  },
})

export const UNSIGN = fnNum<[0]>(
  "unsign",
  {
    approx(_, [a]) {
      if (a.type == "approx") {
        return approx(Math.abs(a.value))
      } else {
        return frac(Math.abs(a.n), Math.abs(a.d))
      }
    },
    point({ x, y }) {
      return pt(this.real(x), this.real(y))
    },
  },
  {
    real(_, a) {
      return `abs(${a})`
    },
    complex(_, a) {
      return `abs(${a})`
    },
  },
)

function declareSin(ctx: GlslContext) {
  ctx.declare`vec2 _helper_sin(vec2 z) {
  return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}
`
}

export const SIN = fnNum<[0]>(
  "sin",
  {
    approx([a]) {
      return approx(Math.sin(a))
    },
    point(a) {
      return pt(
        approx(Math.sin(num(a.x)) * Math.cosh(num(a.y))),
        approx(Math.cos(num(a.x)) * Math.sinh(num(a.y))),
      )
    },
  },
  {
    real(_, a) {
      return `sin(${a})`
    },
    complex(ctx, a) {
      declareSin(ctx)
      return `_helper_sin(${a})`
    },
  },
)

function declareCos(ctx: GlslContext) {
  ctx.declare`vec2 _helper_cos(vec2 z) {
  return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}
`
}

export const COS = fnNum<[0]>(
  "cos",
  {
    approx([a]) {
      return approx(Math.cos(a))
    },
    point(a) {
      return pt(
        approx(Math.cos(num(a.x)) * Math.cosh(num(a.y))),
        approx(-Math.sin(num(a.x)) * Math.sinh(num(a.y))),
      )
    },
  },
  {
    real(_, a) {
      return `cos(${a})`
    },
    complex(ctx, a) {
      declareCos(ctx)
      return `_helper_cos(${a})`
    },
  },
)

export const TAN = fnNum<[0]>(
  "tan",
  {
    approx([a]) {
      return approx(Math.tan(a))
    },
    point(a) {
      return DIV.complex(SIN.complex(a), COS.complex(a))
    },
  },
  {
    real(_, a) {
      return `tan(${a})`
    },
    complex(ctx, a) {
      declareSin(ctx)
      declareCos(ctx)
      declareDiv(ctx)
      ctx.declare`vec2 _helper_tan(vec2 z) {
  return _helper_div(_helper_sin(z), _helper_cos(z));
}
`
      return `_helper_tan(${a})`
    },
  },
)

export const DOT = fnDist<[0, 0]>("dot product", {
  ty(a, b) {
    if (a.type == "complex" && b.type == "complex") {
      return "real"
    }
    return null
  },
  js(a, b) {
    if (a.type != "complex" || b.type != "complex") {
      return null
    }
    return {
      type: "real",
      value: ADD.real(
        MUL.real(a.value.x, b.value.x),
        MUL.real(a.value.y, NEG.real(b.value.y)),
      ),
    }
  },
  glsl(ctx, a, b) {
    if (a.type != "complex" || b.type != "complex") {
      return null
    }
    ctx.declare`float _helper_dot(vec2 a, vec2 b) {
  return dot(a, vec2(b.x, -b.y));
}
`
    return `_helper_dot(${a.expr}, ${b.expr})`
  },
})

export function getNamedFn(name: string) {
  if ({}.hasOwnProperty.call(NAMED_FNS, name)) {
    return NAMED_FNS[name]!
  }
}

export const OPS_BINARY: Partial<Record<PuncInfix | PuncPm, Fn<[0, 0]>>> = {
  "+": ADD,
  "-": SUB,
  "\\cdot ": MUL,
  "÷": DIV,
  "\\and ": AND,
  "\\or ": OR,
  mod: MOD,
  "\\odot ": ODOT,
  "\\times ": CROSS,
}

export const OPS_UNARY: Partial<Record<PuncUnary | PuncPm, Fn<[0]>>> = {
  "+": POS,
  "-": NEG,
}

const NAMED_FNS: Record<string, [number, Fn<0[]>]> = {
  debugquadrant: [1, DEBUGQUADRANT],
  rgb: [3, RGB],
  hsv: [3, HSV],
  unsign: [1, UNSIGN],
  real: [1, REAL],
  imag: [1, IMAG],
  exp: [1, EXP],
  ln: [1, LN],
  angle: [1, ANGLE],
  sin: [1, SIN],
  cos: [1, COS],
  tan: [1, TAN],
  dot: [2, DOT],
  magnitude: [1, ABS],
}
