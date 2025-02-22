import type { Package } from "."
import { js } from "../eval/js"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "../eval/lib/base"
import type { GlslContext } from "../eval/lib/fn"
import { safe } from "../eval/lib/util"
import { docByIcon, FnDist } from "../eval/ops/dist"
import {
  FnDistCaching,
  type FnOverload,
  type FnOverloadVar,
} from "../eval/ops/dist-manual"
import { ALL_DOCS } from "../eval/ops/docs"
import { FnList } from "../eval/ops/list"
import type { SReal, Ty, TyName, Type } from "../eval/ty"
import { canCoerce, coerceValJs } from "../eval/ty/coerce"
import { approx, frac, num, real } from "../eval/ty/create"
import type { TyWrite } from "../eval/ty/display"
import { highRes, TY_INFO } from "../eval/ty/info"
import { abs, add, div, mul, neg, raise, sub } from "../eval/ty/ops"
import { splitDual } from "../eval/ty/split"
import { h } from "../jsx"
import { FN_VALID, PKG_BOOL } from "./bool"
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
} from "./core-cmp"
import {
  abs64,
  addR64,
  declareCmpR64,
  declareMulR64,
  OP_ABS,
  OP_ADD,
  OP_CDOT,
  OP_CROSS,
  OP_DIV,
  OP_MOD,
  OP_NEG,
  OP_ODOT,
  OP_POS,
  OP_RAISE,
  OP_SUB,
  subR64,
} from "./core-ops"

declare module "../eval/ty" {
  interface Tys {
    r32: SReal
    r64: SReal
  }

  interface TyComponents {
    r32: never
    r64: never
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
) {
  const pre = glsl.startsWith("!") ? "!" : ""
  if (pre) glsl = glsl.slice(1) as any

  fn.add(
    ["r64", "r64"],
    "bool",
    (a, b) => js(num(a.value), num(b.value)),
    (ctx, a, b) => `(${FN_CMP.glsl1(ctx, a, b).expr} ${glsl64})`,
  ).add(
    ["r32", "r32"],
    "bool",
    (a, b) => js(num(a.value), num(b.value)),
    (_, a, b) => `(${pre}(${a.expr} ${glsl} ${b.expr}))`,
  )
}

export const FN_EXP = new FnDist("exp", "raises e to some value")

export const FN_UNSIGN = new FnDist(
  "unsign",
  "takes the absolute value of the components of a value",
)

const FN_COMPONENT = new (class extends FnDistCaching {
  constructor() {
    super("component", "gets a component of a multidimensional value")
    ALL_DOCS.push(this)
  }

  gen(args: Ty[]): FnOverload<TyName> {
    if (args.length != 2) {
      throw new Error("'component' expects two parameters.")
    }
    if (!canCoerce(args[1]!.type, "r32")) {
      throw new Error(
        "The second parameter to 'component' must be a real number.",
      )
    }

    const ty = args[0]!.type
    const info = TY_INFO[ty]
    const comps = info.components
    const name =
      info.namePlural.slice(0, 1).toUpperCase() + info.namePlural.slice(1)

    if (!comps) {
      throw new Error(`${name} do not have components.`)
    }

    return {
      params: [ty, args[1]!.type],
      type: comps.ty,
      js(a, b) {
        const val = num(coerceValJs(b, "r32").value) - 1
        let comp
        if (!(safe(val) && (comp = comps.at[val]))) {
          throw new Error(`${name} only have components 1-${comps.at.length}.`)
        }

        return comp[0](a.value as never)
      },
      glsl(_, a, b) {
        const STATIC_INDEX =
          /^(?:vec2\(([0-9e+-.]+), ?([0-9e+-.]+)\)\.x|(\d*.\d+|\d+.))$/
        const match = STATIC_INDEX.exec(b.expr)

        let staticIndex: number | null = null
        if (match) {
          if (match[1]) {
            const real = +match[1]
            const imag = +match[2]!
            if (imag == 0) {
              staticIndex = real
            }
          } else {
            staticIndex = +match[3]!
          }
        }

        if (staticIndex == null) {
          throw new Error(
            "The 'component' function's second argument must be a plain number in shaders; try 1 or 2 instead of computing a value.",
          )
        }

        staticIndex--

        if (
          !(
            safe(staticIndex) &&
            0 <= staticIndex &&
            staticIndex < comps.at.length
          )
        ) {
          throw new Error(`${name} only have components 1-${comps.at.length}.`)
        }

        return comps.at[staticIndex]![1](a.expr)
      },
    }
  }

  docs() {
    return Object.entries(TY_INFO)
      .filter((x) => x[1].components != null)
      .map(([_, info]) =>
        docByIcon(
          [info.icon(), TY_INFO.r32.icon()],
          TY_INFO[info.components!.ty].icon(),
        ),
      )
  }
})()

const WRITE_REAL: TyWrite<SReal> = {
  isApprox(value) {
    return value.type == "approx"
  },
  display(value, props) {
    props.num(value)
  },
}

function iconReal(hd: boolean) {
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
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Times_New_Roman'] italic text-[120%]",
        "x",
      ),
      hd ? highRes() : null,
    ),
  )
}

