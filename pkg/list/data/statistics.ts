import type { Package } from "#/types"
import type { FnSignature } from "@/docs/signature"
import type { Node } from "@/eval/ast/token"
import type { GlslContext } from "@/eval/lib/fn"
import type { JsContext } from "@/eval/lib/jsctx"
import type { Fn } from "@/eval/ops"
import { FnDist } from "@/eval/ops/dist"
import { ALL_DOCS, type WithDocs } from "@/eval/ops/docs"
import { issue } from "@/eval/ops/issue"
import { FnList } from "@/eval/ops/list"
import {
  each,
  join,
  map,
  type GlslValue,
  type JsValue,
  type SReal,
  type TyName,
  type Tys,
  type Val,
} from "@/eval/ty"
import {
  canCoerce,
  coerceTyJs,
  coerceValJs,
  coerceValueGlsl,
  coerceValueJs,
  split,
} from "@/eval/ty/coerce"
import { frac, num, real } from "@/eval/ty/create"
import { TY_INFO, type TyInfoByName } from "@/eval/ty/info"
import { abs, add, div, mul, sub } from "@/eval/ty/ops"
import { Leaf } from "@/field/cmd/leaf"
import { BRACKS } from "@/field/cmd/math/brack"
import { Block } from "@/field/model"
import { L, R } from "@/field/sides"
import { h, hx } from "@/jsx"
import { defineExt } from "@/sheet/ext"
import { addR64 } from "$/core/ops"
import { createMultiEval } from "$/eval"
import { sqrt } from "../geo/dcg/fn/distance"

declare module "@/eval/ty" {
  interface Tys {
    stats: [min: SReal, q1: SReal, median: SReal, q3: SReal, max: SReal]
  }
}

class FnListList implements Fn, WithDocs {
  readonly o: {
    a: TyName
    b: TyName
    ret: TyName
    js(a: JsValue<TyName, number>, b: JsValue<TyName, number>): Val
    glsl(
      ctx: GlslContext,
      a: GlslValue<TyName, number>,
      b: GlslValue<TyName, number>,
    ): string
    usage: string | string[]
  }[] = []

  constructor(
    readonly name: string,
    readonly label: string,
  ) {
    ALL_DOCS.push(this)
  }

  add<A extends TyName, B extends TyName, R extends TyName>(
    a: A,
    b: B,
    ret: R,
    js: (a: JsValue<A, number>, b: JsValue<B, number>) => Val<R>,
    glsl: (
      ctx: GlslContext,
      a: GlslValue<A, number>,
      b: GlslValue<B, number>,
    ) => string,
    usage: string | string[],
  ) {
    this.o.push({ a, b, ret, js, glsl, usage })
    return this
  }

  docs(): FnSignature[] {
    return this.o.map(({ a, b, ret, usage }) => ({
      params: [
        { type: a, list: true },
        { type: b, list: true },
      ],
      dots: false,
      ret: { type: ret, list: true },
      usage,
    }))
  }

  js(_ctx: JsContext, args: JsValue[]): JsValue {
    if (
      !(args.length == 2 && args[0]!.list !== false && args[1]!.list !== false)
    ) {
      throw new Error(`'${this.name}' expects two lists.`)
    }

    const a = args[0]!
    const b = args[1]!
    const list = Math.min(a.list, b.list)

    for (const o of this.o) {
      if (canCoerce(a.type, o.a) && canCoerce(b.type, o.b)) {
        return {
          list: false,
          type: o.ret,
          value: o.js(
            coerceValueJs(a, { type: o.a, list }),
            coerceValueJs(b, { type: o.b, list }),
          ),
        }
      }
    }

    throw new Error(
      `'${this.name}' cannot be called with lists of ${TY_INFO[a.type].namePlural} and ${TY_INFO[b.type].namePlural}`,
    )
  }

  glsl(ctx: GlslContext, args: GlslValue[]): GlslValue {
    if (
      !(args.length == 2 && args[0]!.list !== false && args[1]!.list !== false)
    ) {
      throw new Error(`'${this.name}' expects two lists.`)
    }

    const a = args[0]! as GlslValue<TyName, number>
    const b = args[1]! as GlslValue<TyName, number>
    const list = Math.min(a.list, b.list)

    for (const o of this.o) {
      if (canCoerce(a.type, o.a) && canCoerce(b.type, o.b)) {
        return {
          list: false,
          type: o.ret,
          expr: o.glsl(
            ctx,
            {
              expr: coerceValueGlsl(ctx, a, { type: o.a, list }),
              type: o.a,
              list,
            },
            {
              expr: coerceValueGlsl(ctx, b, { type: o.b, list }),
              type: o.b,
              list,
            },
          ),
        }
      }
    }

    throw new Error(
      `'${this.name}' cannot be called with lists of ${TY_INFO[a.type].namePlural} and ${TY_INFO[b.type].namePlural}`,
    )
  }
}

