import type { Package } from "."
import type { Fn } from "../eval/ops"
import { array, docByIcon, icon } from "../eval/ops/dist"
import { ALL_DOCS, type WithDocs } from "../eval/ops/docs"
import { FnList } from "../eval/ops/list"
import { add, addR64 } from "../eval/ops/op/add"
import { div } from "../eval/ops/op/div"
import { map, type SReal } from "../eval/ty"
import { canCoerce, coerceTyJs } from "../eval/ty/coerce"
import { frac, num, real } from "../eval/ty/create"
import { PKG_REAL } from "./num-real"

const min = new FnList("min", "returns the minimum of its inputs").addSpread(
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

const max = new FnList("max", "returns the maximum of its inputs").addSpread(
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

const total = new FnList("total", "returns the sum of its inputs")
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

const mean = new FnList("mean", "takes the arithmetic mean of its inputs")
  .addSpread(
    "r64",
    "r64",
    (...args) =>
      div(
        args.reduce((a, b) => add(a, b.value), real(0)),
        frac(args.length, 1),
      ),
    (ctx, ...args) =>
      `(${
        args.length ?
          args.map((x) => x.expr).reduce((a, b) => addR64(ctx, a, b))
        : "vec2(0)"
      } / vec2(${args.length}))`,
  )
  .addSpread(
    "r32",
    "r32",
    (...args) =>
      div(
        args.reduce((a, b) => add(a, b.value), real(0)),
        frac(args.length, 1),
      ),
    (_, ...args) =>
      `((${args.map((x) => x.expr).join(" + ") || "0.0"}) / ${args.length.toExponential()})`,
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

const median = new FnList("median", "takes the median of its inputs").addSpread(
  "r32",
  "r32",
  (...args) => middleJs(sortJs(args.map((x) => x.value))),
  raise("Cannot compute 'median' in shaders yet."),
)

const quartile: Fn & WithDocs = {
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

ALL_DOCS.push(quartile)

export const PKG_STATISTICS: Package = {
  id: "nya:statistics",
  name: "statistics",
  label: "rudimentary statistics functions",
  deps: [() => PKG_REAL],
  eval: {
    fns: {
      min,
      max,
      total,
      mean,
      median,
      quartile,
    },
  },
}