const FN_CMP = new FnDist(
  "cmp",
  "compares two numbers, returning -1, 0, or 1, depending on whether the first number is less than, equal to, or greater than the second number",
)

export const FN_LN = new FnDist(
  "ln",
  "takes the natural logarithm of a value",
).add(
  ["r32"],
  "r32",
  (a) => approx(Math.log(num(a.value))),
  (_, a) => `log(${a.expr})`,
)

export const FN_SIGN = new FnDist("sign", "gets the sign of a number")
  .add(
    ["r64"],
    "r64",
    (a) => real(Math.sign(num(a.value))),
    (ctx, a) => {
      declareCmpR64(ctx)
      return `_helper_cmp_r64(${a.expr}, vec2(0.0))`
    },
  )
  .add(
    ["r32"],
    "r32",
    (a) => real(Math.sign(num(a.value))),
    (_, a) => `sign(${a.expr})`,
  )

export const FN_LOG10 = new FnDist(
  "log",
  "takes the base-10 logarithm of a value",
).add(
  ["r32"],
  "r32",
  (a) => approx(Math.log10(num(a.value))),
  (_, a) => `(log(${a.expr}) / log(10.0))`,
)

function mulR64(ctx: GlslContext, a: string, b: string) {
  declareMulR64(ctx)
  return `_helper_mul_r64(${a}, ${b})`
}