const FN_MIN = new FnList("min", "returns the minimum of its inputs")
  .addSpread(
    "r32",
    "r32",
    (args) =>
      args.length ?
        args.map((x) => x).reduce((a, b) => (num(b) < num(a) ? b : a))
      : real(NaN),
    (_, ...args) =>
      args.length ?
        args.map((x) => x.expr).reduce((a, b) => `min(${a}, ${b})`)
      : `(0.0/0.0)`,
    "min(8,2,9)=2", // DOCS: should min/max use the list-style addSpread convention or the rest parameter every-other-programming-language convention
  )
  .add(
    ["stats"],
    "r32",
    (a) => a.value[0],
    issue(
      "Cannot compute 'min' of a five-number statistical summary in shaders.",
    ),
    "min(stats([2,9,5,6]))=2",
  )

const FN_MAX = new FnList("max", "returns the maximum of its inputs")
  .addSpread(
    "r32",
    "r32",
    (args) =>
      args.length ?
        args.reduce((a, b) => (num(b) > num(a) ? b : a))
      : real(NaN),
    (_, ...args) =>
      args.length ?
        args.map((x) => x.expr).reduce((a, b) => `max(${a}, ${b})`)
      : `(0.0/0.0)`,
    "max(8,2,9)=9",
  )
  .add(
    ["stats"],
    "r32",
    (a) => a.value[4],
    issue(
      "Cannot compute 'max' of a five-number statistical summary in shaders.",
    ),
    "max(stats([2,9,5,6]))=9",
  )

