import { fnDist, fnNum } from "./fn"
import { approx, frac, pt, real, safe } from "./ty/create"

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
      ctx.declare`vec2 _helper_mul(vec2 a, vec2 b) {
  return vec2(
    a.x * b.x - a.y * b.y,
    a.y * b.x + a.x * b.y
  );
}
`
      return `_helper_mul(${a}, ${b})`
    },
  },
)

export const DIV = fnNum<[0, 0]>(
  "·",
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
