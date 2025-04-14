import type { Package } from "#/types"
import { FN_VALID } from "$/bool"
import {
  OP_EQ,
  OP_GT,
  OP_GTE,
  OP_LT,
  OP_LTE,
  OP_NEQ,
  OP_NGT,
  OP_NGTE,
  OP_NLT,
  OP_NLTE,
} from "$/core/cmp"
import {
  abs64,
  addR64,
  chain,
  declareCmpR64,
  declareMulR64,
  FN_LN,
  FN_XPRODY,
  OP_ABS,
  OP_ADD,
  OP_CDOT,
  OP_CROSS,
  OP_DIV,
  OP_MOD,
  OP_NEG,
  OP_ODOT,
  OP_PLOTSIGN,
  OP_POS,
  OP_RAISE,
  OP_SUB,
  subR64,
} from "$/core/ops"
import type { FnSignature } from "@/docs/signature"
import { js } from "@/eval/ast/tx"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "@/eval/lib/base"
import { SYM_BINDINGS } from "@/eval/lib/binding"
import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import type { FnOverload, FnOverloadVar } from "@/eval/ops/dist-manual"
import { FnList } from "@/eval/ops/list"
import { unary } from "@/eval/sym"
import type { SReal, Ty, TyName, Type } from "@/eval/ty"
import { isZero } from "@/eval/ty/check"
import { approx, frac, gl, num, real } from "@/eval/ty/create"
import { gl64 } from "@/eval/ty/create-r64"
import type { TyWrite } from "@/eval/ty/display"
import { highRes, type TyExtras } from "@/eval/ty/info"
import { abs, add, div, mul, neg, raise, sub } from "@/eval/ty/ops"
import { splitDual } from "@/eval/ty/split"
import { h } from "@/jsx"

declare module "@/eval/ty" {
  interface Tys {
    r32: SReal
    r64: SReal
    rabs32: SReal
    rabs64: SReal
  }
}

function cmpJs(a: { value: SReal }, b: { value: SReal }) {
  const ar = num(a.value)
  const br = num(b.value)
  return (
    ar < br ? real(-1)
    : ar > br ? real(1)
    : real(0)
  )
}

function addCmp(
  fn: FnDist,
  js: (a: number, b: number) => boolean,
  glsl: `${"" | "!"}${"<" | ">" | "<=" | ">=" | "=="}`,
  glsl64: `${"==" | "!="} ${" 0.0" | " 1.0" | "-1.0"}`,
  latex: string,
) {
  const pre = glsl.startsWith("!") ? "!" : ""
  if (pre) glsl = glsl.slice(1) as any

  fn.add(
    ["r64", "r64"],
    "bool",
    (a, b) => js(num(a.value), num(b.value)),
    (ctx, a, b) => `(${FN_CMP.glsl1(ctx, a, b).expr} ${glsl64})`,
    [],
  ).add(
    ["r32", "r32"],
    "bool",
    (a, b) => js(num(a.value), num(b.value)),
    (_, a, b) => `(${pre}(${a.expr} ${glsl} ${b.expr}))`,
    `(2${latex}3)=${js(2, 3)}`,
  )
}

export const FN_EXP: FnDist = new FnDist("exp", "raises e to some value", {
  message: "Cannot raise e to the power of %%.",
  deriv: unary((props, a) =>
    chain(a, props, { type: "call", fn: FN_EXP, args: [a] }),
  ),
})

export const FN_UNSIGN = new FnDist(
  "unsign",
  "takes the absolute value of the components of a value",
  { message: "Cannot take the absolute value component-by-component of %%." },
)

const WRITE_REAL: TyWrite<SReal> = {
  isApprox(value) {
    return value.type == "approx"
  },
  display(value, props) {
    props.num(value)
  },
}

function iconReal(hd: boolean, text: "x" | "|x|") {
  return h(
    "",
    h(
      "text-[#000] dark:text-[#888] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px]" +
        (hd ? " border-double border-[3px]" : " border-2"),
      h(
        "opacity-25 block bg-current absolute " +
          (hd ? " -inset-[2px] rounded-[2px]" : "inset-0"),
      ),
      h(
        "absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_-_1px)] font-['Times_New_Roman'] italic text-[120%]",
        text,
      ),
      hd ? highRes() : null,
    ),
  )
}