export const PKG_REAL: Package = {
  id: "nya:num-real",
  name: "real numbers",
  label: "support for real numbers",
  init() {
    OP_ABS.add(
      ["r64"],
      "r64",
      (a) => abs(a.value),
      (ctx, a) => abs64(ctx, a.expr),
    ).add(
      ["r32"],
      "r32",
      (a) => abs(a.value),
      (_, a) => `abs(${a.expr})`,
    )

    OP_ADD.add(
      ["r64", "r64"],
      "r64",
      (a, b) => add(a.value, b.value),
      (ctx, a, b) => addR64(ctx, a.expr, b.expr),
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => add(a.value, b.value),
      (_, a, b) => `(${a.expr} + ${b.expr})`,
    )

    OP_CROSS.add(
      ["r64", "r64"],
      "r64",
      (a, b) => mul(a.value, b.value),
      (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => mul(a.value, b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
    )

    OP_DIV.add(
      ["r32", "r32"],
      "r32",
      (a, b) => div(a.value, b.value),
      (_, a, b) => `(${a.expr} / ${b.expr})`,
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
    )

    OP_CDOT.add(
      ["r64", "r64"],
      "r64",
      (a, b) => mul(a.value, b.value),
      (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => mul(a.value, b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
    )

    OP_NEG.add(
      ["r64"],
      "r64",
      (a) => neg(a.value),
      (_, a) => `(-${a.expr})`,
    ).add(
      ["r32"],
      "r32",
      (a) => neg(a.value),
      (_, a) => `(-${a.expr})`,
    )

    OP_ODOT.add(
      ["r64", "r64"],
      "r64",
      (a, b) => mul(a.value, b.value),
      (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => mul(a.value, b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
    )

    OP_POS.add(
      ["r64"],
      "r64",
      (a) => a.value,
      (_, a) => a.expr,
    ).add(
      ["r32"],
      "r32",
      (a) => a.value,
      (_, a) => a.expr,
    )

    OP_RAISE.add(
      ["r32", "r32"],
      "r32",
      (a, b) => raise(a.value, b.value),
      (_, a, b) => {
        return `pow(${a.expr}, ${b.expr})`
      },
    )

    OP_SUB.add(
      ["r64", "r64"],
      "r64",
      (a, b) => sub(a.value, b.value),
      (ctx, a, b) => subR64(ctx, a.expr, b.expr),
    ).add(
      ["r32", "r32"],
      "r32",
      (a, b) => sub(a.value, b.value),
      (_, a, b) => `(${a.expr} - ${b.expr})`,
    )

    FN_EXP.add(
      ["r32"],
      "r32",
      (a) => approx(Math.exp(num(a.value))),
      (_, a) => `exp(${a.expr})`,
    )

    FN_UNSIGN.add(
      ["r64"],
      "r64",
      (a) => abs(a.value),
      (ctx, a) => abs64(ctx, a.expr),
    ).add(
      ["r32"],
      "r32",
      (a) =>
        a.value.type == "approx" ?
          approx(Math.abs(a.value.value))
        : frac(Math.abs(a.value.n), Math.abs(a.value.d)),
      (_, a) => `abs(${a})`,
    )

    FN_VALID.add(
      ["r32"],
      "bool",
      (a) => isFinite(num(a.value)),
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `(!isnan(${a}) && !isinf(${a}))`
      },
    )

    addCmp(OP_LT, (a, b) => a < b, "<", "== -1.0")
    addCmp(OP_GT, (a, b) => a > b, ">", "==  1.0")

    addCmp(OP_LTE, (a, b) => a <= b, "<=", "!=  1.0")
    addCmp(OP_GTE, (a, b) => a >= b, ">=", "!= -1.0")

    addCmp(OP_NLT, (a, b) => !(a < b), "!<", "!= -1.0")
    addCmp(OP_NGT, (a, b) => !(a > b), "!>", "!=  1.0")

    addCmp(OP_NLTE, (a, b) => !(a <= b), "!<=", "==  1.0")
    addCmp(OP_NGTE, (a, b) => !(a >= b), "!>=", "== -1.0")

    addCmp(OP_EQ, (a, b) => a == b, "==", "==  0.0")
    addCmp(OP_NEQ, (a, b) => a != b, "!==", "==  0.0")

    FN_CMP.add(["r64", "r64"], "r32", cmpJs, (ctx, a, b) => {
      // TODO: NaN probably outputs 0 in r64
      declareCmpR64(ctx)
      return `_helper_cmp_r64(${a.expr}, ${b.expr})`
    }).add(["r32", "r32"], "r32", cmpJs, (ctx, a, b) => {
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
    })
  },
  deps: [() => PKG_BOOL],
  ty: {
    info: {
      r64: {
        name: "real number",
        namePlural: "real numbers",
        glsl: "vec2",
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
        icon() {
          return iconReal(true)
        },
      },
      r32: {
        name: "real number",
        namePlural: "real numbers",
        glsl: "float",
        garbage: { js: real(NaN), glsl: "(0.0/0.0)" },
        coerce: {},
        write: WRITE_REAL,
        icon() {
          return iconReal(false)
        },
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
    fns: {
      sign: FN_SIGN,
      ln: FN_LN,
      log: FN_LOG10,
      exp: FN_EXP,
      unsign: FN_UNSIGN,
      valid: FN_VALID,
      cmp: FN_CMP,
      component: FN_COMPONENT,
      count: new (class extends FnList<"r64"> {
        constructor() {
          super("count", "counts the size of a list")
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
          }
        }
      })(),
    },
    vars: {
      π: splitDual(
        Math.PI,
        "ratio of any circle's circumference to its diameter",
      ),
      τ: splitDual(
        Math.PI * 2,
        "ratio of any circle's circumference to its radius",
      ),
      e: splitDual(Math.E, "euler's number"),
      "∞": {
        label: "limit as a number increases without bound",
        js: { type: "r64", value: real(Infinity), list: false },
        glsl: { type: "r64", expr: "vec2(1.0/0.0)", list: false },
        display: false,
      },
    },
    txrs: {
      num: {
        js(node, props) {
          return parseNumberJs(
            node.value,
            node.sub ? asNumericBase(js(node.sub, props)) : props.base,
          )
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
}
