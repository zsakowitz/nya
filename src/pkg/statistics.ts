import type { Package } from "."
import type { GlslContext } from "../eval/lib/fn"
import type { Fn } from "../eval/ops"
import { array, docByIcon, icon } from "../eval/ops/dist"
import { ALL_DOCS, type WithDocs } from "../eval/ops/docs"
import { FnList } from "../eval/ops/list"
import { abs } from "../eval/ops/op/abs"
import { add, addR64 } from "../eval/ops/op/add"
import { div } from "../eval/ops/op/div"
import { mul } from "../eval/ops/op/mul"
import { sub } from "../eval/ops/op/sub"
import { map, type SReal } from "../eval/ty"
import { canCoerce, coerceTyJs } from "../eval/ty/coerce"
import { frac, num, real } from "../eval/ty/create"
import { sqrt } from "./geo/fn/distance"
import { PKG_REAL } from "./num-real"

const FN_MIN = new FnList("min", "returns the minimum of its inputs").addSpread(
  "r32",
  "r32",
  (...args) =>
    args.length ?
      args.map((x) => x.value).reduce((a, b) => (num(b) < num(a) ? b : a))
    : real(NaN),
  (_, ...args) =>
    args.length ?
      args.map((x) => x.expr).reduce((a, b) => `min(${a}, ${b})`)
    : `(0.0/0.0)`,
)

const FN_MAX = new FnList("max", "returns the maximum of its inputs").addSpread(
  "r32",
  "r32",
  (...args) =>
    args.length ?
      args.map((x) => x.value).reduce((a, b) => (num(b) > num(a) ? b : a))
    : real(NaN),
  (_, ...args) =>
    args.length ?
      args.map((x) => x.expr).reduce((a, b) => `max(${a}, ${b})`)
    : `(0.0/0.0)`,
)

const FN_TOTAL = new FnList("total", "returns the sum of its inputs")
  .addSpread(
    "r64",
    "r64",
    (...args) => args.reduce((a, b) => add(a, b.value), real(0)),
    (ctx, ...args) =>
      args.length ?
        args.map((x) => x.expr).reduce((a, b) => addR64(ctx, a, b))
      : "vec2(0)",
  )
  .addSpread(
    "r32",
    "r32",
    (...args) => args.reduce((a, b) => add(a, b.value), real(0)),
    (_, ...args) => `(${args.map((x) => x.expr).join(" + ") || "0.0"})`,
  )

function meanJs(args: SReal[]): SReal {
  if (args.length == 0) {
    return real(NaN)
  }

  return div(
    args.reduce((a, b) => add(a, b), real(0)),
    frac(args.length, 1),
  )
}

function meanGlslR64(ctx: GlslContext, args: string[]): string {
  if (args.length == 0) {
    return `vec2(0.0/0.0)`
  }

  return `(${args.reduce((a, b) => addR64(ctx, a, b))} / vec2(${args.length}))`
}

function meanGlsl(args: string[]): string {
  if (args.length == 0) {
    return `(0.0/0.0)`
  }

  return `((${args.join(" + ")}) / ${args.length.toExponential()})`
}

const FN_MEAN = new FnList("mean", "takes the arithmetic mean of its inputs")
  .addSpread(
    "r64",
    "r64",
    (...args) => meanJs(args.map((x) => x.value)),
    (ctx, ...args) =>
      meanGlslR64(
        ctx,
        args.map((x) => x.expr),
      ),
  )
  .addSpread(
    "r32",
    "r32",
    (...args) => meanJs(args.map((x) => x.value)),
    (_, ...args) => meanGlsl(args.map((x) => x.expr)),
  )

function sortJs(args: SReal[]) {
  return args.sort((a, b) => num(a) - num(b))
}

function middleJs(value: SReal[]): SReal {
  if (value.length == 0) {
    return real(NaN)
  }

  if (value.length % 2) {
    return value[(value.length - 1) / 2]!
  }

  const lhs = value[value.length / 2 - 1]!
  const rhs = value[value.length / 2]!
  return div(add(lhs, rhs), real(2))
}

function raise(message: string) {
  return (): never => {
    throw new Error(message)
  }
}

const FN_MEDIAN = new FnList(
  "median",
  "takes the median of its inputs",
).addSpread(
  "r32",
  "r32",
  (...args) => middleJs(sortJs(args.map((x) => x.value))),
  raise("Cannot compute 'median' in shaders yet."),
)

const FN_QUARTILE: Fn & WithDocs = {
  js(...args) {
    if (
      !(
        args.length == 2 &&
        canCoerce(args[0]!.type, "r32") &&
        args[0]!.list !== false &&
        canCoerce(args[1]!.type, "r32")
      )
    ) {
      throw new Error("'quartile' expects a list and a quartile")
    }

    const list = coerceTyJs(args[0]!, "r32").value.slice()
    const quartile = coerceTyJs(args[1]!, "r32")

    if (list.length == 0) {
      return map(quartile, "r32", () => real(NaN))
    }
    sortJs(list)

    return map(quartile, "r32", (quartile) => {
      let q = num(quartile)
      if (!(0 <= q && q <= 4)) {
        return real(NaN)
      }

      q = Math.round(q)
      switch (q) {
        case 0:
          return list[0]!
        case 4:
          return list[list.length - 1]!
        case 2:
          return middleJs(list)
        case 1:
          if (list.length % 2) {
            return middleJs(list.slice(0, (list.length - 1) / 2))
          } else {
            return middleJs(list.slice(0, list.length / 2))
          }
        case 3:
          if (list.length % 2) {
            return middleJs(list.slice((list.length + 1) / 2))
          } else {
            return middleJs(list.slice(list.length / 2))
          }
      }

      return real(NaN)
    })
  },
  glsl: raise("Cannot compute 'quartile' in shaders yet."),
  name: "quartile",
  label: "computes a quartile of a data set",
  docs() {
    return [docByIcon([array(icon("r32")), icon("r32")], icon("r32"))]
  },
}