const FN_CMP = new FnDist(
  "cmp",
  "compares two numbers, returning -1, 0, or 1, depending on whether the first number is less than, equal to, or greater than the second number",
  { message: "Cannot compare %%." },
)

FN_LN.add(
  ["r32"],
  "r32",
  (a) => approx(Math.log(num(a.value))),
  (_, a) => `log(${a.expr})`,
  "lne^2=2",
)

FN_XPRODY.add(
  ["r32", "r32"],
  "r32",
  (a, b) => {
    if (isNaN(num(b.value))) {
      return real(NaN)
    }

    if (isZero(a.value)) {
      return real(0)
    }

    return mul(a.value, b.value)
  },
  (ctx, ar, br) => {
    const a = ctx.cache(ar)
    const b = ctx.cache(br)
    return `(isnan(${b}) ? 0.0/0.0 : ${a} == 0.0 ? 0.0 : ${a} * ${b})`
  },
  [
    "2\\nyaop{xprody}3=2\\cdot3",
    "0*\\infty=\\digit N \\digit a \\digit N",
    "0\\nyaop{xprody}\\infty=0",
  ],
)

export const FN_SIGN = new FnDist("sign", "gets the sign of a number", {
  message: "Cannot find the sign of %%.",
})
  .add(
    ["r64"],
    "r64",
    (a) => real(Math.sign(num(a.value))),
    (ctx, a) => {
      declareCmpR64(ctx)
      return `vec2(_helper_cmp_r64(${a.expr}, vec2(0.0)), 0)`
    },
    [],
  )
  .add(
    ["r32"],
    "r32",
    (a) => real(Math.sign(num(a.value))),
    (_, a) => `sign(${a.expr})`,
    "sign(7.8)=1",
  )

export const FN_LOG10 = new FnDist(
  "log",
  "takes the base-10 logarithm of a value",
  { message: "Cannot take the base-10 logarithm of %%." },
).add(
  ["r32"],
  "r32",
  (a) => approx(Math.log10(num(a.value))),
  (_, a) => `(log(${a.expr}) / log(10.0))`,
  "log(10000)=4",
)

// TODO: implement for complex nums
const FN_LOGB = new FnDist(
  "log with subscript",
  "takes the logarithm of a value in some base",
  { message: "Cannot take the logarithm of %%." },
).add(
  ["r32", "r32"],
  "r32",
  (b, a) => approx(Math.log(num(a.value)) / Math.log(num(b.value))),
  (_, b, a) => `(log(${a.expr}) / log(${b.expr}))`,
  "log_216=4",
)

function mulR64(ctx: GlslContext, a: string, b: string) {
  declareMulR64(ctx)
  return `_helper_mul_r64(${a}, ${b})`
}

const FN_COUNT = new (class extends FnList<"r64"> {
  constructor() {
    super("count", "counts the size of a list")
  }

  docs(): FnSignature[] {
    return [
      {
        params: [{ type: "__any", list: true }],
        dots: false,
        ret: { type: "r64", list: false },
        usage: "count([7,9,4])=3",
      },
    ]
  }

  signature(args: Ty[]): FnOverload<"r64"> {
    return {
      params: args.map((x) => x.type),
      type: "r64",
      js() {
        return real(args.length)
      },
      glsl() {
        return `vec2(${args.length.toExponential()}, 0)`
      },
      docOrder: null,
      usage: [],
    }
  }

  trySignatureList(arg: Type<TyName, number>): FnOverloadVar<"r64"> {
    return {
      param: arg.type,
      type: "r64",
      js() {
        return real(arg.list)
      },
      glsl() {
        return `vec2(${arg.list.toExponential()}, 0)`
      },
      docOrder: null,
      usage: [],
    }
  }
})()

const extras: TyExtras<SReal> = {
  isOne(value) {
    return num(value) == 1
  },
  isZero(value) {
    return num(value) == 0
  },
  isNonZero(value) {
    return num(value) != 0
  },
}

