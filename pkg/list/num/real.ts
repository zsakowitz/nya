import script from "!/num/real.nya"
import type { Package } from "#/types"
import { chain } from "$/core/ops"
import { js } from "@/eval/ast/tx"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "@/eval/lib/base"
import { SYM_BINDINGS } from "@/eval/lib/binding"
import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import { unary } from "@/eval/sym"
import type { TyWrite } from "@/eval/ty/display"
import { highRes, type TyExtras } from "@/eval/ty/info"
import { splitDual } from "@/eval/ty/split"
import { h } from "@/jsx"
import { approx, int, type SReal } from "@/lib/real"

declare module "@/eval/ty" {
  interface Tys {
    r32: SReal
    r64: SReal
    rabs32: SReal
    rabs64: SReal
  }
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
    return value.isApprox()
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

export const FN_SIGN = new FnDist("sign", "gets the sign of a number", {
  message: "Cannot find the sign of %%.",
})

export const FN_LOG10 = new FnDist(
  "log",
  "takes the base-10 logarithm of a value",
  { message: "Cannot take the base-10 logarithm of %%." },
)

const extras: TyExtras<SReal> = {
  isOne(value) {
    return value.num() == 1
  },
  isZero(value) {
    return value.num() == 0
  },
  isNonZero(value) {
    return value.num() != 0
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
  deps: ["bool"],
  scripts: [script],
  ty: {
    info: {
      r64: {
        name: "real number",
        namePlural: "real numbers",
        glsl: "vec2",
        toGlsl(val) {
          return val.gl64()
        },
        garbage: { js: approx(NaN), glsl: "vec2(0.0/0.0)" },
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
          return val.gl32()
        },
        garbage: { js: approx(NaN), glsl: "(0.0/0.0)" },
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
          return val.gl64()
        },
        garbage: { js: approx(NaN), glsl: "vec2(0.0/0.0)" },
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
          return val.gl32()
        },
        garbage: { js: approx(NaN), glsl: "(0.0/0.0)" },
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
            return self ? int(1) : approx(NaN)
          },
          glsl(self) {
            return `(${self} ? 1.0 : 0.0/0.0)`
          },
        },
        r64: {
          js(self) {
            return self ? int(1) : approx(NaN)
          },
          glsl(self) {
            return `(${self} ? vec2(1, 0) : vec2(0.0/0.0))`
          },
        },
      },
    },
  },
  eval: {
    var: {
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
        js: { type: "r64", value: approx(Infinity), list: false },
        glsl: { type: "r64", expr: "vec2(1.0/0.0)", list: false },
        display: false,
      },
    },
    tx: {
      ast: {
        num: {
          label: "parses real numbers",
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
