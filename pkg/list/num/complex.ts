import type { Package } from "#/types"
import { plotJs } from "$/color/core"
import { FN_POINT } from "$/geo/point"
import { fn, type GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "@/eval/ops/vars"
import type { GlslVal } from "@/eval/ty"
import type { TyWrite } from "@/eval/ty/display"
import { highRes, type TyExtras } from "@/eval/ty/info"
import { h } from "@/jsx"
import { xy, xynan, type SComplex } from "@/lib/complex"
import { int } from "@/lib/real"
import { Order } from "@/sheet/ui/cv/consts"
import { declareOklab } from "../color/util-oklab"
import { FN_SIGN } from "./real"

declare module "@/eval/ty" {
  interface Tys {
    c32: SComplex
    c64: SComplex
  }
}

export function declareMulC32(ctx: GlslContext) {
  ctx.glsl`
vec2 _helper_mul_c32(vec2 a, vec2 b) {
  return vec2(
    a.x * b.x - a.y * b.y,
    a.y * b.x + a.x * b.y
  );
}
`
}

export function declarePowC32(ctx: GlslContext) {
  declareMulC32(ctx)
  declareExp(ctx)
  ctx.glsl`vec2 _helper_pow_c32(vec2 a, vec2 b) {
  if (a == vec2(0)) {
    return vec2(0);
  } else {
    vec2 ln_a = vec2(log(length(a)), atan(a.y, a.x));
    return _helper_exp(_helper_mul_c32(b, ln_a));
  }
}
`
}

function declareExp(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_exp(vec2 a) {
  return exp(a.x) * vec2(cos(a.y), sin(a.y));
}
`
}

export function declareLn(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_ln(vec2 z) {
  if (z == vec2(0)) {
    return vec2(-1.0 / 0.0, 0);
  }

  return vec2(log(length(z)), atan(z.y, z.x));
}
`
}

const FN_ARG = new FnDist(
  "arg",
  "returns the angle between a point and the x-axis",
)

const FN_COMPLEX = new FnDist(
  "complex",
  "converts a point into a complex number",
)

export const FN_CONJ = new FnDist(
  "conj",
  "takes the conjugate of a complex number or quaternion",
)

const FN_DOT = new FnDist("dot", "takes the dot product of two complex numbers")

const FN_IMAG = new FnDist(
  "imag",
  "gets the imaginary part of a complex number",
)

export const FN_I = new FnDist(
  ".i",
  "gets the coefficient of 'i' in a multi-dimensional number",
)

export const FN_REAL = new FnDist(
  "real",
  "gets the real part of a multi-dimensional number",
)

function cplotHue(ctx: GlslContext, a: GlslVal<"c32" | "point32">) {
  declareOklab(ctx)
  ctx.glsl`
float _nya_cplot_hue(vec2 z) {
  if (isinf(z.x) || isinf(z.y) || isnan(z.x) || isnan(z.y)) {
    return (0.0 / 0.0);
  }
  float angle = atan(z.y, z.x);
  float absval_scaled = length(z) / (length(z) + 1.0);
  float r0 = 0.08499547839164734 * 1.28;
  float offset = 0.8936868 * 3.141592653589793;
  float rd = 1.5*r0 * (1.0 - 2.0 * abs(absval_scaled - 0.5));
  return angle + offset;
}
`
  return `_nya_cplot_hue(${a.expr})`
}

const FN_CPLOTHUE = new FnDist(
  "cplothue",
  "gets the hue a complex number would be represented by when performing domain coloring",
)
  .add(["c32"], "r32", plotJs, cplotHue, "cplothue(2+3i)≈3.7904")
  .add(["point32"], "r32", plotJs, cplotHue, "cplothue((2,3))≈3.7904")

function cplot(ctx: GlslContext, a: GlslVal<"c32" | "point32">) {
  declareOklab(ctx)
  ctx.glsl`
vec4 _nya_cplot(vec2 z) {
  if (isinf(z.x) || isinf(z.y) || isnan(z.x) || isnan(z.y)) {
    return vec4(0);
  }
  float angle = atan(z.y, z.x);
  float absval_scaled = length(z) / (length(z) + 1.0);
  float r0 = 0.08499547839164734 * 1.28;
  float offset = 0.8936868 * 3.141592653589793;
  float rd = 1.5*r0 * (1.0 - 2.0 * abs(absval_scaled - 0.5));
  vec3 ok_coords = vec3(
    absval_scaled,
    rd * cos(angle + offset),
    rd * sin(angle + offset)
  );
  return vec4(_helper_oklab(ok_coords), 1);
}
`
  return `_nya_cplot(${a.expr})`
}

function cplotAbs(ctx: GlslContext, a: GlslVal<"rabs32">) {
  declareOklab(ctx)
  ctx.glsl`
vec4 _nya_cplot(float z) {
  if (isinf(z) || isnan(z)) {
    return vec4(0);
  }
  float absval_scaled = abs(z) / (abs(z) + 1.0);
  vec3 ok_coords = vec3(absval_scaled, 0, 0);
  vec3 rgb = _helper_oklab(ok_coords);
  return vec4(vec3(0), 1.0-rgb.x);
}
`
  return `_nya_cplot(${a.expr})`
}

const FN_CPLOT = new FnDist<"color">(
  "cplot",
  "gets the color a complex number would be represented by when performing domain coloring",
)
  .add(["rabs32"], "color", plotJs, cplotAbs, "cplot|2+3i|=\\color{#b8b8b8}")
  .add(["c32"], "color", plotJs, cplot, "cplot(2+3i)=\\color{#83c4d6}")
  .add(["point32"], "color", plotJs, cplot, "cplot((2,3))=\\color{#83c4d6}") // TODO: point32 logic in geo/point

const WRITE_COMPLEX: TyWrite<SComplex> = {
  isApprox(value) {
    return value.isApprox()
  },
  display(value, props) {
    props.nums([
      [value.x, ""],
      [value.y, "i"],
    ])
  },
}

const extras: TyExtras<SComplex> = {
  isOne(value) {
    return value.x.num() == 1 && value.y.zero()
  },
  isZero(value) {
    return value.x.zero() && value.y.zero()
  },
  isNonZero(value) {
    return !value.x.zero() || !value.y.zero()
  },
}

export function declareDiv(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_div(vec2 a, vec2 b) {
  return vec2(
    a.x * b.x + a.y * b.y,
    a.y * b.x - a.x * b.y
  ) / (b.x * b.x + b.y * b.y);
}
`
}

export const divGl = fn(["c32", "c32"], "c32")`return vec2(
  ${0}.x * ${1}.x + ${0}.y * ${1}.y,
  ${0}.y * ${1}.x - ${0}.x * ${1}.y
) / (${1}.x * ${1}.x + ${1}.y * ${1}.y);`

export const recipGl = fn(
  ["c32"],
  "c32",
)`return vec2(${0}.x, -${0}.y) / (${0}.x * ${0}.x + ${0}.y * ${0}.y);`

function iconComplex(hd: boolean) {
  return h(
    "",
    h(
      "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px]" +
        (hd ? " border-double border-[3px]" : " border-2"),
      h(
        "opacity-25 block bg-current absolute " +
          (hd ? " -inset-[2px] rounded-[2px]" : "inset-0"),
      ),
      h(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Times_New_Roman'] italic text-[120%]",
        "i",
      ),
      hd ? highRes() : null,
    ),
  )
}

export default {
  name: "complex numbers",
  label: "basic support for complex numbers",
  category: "numbers (multi-dimensional)",
  deps: ["num/real", "geo/point", "core/ops", "color/core", "bool"],
  scripts: ["complex", "gamma/gamma"],
  ty: {
    coerce: {
      r32: {
        c32: {
          js(self) {
            return xy(self, int(0))
          },
          glsl(self) {
            return `vec2(${self}, 0)`
          },
        },
      },
      r64: {
        c32: {
          js(self) {
            return xy(self, int(0))
          },
          glsl(self) {
            return `vec2(${self}.x, 0)`
          },
        },
        c64: {
          js(self) {
            return xy(self, int(0))
          },
          glsl(self) {
            return `vec4(${self}, 0, 0)`
          },
        },
      },
      bool: {
        c32: {
          js(self) {
            return self ? xy(int(1), int(0)) : xynan()
          },
          glsl(self) {
            return `(${self} ? vec2(1,0) : vec2(0.0/0.0))`
          },
        },
        c64: {
          js(self) {
            return self ? xy(int(1), int(0)) : xynan()
          },
          glsl(self) {
            return `(${self} ? vec4(1,0,0,0) : vec4(0.0/0.0))`
          },
        },
      },
    },
    info: {
      c64: {
        name: "complex number",
        namePlural: "complex numbers",
        glsl: "vec4",
        toGlsl(self) {
          return self.gl64()
        },
        garbage: { js: xynan(), glsl: "vec4(0.0/0.0)" },
        coerce: {
          c32: {
            js(self) {
              return self
            },
            glsl(self) {
              return `${self}.xz`
            },
          },
        },
        write: WRITE_COMPLEX,
        order: Order.Point,
        point: true,
        icon() {
          return iconComplex(true)
        },
        token: null,
        glide: null,
        preview: null,
        extras,
      },
      c32: {
        name: "complex number",
        namePlural: "complex numbers",
        glsl: "vec2",
        toGlsl(self) {
          return self.gl32()
        },
        garbage: { js: xynan(), glsl: "vec2(0.0/0.0)" },
        coerce: {},
        write: WRITE_COMPLEX,
        order: Order.Point,
        point: true,
        icon() {
          return iconComplex(false)
        },
        token: null,
        glide: null,
        preview: null,
        extras,
      },
    },
  },
  eval: {
    fn: {
      arg: FN_ARG,
      conj: FN_CONJ,
      imag: FN_IMAG,
      real: FN_REAL,
      sign: FN_SIGN,
      // DCG: dot doesn't exist for complex numbers in desmos
      dot: FN_DOT,
      // DCG: everything below doesn't exist in vanilla desmos
      complex: FN_COMPLEX,
      point: FN_POINT,
      ".i": FN_I,
      cplot: FN_CPLOT,
      cplothue: FN_CPLOTHUE,
    },
    var: {
      p: {
        label: "coordinates of currently drawn shader pixel",
        get js(): never {
          throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
        },
        glsl: { type: "c64", expr: "v_coords", list: false },
        dynamic: true,
        display: false,
      },
      i: {
        label: "unit vector perpendicular to number line; a square root of -1",
        js: { type: "c64", value: xy(int(0), int(1)), list: false },
        glsl: { type: "c64", expr: "vec4(0, 0, 1, 0)", list: false },
        display: false,
      },
    },
  },
} satisfies Package