ALL_DOCS.push(FN_QUARTILE)

const FN_QUANTILE: Fn & WithDocs = {
  js(...args) {
    if (
      !(
        args.length == 2 &&
        canCoerce(args[0]!.type, "r32") &&
        args[0]!.list !== false &&
        canCoerce(args[1]!.type, "r32")
      )
    ) {
      throw new Error("'quantile' expects a list and a quantile")
    }

    const list = coerceTyJs(args[0]!, "r32").value.slice()
    const quantile = coerceTyJs(args[1]!, "r32")

    if (list.length == 0) {
      return map(quantile, "r32", () => real(NaN))
    }
    sortJs(list)

    return map(quantile, "r32", (quartile) => {
      let q = num(quartile)
      if (!(0 <= q && q <= 1)) {
        return real(NaN)
      }

      const mid = mul(quartile, frac(list.length - 1, 1))
      const lhs = Math.floor(num(mid))
      const rhs = Math.ceil(num(mid))

      if (lhs == rhs) {
        return list[lhs]!
      }

      return add(
        mul(sub(frac(rhs, 1), mid), list[lhs]!),
        mul(sub(mid, frac(lhs, 1)), list[rhs]!),
      )
    })
  },
  glsl: raise("Cannot compute 'quantile' in shaders yet."),
  name: "quantile",
  label: "computes a quantile of a data set",
  docs() {
    return [docByIcon([array(icon("r32")), icon("r32")], icon("r32"))]
  },
}

ALL_DOCS.push(FN_QUANTILE)

function varJs(args: SReal[], sample: boolean): SReal {
  if (args.length == 0 || (sample && args.length == 1)) {
    return real(NaN)
  }

  const mean = meanJs(args)

  const devs = args.reduce((a, b) => {
    const dev = sub(b, mean)
    return add(a, mul(dev, dev))
  }, real(0))

  return div(devs, frac(args.length - +sample, 1))
}

function varGlsl(ctx: GlslContext, args: string[], sample: boolean): string {
  if (args.length == 0 || (sample && args.length == 1)) {
    return `(0.0/0.0)`
  }

  const mean = ctx.cached("r32", meanGlsl(args))

  const devs = `(${args
    .map((b) => {
      const dev = ctx.cached("r32", `(${b} - ${mean})`)
      return `${dev} * ${dev}`
    })
    .join(" + ")})`

  return `(${devs} / ${(args.length - +sample).toExponential()})`
}

const FN_VAR = new FnList("var", "sample variance").addSpread(
  "r32",
  "r32",
  (...args) =>
    varJs(
      args.map((x) => x.value),
      true,
    ),
  (ctx, ...args) =>
    varGlsl(
      ctx,
      args.map((x) => x.expr),
      true,
    ),
)

const FN_VARP = new FnList("varp", "population variance").addSpread(
  "r32",
  "r32",
  (...args) =>
    varJs(
      args.map((x) => x.value),
      false,
    ),
  (ctx, ...args) =>
    varGlsl(
      ctx,
      args.map((x) => x.expr),
      false,
    ),
)

const FN_STDEV = new FnList("stdev", "sample standard deviation").addSpread(
  "r32",
  "r32",
  (...args) =>
    sqrt(
      varJs(
        args.map((x) => x.value),
        true,
      ),
    ),
  (ctx, ...args) =>
    `sqrt(${varGlsl(
      ctx,
      args.map((x) => x.expr),
      true,
    )})`,
)

const FN_STDEVP = new FnList(
  "stdevp",
  "population standard deviation",
).addSpread(
  "r32",
  "r32",
  (...args) =>
    sqrt(
      varJs(
        args.map((x) => x.value),
        false,
      ),
    ),
  (ctx, ...args) =>
    `sqrt(${varGlsl(
      ctx,
      args.map((x) => x.expr),
      false,
    )})`,
)

const FN_MAD = new FnList("mad", "mean absolute deviation").addSpread(
  "r32",
  "r32",
  (...args) => {
    if (args.length == 0) {
      return real(NaN)
    }

    const mean = meanJs(args.map((x) => x.value))

    const tad = args.reduce((a, b) => add(a, abs(sub(b.value, mean))), real(0))

    return div(tad, frac(args.length, 1))
  },
  (ctx, ...args) => {
    if (args.length == 0) {
      return `(0.0/0.0)`
    }

    const mean = ctx.cached("r32", meanGlsl(args.map((x) => x.expr)))

    const tad = args.map((a) => `abs(${a.expr} - ${mean})`).join(" + ")

    return `(${tad} / ${args.length.toExponential()})`
  },
)

export const PKG_STATISTICS: Package = {
  id: "nya:statistics",
  name: "statistics",
  label: "rudimentary statistics functions",
  deps: [() => PKG_REAL],
  eval: {
    fns: {
      min: FN_MIN,
      max: FN_MAX,
      total: FN_TOTAL,
      mean: FN_MEAN,
      median: FN_MEDIAN,
      quartile: FN_QUARTILE,
      quantile: FN_QUANTILE,
      var: FN_VAR,
      varp: FN_VARP,
      stdev: FN_STDEV,
      stdevp: FN_STDEVP,
      stddev: FN_STDEV,
      stddevp: FN_STDEVP,
      mad: FN_MAD,
    },
  },
}