export const FN_TOTAL = new FnList("total", "returns the sum of its inputs")
  .addSpread(
    "r64",
    "r64",
    (args) => args.reduce((a, b) => add(a, b), real(0)),
    (ctx, ...args) =>
      args.length ?
        args.map((x) => x.expr).reduce((a, b) => addR64(ctx, a, b))
      : "vec2(0)",
    [],
  )
  .addSpread(
    "r32",
    "r32",
    (args) => args.reduce((a, b) => add(a, b), real(0)),
    (_, ...args) => `(${args.map((x) => x.expr).join(" + ") || "0.0"})`,
    "total([8,2,9])=19",
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
    (args) => meanJs(args),
    (ctx, ...args) =>
      meanGlslR64(
        ctx,
        args.map((x) => x.expr),
      ),
    [],
  )
  .addSpread(
    "r32",
    "r32",
    (args) => meanJs(args),
    (_, ...args) => meanGlsl(args.map((x) => x.expr)),
    "mean([8,2,3,7])=5",
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

const FN_MEDIAN = new FnList("median", "takes the median of its inputs")
  .addSpread(
    "r32",
    "r32",
    (args) => middleJs(sortJs(args)),
    issue("Cannot compute 'median' in shaders yet."),
    "median([7,2,3])=3",
  )
  .add(
    ["stats"],
    "r32",
    (a) => a.value[2],
    issue(
      "Cannot compute 'median' of a five-number statistical summary in shaders.",
    ),
    "median(stats([7,2,3]))=3",
  )

function quartile<L extends number | false>(
  list: SReal[],
  quartile: JsValue<"r32", L>,
): JsValue<"r32", L> {
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
}

const FN_QUARTILE: Fn & WithDocs = {
  js(_ctx, args) {
    if (args.length != 2) {
      throw new Error("'quartile' expects a list and a quartile")
    }

    if (canCoerce(args[0]!.type, "stats") && canCoerce(args[1]!.type, "r32")) {
      return join(
        [coerceTyJs(args[0]!, "stats"), coerceTyJs(args[1]!, "r32")],
        "r32",
        ({ value: stats }, { value: quartileRaw }) => {
          const quartile = num(quartileRaw)

          if (!(0 <= quartile && quartile <= 4)) {
            return real(NaN)
          }

          return stats[Math.round(quartile)]!
        },
      )
    }

    if (
      !(
        canCoerce(args[0]!.type, "r32") &&
        args[0]!.list !== false &&
        canCoerce(args[1]!.type, "r32")
      )
    ) {
      throw new Error("'quartile' expects a list and a quartile")
    }

    return quartile(
      coerceTyJs(args[0]!, "r32").value.slice(),
      coerceTyJs(args[1]!, "r32"),
    )
  },
  glsl: issue("Cannot compute 'quartile' in shaders yet."),
  name: "quartile",
  label: "computes a quartile of a data set",
  docs(): FnSignature[] {
    return [
      {
        params: [
          { type: "r32", list: true },
          { type: "r32", list: false },
        ],
        dots: false,
        ret: { type: "r32", list: false },
        usage: ["quartile([8,2,9,0,1],1)=2", "quartile([8,2,9,0,1],3)=8"],
      },
    ]
  },
}

ALL_DOCS.push(FN_QUARTILE)

export const FN_QUANTILE = new (class extends FnDist {
  js(ctx: JsContext, args: JsValue[]): JsValue<keyof Tys> {
    if (
      args.length == 2 &&
      canCoerce(args[0]!.type, "r32") &&
      canCoerce(args[1]!.type, "r32")
    ) {
      if (args[0]!.list === false) {
        throw new Error(
          "The first argument to 'quantile' must be a list or distribution.",
        )
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
    }

    return super.js(ctx, args)
  }

  glsl(
    ctx: GlslContext,
    args: GlslValue[],
  ): GlslValue<keyof Tys, number | false> {
    if (
      args.length == 2 &&
      canCoerce(args[0]!.type, "r32") &&
      canCoerce(args[1]!.type, "r32")
    ) {
      if (args[0]!.list === false) {
        throw new Error(
          "The first argument to 'quantile' must be a list or distribution.",
        )
      }

      throw new Error("Cannot compute 'quantile' of a list in shaders yet.")
    }

    return super.glsl(ctx, args)
  }

  docs(): FnSignature[] {
    return [
      {
        params: [
          { type: "r32", list: true },
          { type: "r32", list: false },
        ],
        dots: false,
        ret: { type: "r32", list: false },
        usage: [
          "quantile([8,2,9,0,1],0.1)=0.4",
          "quantile([8,2,9,0,1],0.3)=1.2",
          "quantile([8,2,9,0,1],0.7)=6.8",
        ],
      },
      ...super.docs(),
    ]
  }
})(
  "quantile",
  "computes a quantile of a data set or the inverse CDF of a distribution",
)

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
  (args) => varJs(args, true),
  (ctx, ...args) =>
    varGlsl(
      ctx,
      args.map((x) => x.expr),
      true,
    ),
  "var([3,3.5,4,4.3,3.7])=0.245",
)

const FN_VARP = new FnList("varp", "population variance").addSpread(
  "r32",
  "r32",
  (args) => varJs(args, false),
  (ctx, ...args) =>
    varGlsl(
      ctx,
      args.map((x) => x.expr),
      false,
    ),
  "varp([3,3.5,4,4.3,3.7])=0.196",
)

function stdevJs(args: SReal[], sample: boolean) {
  return sqrt(varJs(args, sample))
}

function stdevGlsl(ctx: GlslContext, args: string[], sample: boolean) {
  return `sqrt(${varGlsl(ctx, args, sample)})`
}

const FN_STDEV = new FnList("stdev", "sample standard deviation").addSpread(
  "r32",
  "r32",
  (args) => stdevJs(args, true),
  (ctx, ...args) =>
    stdevGlsl(
      ctx,
      args.map((x) => x.expr),
      true,
    ),
  "stdev([3,3.5,4,4.3,3.7])≈0.49497",
)

const FN_STDEVP = new FnList(
  "stdevp",
  "population standard deviation",
).addSpread(
  "r32",
  "r32",
  (args) => stdevJs(args, false),
  (ctx, ...args) =>
    stdevGlsl(
      ctx,
      args.map((x) => x.expr),
      false,
    ),
  "stdevp([3,3.5,4,4.3,3.7])≈0.44272",
)

const FN_MAD = new FnList("mad", "mean absolute deviation").addSpread(
  "r32",
  "r32",
  (args) => {
    if (args.length == 0) {
      return real(NaN)
    }

    const mean = meanJs(args)
    const tad = args.reduce((a, b) => add(a, abs(sub(b, mean))), real(0))
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
  "mad([3,3.5,4,4.3,3.7])=0.36",
)

function covJs(a: SReal[], b: SReal[], sample: boolean) {
  if (a.length <= +sample) {
    return real(NaN)
  }

  const ma = meanJs(a)
  const mb = meanJs(b)

  return div(
    a.reduce((c, a, i) => add(c, mul(sub(a, ma), sub(b[i]!, mb))), real(0)),
    frac(a.length - +sample, 1),
  )
}

function covGlsl(
  ctx: GlslContext,
  a: GlslValue<"r32", number>,
  b: GlslValue<"r32", number>,
  sample: boolean,
) {
  if (a.list <= +sample) {
    return `(0.0/0.0)`
  }

  const ma = ctx.cached("r32", meanGlsl(split(a.list, a.expr)))
  const mb = ctx.cached("r32", meanGlsl(split(b.list, b.expr)))

  return `((${Array.from(
    { length: a.list },
    (_, i) => `(${a.expr}[${i}] - ${ma}) * (${b.expr}[${i}] - ${mb})`,
  ).join(" + ")}) / ${(a.list - +sample).toExponential()})`
}

const FN_COV = new FnListList("cov", "sample covariance").add(
  "r32",
  "r32",
  "r32",
  (a, b) => covJs(a.value, b.value, true),
  (ctx, a, b) => covGlsl(ctx, a, b, true),
  "cov([2,4,6,8,10],[12,11,8,3,1])=-15",
)

const FN_COVP = new FnListList("covp", "population covariance").add(
  "r32",
  "r32",
  "r32",
  (a, b) => covJs(a.value, b.value, false),
  (ctx, a, b) => covGlsl(ctx, a, b, false),
  "covp([2,4,6,8,10],[12,11,8,3,1])=-12",
)

const FN_CORR = new FnListList("corr", "Pearson correlation coefficient").add(
  "r32",
  "r32",
  "r32",
  ({ value: a }, { value: b }) =>
    div(covJs(a, b, true), mul(stdevJs(a, true), stdevJs(b, true))),
  (ctx, a, b) =>
    `(${covGlsl(ctx, a, b, true)} / (${stdevGlsl(ctx, split(a.list, a.expr), true)} * ${stdevGlsl(ctx, split(b.list, b.expr), true)}))`,
  "corr([2,4,6,8,10],[12,11,8,3,1])≈-0.975",
)

function ranksJs(data: SReal[]): SReal[] {
  const sorted = data
    .map((x, i) => ({ x: num(x), i }))
    .sort((a, b) => a.x - b.x)

  type Result = { position: number; count: number }
  const ret = Array<Result>(data.length)

  let last: { value: number; result: Result } | undefined
  for (let pos = 0; pos < sorted.length; pos++) {
    const { x, i } = sorted[pos]!

    if (last?.value === x) {
      ;(ret[i] = last.result).count++
    } else {
      const result: Result = { position: pos + 1, count: 1 }
      last = { value: x, result }
      ret[i] = result
      continue
    }
  }

  return ret.map((x) => frac(2 * x.position + (x.count - 1), 2))
}

// DCG: ranks is not available in standard dcg; should be in separate package
const FN_RANKS: Fn & WithDocs = {
  name: "ranks",
  label: "computes the rank of each element of a list",
  docs() {
    return [
      {
        params: [{ type: "r32", list: true }],
        dots: false,
        ret: { type: "r32", list: true },
        usage: "ranks([7,2,8,8,23])=[2,1,3.5,3.5,5]",
      },
    ]
  },
  js(_ctx, args) {
    const value =
      (
        args.length == 1 &&
        args[0]!.list !== false &&
        canCoerce(args[0]!.type, "r32")
      ) ?
        coerceTyJs(args[0]!, "r32").value
      : (
        args.length >= 1 &&
        args.every(
          (x): x is typeof x & { list: false } =>
            x.list === false && canCoerce(args[0]!.type, "r32"),
        )
      ) ?
        args.map((x) => coerceValJs(x, "r32").value)
      : issue("'ranks' expects a single list of real numbers.")()

    return {
      type: "r32",
      list: value.length,
      value: ranksJs(value),
    }
  },
  glsl: issue("Cannot compute 'ranks' in shaders yet."),
}

ALL_DOCS.push(FN_RANKS)

const FN_SPEARMAN = new FnListList(
  "spearman",
  "Spearman's rank correlation coefficient",
).add(
  "r32",
  "r32",
  "r32",
  ({ value: ar }, { value: br }) => {
    const a = ranksJs(ar)
    const b = ranksJs(br)
    return div(covJs(a, b, true), mul(stdevJs(a, true), stdevJs(b, true)))
  },
  issue("Cannot compute 'spearman' in shaders yet."),
  "spearman([2,4,6,8,10],[12,11,8,3,1])=-1",
)

export class CmdStats extends Leaf {
  constructor(readonly contents: [Block, Block, Block, Block, Block]) {
    super(
      "\\nyastats",
      h(
        "relative inline-block text-left nya-cmd-brack",
        h(
          `absolute bottom-[2px] left-0 top-0 ${BRACKS["{"].w}`,
          BRACKS["{"].html(),
        ),
        h(
          `my-[.1em] inline-block ${BRACKS["{"].mx} ${BRACKS["}"].mx}`,
          h(
            "inline-grid grid-cols-[auto,auto] gap-y-[.2em] align-middle items-baseline",
            ...["min", "Q1", "median", "Q3", "max"].flatMap((label, i) => [
              h(
                "inline-block py-[.1em] pr-[.4em] font-['Times_New_Roman']",
                label,
              ),
              h("inline-block py-[.1em]", contents[i]!.el),
            ]),
          ),
        ),
        h(
          `absolute bottom-[2px] right-0 top-0 ${BRACKS["}"].w}`,
          BRACKS["}"].html(),
        ),
      ),
    )
  }

  ascii(): string {
    return ""
  }

  latex(): string {
    return ""
  }

  ir(_tokens: Node[]): true | void {}

  reader(): string {
    return ` Five Statistic Summary\
, Min ${this.contents[0].reader()}\
, Q1 ${this.contents[1].reader()}\
, Median ${this.contents[2].reader()}\
, Q3 ${this.contents[3].reader()}\
, Max ${this.contents[4].reader()}\
, End Five Statistic Summary `
  }
}

const FN_STATS = new FnList(
  "stats",
  "computes a five-statistic summary",
).addSpread(
  "r32",
  "stats",
  (args) => {
    const { value } = quartile(args, {
      type: "r32",
      list: 5,
      value: [real(0), real(1), real(2), real(3), real(4)],
    })

    return value satisfies SReal[] as Tys["stats"]
  },
  issue("Cannot compute 'stats' in shaders yet."),
  "stats([2,4,3,7,8])",
)

const TY_STATS: TyInfoByName<"stats"> = {
  name: "five-number statistical summary",
  namePlural: "five-number statistical summaries",
  get glsl(): never {
    throw new Error(
      "Cannot create five-number statistical summaries in shaders.",
    )
  },
  toGlsl() {
    throw new Error(
      "Cannot create five-number statistical summaries in shaders.",
    )
  },
  garbage: {
    js: [real(NaN), real(NaN), real(NaN), real(NaN), real(NaN)],
    get glsl(): never {
      throw new Error(
        "Cannot create five-number statistical summaries in shaders.",
      )
    },
  },
  coerce: {},
  write: {
    isApprox(value) {
      return value.some((x) => x.type == "approx")
    },
    display(value, props) {
      new CmdStats(
        value.map((value) => {
          const block = new Block(null)
          props.at(block.cursor(R)).num(value)
          return block
        }) satisfies Block[] as any,
      ).insertAt(props.cursor, L)
    },
  },
  order: null,
  point: false,
  icon() {
    return h(
      "",
      h(
        "text-[#00786F] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        h(
          "absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_-_1.5px)] font-['Times_New_Roman'] italic text-[100%]",
          "Q",
          hx("sub", "", "x"),
        ),
      ),
    )
  },
  token: null,
  glide: null,
  preview: null,
  extras: null,
}

const store = createMultiEval(["Min", "Q1", "Median", "Q3", "Max"])

const EXT_STATS = defineExt({
  data(expr) {
    if (expr.js?.value.type == "stats") {
      return { expr, value: expr.js.value as JsValue<"stats"> }
    }
  },
  el({ expr, value }) {
    store.set(expr, each(value))
    return store.el(expr)
  },
})

export default {
  name: "statistics",
  label: "rudimentary statistics functions",
  category: "statistics",
  deps: ["num/real"],
  ty: {
    info: {
      stats: TY_STATS,
    },
  },
  eval: {
    fn: {
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
      cov: FN_COV,
      covp: FN_COVP,
      corr: FN_CORR,
      stats: FN_STATS,
      ranks: FN_RANKS,
      spearman: FN_SPEARMAN,
    },
  },
  sheet: {
    exts: {
      1: [EXT_STATS],
    },
  },
} satisfies Package