export function declarePowR32(ctx: GlslContext) {
  ctx.glsl`float _nya_pow_r32(float a, float b) {
  if (a >= 0.0) {
    return pow(a, b);
  } else if (mod(b, 2.0) == 0.0) {
    return pow(abs(a), b);
  } else if (mod(b, 2.0) == 1.0) {
    return sign(a) * pow(abs(a), b);
  } else if (b == 1.0/0.0) {
    return abs(a) == 1.0 ? a : abs(a) < 1.0 ? sign(a) * 0.0 : sign(a) / 0.0;
  } else if (b == -1.0/0.0) {
    return abs(a) == 1.0 ? a : abs(a) < 1.0 ? sign(a) / 0.0 : sign(a) * 0.0;
  } else {
    return 0.0/0.0;
  }
}
`
}

export default {
  name: "real numbers",
  label: "support for real numbers",
  category: "numbers",
  load() {
    OP_ABS.add(
      ["r64"],
      "rabs64",
      (a) => abs(a.value),
      (ctx, a) => abs64(ctx, a.expr),
      [],
    ).add(
      ["r32"],
      "rabs32",
      (a) => abs(a.value),
      (_, a) => `abs(${a.expr})`,
      "|-3|=3",
    )

    OP_ADD.add(
      ["r64", "r64"],
      "r64",
      (a, b) => add(a.value, b.value),
      (ctx, a, b) => addR64(ctx, a.expr, b.expr),
      [],
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => add(a.value, b.value),
      (_, a, b) => `(${a.expr} + ${b.expr})`,
      "2+3=5",
    )

    OP_CROSS.add(
      ["r64", "r64"],
      "r64",
      (a, b) => mul(a.value, b.value),
      (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
      [],
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => mul(a.value, b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
      "2\\times3=6",
    )

    OP_DIV.add(
      ["r32", "r32"],
      "r32",
      (a, b) => div(a.value, b.value),
      (_, a, b) => `((${a.expr}) / (${b.expr}))`,
      "8÷-2=-4",
    )

    OP_MOD.add(
      ["r32", "r32"],
      "r32",
      (ar, br) => {
        const a = num(ar.value)
        const b = num(br.value)
        return approx(((a % b) + b) % b)
      },
      (ctx, a, b) => {
        ctx.glsl`float _helper_mod_r32(float a, float b) {
  return mod(mod(a, b) + b, b);
}
`
        return `_helper_mod_r32(${a.expr}, ${b.expr})`
      },
      ["17mod10=7", "-14mod3=1"],
    )

    OP_CDOT.add(
      ["r64", "r64"],
      "r64",
      (a, b) => mul(a.value, b.value),
      (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
      [],
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => mul(a.value, b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
      "2\\cdot3=6",
    )

    OP_NEG.add(
      ["r64"],
      "r64",
      (a) => neg(a.value),
      (_, a) => `(-${a.expr})`,
      [],
    ).add(
      ["r32"],
      "r32",
      (a) => neg(a.value),
      (_, a) => `(-${a.expr})`,
      "-(2)=-2",
    )

    OP_ODOT.add(
      ["r64", "r64"],
      "r64",
      (a, b) => mul(a.value, b.value),
      (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
      [],
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => mul(a.value, b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
      "2\\odot3=6",
    )

    OP_POS.add(
      ["r64"],
      "r64",
      (a) => a.value,
      (_, a) => a.expr,
      [],
    ).add(
      ["r32"],
      "r32",
      (a) => a.value,
      (_, a) => a.expr,
      "+3=3",
    )

    OP_RAISE.add(
      ["r32", "r32"],
      "r32",
      (a, b) => raise(a.value, b.value),
      (ctx, a, b) => {
        declarePowR32(ctx)
        return `_nya_pow_r32(${a.expr}, ${b.expr})`
      },
      ["2^3=8", "(-3)^4.3=\\wordvar{undefined}"],
    )

    OP_SUB.add(
      ["r64", "r64"],
      "r64",
      (a, b) => sub(a.value, b.value),
      (ctx, a, b) => subR64(ctx, a.expr, b.expr),
      [],
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => sub(a.value, b.value),
      (_, a, b) => `(${a.expr} - ${b.expr})`,
      "3-7=-4",
    )

    OP_PLOTSIGN.add(
      ["r64", "r64"],
      "r32",
      (a, b) => sub(a.value, b.value),
      (ctx, a, b) => subR64(ctx, a.expr, b.expr) + ".x",
      [],
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => sub(a.value, b.value),
      (_, a, b) => `(${a.expr} - ${b.expr})`,
      "3-7=-4",
    )

    FN_EXP.add(
      ["r32"],
      "r32",
      (a) => approx(Math.exp(num(a.value))),
      (_, a) => `exp(${a.expr})`,
      "exp(2)=e^2≈7.389",
    )

    FN_UNSIGN.add(
      ["r64"],
      "r64",
      (a) => abs(a.value),
      (ctx, a) => abs64(ctx, a.expr),
      [],
    ).add(
      ["r32"],
      "r32",
      (a) =>
        a.value.type == "approx" ?
          approx(Math.abs(a.value.value))
        : frac(Math.abs(a.value.n), Math.abs(a.value.d)),
      (_, a) => `abs(${a})`,
      "unsign(-7)=7",
    )

    FN_VALID.add(
      ["r32"],
      "bool",
      (a) => isFinite(num(a.value)),
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `(!isnan(${a}) && !isinf(${a}))`
      },
      ["valid(3)=true", "valid(∞)=false"],
    )

    addCmp(OP_LT, (a, b) => a < b, "<", "== -1.0", "<")
    addCmp(OP_GT, (a, b) => a > b, ">", "==  1.0", ">")

    addCmp(OP_LTE, (a, b) => a <= b, "<=", "!=  1.0", "\\leq ")
    addCmp(OP_GTE, (a, b) => a >= b, ">=", "!= -1.0", "\\geq ")

    addCmp(OP_NLT, (a, b) => !(a < b), "!<", "!= -1.0", "\\nless ")
    addCmp(OP_NGT, (a, b) => !(a > b), "!>", "!=  1.0", "\\ngtr ")

    addCmp(OP_NLTE, (a, b) => !(a <= b), "!<=", "==  1.0", "\\nleq ")
    addCmp(OP_NGTE, (a, b) => !(a >= b), "!>=", "== -1.0", "\\ngeq ")

    addCmp(OP_EQ, (a, b) => a == b, "==", "==  0.0", "=")
    addCmp(OP_NEQ, (a, b) => a != b, "!==", "!=  0.0", "\\neq ")

    FN_CMP.add(
      ["r64", "r64"],
      "r32",
      cmpJs,
      (ctx, a, b) => {
        // TODO: NaN probably outputs 0 in r64
        declareCmpR64(ctx)
        return `_helper_cmp_r64(${a.expr}, ${b.expr})`
      },
      [],
    ).add(
      ["r32", "r32"],
      "r32",
      cmpJs,
      (ctx, a, b) => {
        ctx.glsl`
float _helper_cmp_r32(float a, float b) {
  if (a < b) {
    return -1.0;
  } else if (a > b) {
    return 1.0;
  } else {
    return 0.0;
  }
}
`
        return `_helper_cmp_r32(${a.expr}, ${b.expr})`
      },
      ["cmp(7,9)=-1", "cmp(8,8)=0", "cmp(3,-8)=1"],
    )
  },
  deps: ["bool"],
  ty: {
    info: {
      r64: {
        name: "real number",
        namePlural: "real numbers",
        glsl: "vec2",
        toGlsl(val) {
          return gl64(val)
        },
        garbage: { js: real(NaN), glsl: "vec2(0.0/0.0)" },
        coerce: {
          r32: {
            js(self) {
              return self
            },
            glsl(self) {
              return `${self}.x`
            },
          },
        },
        write: WRITE_REAL,
        order: null,
        point: false,
        icon() {
          return iconReal(true, "x")
        },
        token: null,
        glide: null,
        preview: null,
        extras,
      },
      r32: {
        name: "real number",
        namePlural: "real numbers",
        glsl: "float",
        toGlsl(val) {
          return gl(val)
        },
        garbage: { js: real(NaN), glsl: "(0.0/0.0)" },
        coerce: {},
        write: WRITE_REAL,
        order: null,
        point: false,
        icon() {
          return iconReal(false, "x")
        },
        token: null,
        glide: null,
        preview: null,
        extras,
      },
      rabs64: {
        name: "positive real number",
        namePlural: "positive real numbers",
        glsl: "vec2",
        toGlsl(val) {
          return gl64(val)
        },
        garbage: { js: real(NaN), glsl: "vec2(0.0/0.0)" },
        coerce: {
          r32: {
            js: (x) => x,
            glsl: (x) => x + ".x",
          },
          r64: {
            js: (x) => x,
            glsl: (x) => x,
          },
          rabs32: {
            js: (x) => x,
            glsl: (x) => x + ".x",
          },
        },
        write: WRITE_REAL,
        order: null,
        point: false,
        icon() {
          return iconReal(true, "|x|")
        },
        token: null,
        glide: null,
        preview: null,
        extras,
      },
      rabs32: {
        name: "positive real number",
        namePlural: "positive real numbers",
        glsl: "float",
        toGlsl(val) {
          return gl(val)
        },
        garbage: { js: real(NaN), glsl: "(0.0/0.0)" },
        coerce: {
          r32: {
            js: (x) => x,
            glsl: (x) => x,
          },
        },
        write: WRITE_REAL,
        order: null,
        point: false,
        icon() {
          return iconReal(false, "|x|")
        },
        token: null,
        glide: null,
        preview: null,
        extras,
      },
    },
    coerce: {
      bool: {
        r32: {
          js(self) {
            return self ? real(1) : real(NaN)
          },
          glsl(self) {
            return `(${self} ? 1.0 : 0.0/0.0)`
          },
        },
        r64: {
          js(self) {
            return self ? real(1) : real(NaN)
          },
          glsl(self) {
            return `(${self} ? vec2(1, 0) : vec2(0.0/0.0))`
          },
        },
      },
    },
  },
  eval: {
    fn: {
      sign: FN_SIGN,
      sgn: FN_SIGN,
      ln: FN_LN,
      log: FN_LOG10,
      log_: FN_LOGB,
      exp: FN_EXP,
      unsign: FN_UNSIGN,
      valid: FN_VALID,
      cmp: FN_CMP,
      count: FN_COUNT,
    },
    var: {
      "π": splitDual(
        Math.PI,
        "ratio of any circle's circumference to its diameter",
      ),
      "τ": splitDual(
        Math.PI * 2,
        "ratio of any circle's circumference to its radius",
      ),
      "e": splitDual(Math.E, "euler's number"),
      "∞": {
        label: "limit as a number increases without bound",
        js: { type: "r64", value: real(Infinity), list: false },
        glsl: { type: "r64", expr: "vec2(1.0/0.0)", list: false },
        display: false,
      },
    },
    tx: {
      ast: {
        num: {
          js(node, props) {
            return parseNumberJs(
              node.value,
              node.sub ? asNumericBase(js(node.sub, props)) : props.base,
            )
          },
          sym(node, props) {
            return {
              type: "js",
              value: parseNumberJs(
                node.value,
                node.sub ?
                  asNumericBase(
                    js(node.sub, { ...props, bindingsJs: SYM_BINDINGS }),
                  )
                : props.base,
              ),
            }
          },
          glsl(node, props) {
            return parseNumberGlsl(
              node.value,
              node.sub ? asNumericBase(js(node.sub, props)) : props.base,
            )
          },
          drag: {
            num(node, props) {
              // TODO: restrict numbers in sliders
              if (node.span) {
                return {
                  span: node.span,
                  field: props.field,
                }
              }
              return null
            },
            point() {
              return null
            },
          },
          deps(node, deps) {
            if (node.sub) {
              deps.add(node.sub)
            }
            return
          },
        },
      },
    },
  },
} satisfies Package
