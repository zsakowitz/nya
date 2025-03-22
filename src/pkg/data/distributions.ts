import { FnDist } from "@/eval/ops/dist"
import { gl, real } from "@/eval/ty/create"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdBrack } from "@/field/cmd/math/brack"
import { Block, L, R } from "@/field/model"
import { g, h, path, svgx } from "@/jsx"
import type { Package } from ".."

declare module "@/eval/ty" {
  interface Tys {
    normaldist: [mean: SReal, stdev: SReal]
    tdist: SReal
    poissondist: SReal
    binomialdist: [trials: SReal, chance: SReal]
    uniformdist: [min: SReal, max: SReal]
  }

  interface TyComponents {
    normaldist: never
    tdist: never
    poissondist: never
    binomialdist: never
    uniformdist: never
  }
}

const normaldist = new FnDist("normaldist", "creates a normal distribution")
  .add(
    [],
    "normaldist",
    () => [real(0), real(1)],
    () => "vec2(0,1)",
  )
  .add(
    ["r32"],
    "normaldist",
    (a) => [a.value, real(1)],
    (_, a) => `vec2(${a.expr}, 1)`,
  )
  .add(
    ["r32", "r32"],
    "normaldist",
    (a, b) => [a.value, b.value],
    (_, a, b) => `vec2(${a.expr}, ${b.expr})`,
  )

const tdist = new FnDist("tdist", "creates a t-distribution").add(
  ["r32"],
  "tdist",
  (a) => a.value,
  (_, a) => a.expr,
)

const poissondist = new FnDist(
  "poissondist",
  "creates a Poisson distribution",
).add(
  ["r32"],
  "poissondist",
  (a) => a.value,
  (_, a) => a.expr,
)

const binomialdist = new FnDist(
  "binomialdist",
  "creates a binomial distribution",
)
  .add(
    ["r32"],
    "binomialdist",
    (a) => [a.value, real(0.5)],
    (_, a) => `vec2(${a.expr}, 0.5)`,
  )
  .add(
    ["r32", "r32"],
    "binomialdist",
    (a, b) => [a.value, b.value],
    (_, a, b) => `vec2(${a.expr}, ${b.expr})`,
  )

const uniformdist = new FnDist("uniformdist", "creates a uniform distribution")
  .add(
    [],
    "uniformdist",
    () => [real(0), real(1)],
    () => "vec2(0,1)",
  )
  .add(
    ["r32"],
    "uniformdist",
    (a) => [a.value, real(1)],
    (_, a) => `vec2(${a.expr}, 1)`,
  )
  .add(
    ["r32", "r32"],
    "uniformdist",
    (a, b) => [a.value, b.value],
    (_, a, b) => `vec2(${a.expr}, ${b.expr})`,
  )

// TODO: tokens for distributions

export const PKG_DISTRIBUTIONS: Package = {
  id: "nya:distributions",
  name: "statistical distributions",
  label: null,
  category: "data/statistics",
  ty: {
    info: {
      normaldist: {
        name: "normal distribution",
        namePlural: "normal distributions",
        glsl: "vec2",
        toGlsl([a, b]) {
          return `vec2(${gl(a)}, ${gl(b)})`
        },
        garbage: {
          js: [real(NaN), real(NaN)],
          glsl: "vec2(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display([mean, stdev], props) {
            new CmdWord("normaldist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(mean)
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(stdev)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                svgx(
                  "-3 -4.6768178153 6 4.734125137329102",
                  "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-[.68px] size-full",
                  path(
                    "M -3 -0.05318218079999999 C -2.6666961 -0.1063596624 -2.3314068 -0.21846021599999998 -2 -0.647891604 C -1.6685932 -1.07732298 -1.3239836 -1.9629140399999998 -1 -2.90364864 C -0.67601635 -3.8443833599999997 -0.33333333 -4.78730736 0 -4.78730736 C 0.33333333 -4.78730736 0.67601635 -3.8443833599999997 1 -2.90364864 C 1.3239836 -1.9629140399999998 1.6685932 -1.07732298 2 -0.647891604 C 2.3314068 -0.21846021599999998 2.6666961 -0.1063596624 3 -0.05318218079999999",
                  ),
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        components: null,
        extras: null,
      },
      tdist: {
        name: "t-distribution",
        namePlural: "t-distributions",
        glsl: "float",
        toGlsl(a) {
          return gl(a)
        },
        garbage: {
          js: real(NaN),
          glsl: "(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.type == "approx"
          },
          display(value, props) {
            new CmdWord("tdist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(value)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                svgx(
                  "-3 -4.6768178153 6 4.734125137329102",
                  "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-[.68px] size-full",
                  path(
                    "M -3 -0.05318218079999999 C -2.6666961 -0.1063596624 -2.3314068 -0.21846021599999998 -2 -0.647891604 C -1.6685932 -1.07732298 -1.3239836 -1.9629140399999998 -1 -2.90364864 C -0.67601635 -3.8443833599999997 -0.33333333 -4.78730736 0 -4.78730736 C 0.33333333 -4.78730736 0.67601635 -3.8443833599999997 1 -2.90364864 C 1.3239836 -1.9629140399999998 1.6685932 -1.07732298 2 -0.647891604 C 2.3314068 -0.21846021599999998 2.6666961 -0.1063596624 3 -0.05318218079999999",
                  ),
                  path(
                    "M -3 -0.238257564 C -2.6666767 -0.2693337 -2.3332784 -0.30875664 -2 -0.381390468 C -1.6667216 -0.454024284 -1.3325789 -0.539772312 -1 -0.808743228 C -0.66742112 -1.077714144 -0.33333333 -2.3697438 0 -2.3697438 C 0.33333333 -2.3697438 0.66742112 -1.077714144 1 -0.808743228 C 1.3325789 -0.539772312 1.6667216 -0.454024284 2 -0.381390468 C 2.3332784 -0.30875664 2.6666767 -0.2693337 3 -0.238257564",
                  ),
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        components: null,
        extras: null,
      },
      poissondist: {
        name: "Poisson distribution",
        namePlural: "Poisson distributions",
        glsl: "float",
        toGlsl(a) {
          return gl(a)
        },
        garbage: {
          js: real(NaN),
          glsl: "(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.type == "approx"
          },
          display(value, props) {
            new CmdWord("poissondist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(value)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
              h("opacity-25 block bg-current absolute inset-0"),
              h(
                "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                h(
                  "size-[3px] bg-current absolute rounded-full top-[9.0912045419%] left-[0%] -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-0 left-[16.7%] -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-[45.000001229%] left-1/3 -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-[79.8338526854%] left-1/2 -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-[94.4559481245%] left-2/3 -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-[98.7792161634%] left-[83.3%] -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-full left-full -translate-x-1/2 -translate-y-1/2",
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        components: null,
        extras: null,
      },
      binomialdist: {
        name: "binomial distribution",
        namePlural: "binomial distributions",
        glsl: "vec2",
        toGlsl([a, b]) {
          return `vec2(${gl(a)}, ${gl(b)})`
        },
        garbage: {
          js: [real(NaN), real(NaN)],
          glsl: "vec2(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display([a, b], props) {
            new CmdWord("binomialdist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(a)
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(b)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
              h("opacity-25 block bg-current absolute inset-0"),
              h(
                "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[100%] top-[85%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[83.3%] top-[40%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[66.6%] top-[0%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[50%] top-[11.1%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[33.3%] top-[55.6%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[16.7%] top-[88.15%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[0%] top-[98.68%]",
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        components: null,
        extras: null,
      },
      uniformdist: {
        name: "uniform distribution",
        namePlural: "uniform distributions",
        glsl: "vec2",
        toGlsl([a, b]) {
          return `vec2(${gl(a)}, ${gl(b)})`
        },
        garbage: {
          js: [real(NaN), real(NaN)],
          glsl: "vec2(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display([min, max], props) {
            new CmdWord("uniformdist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(min)
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(max)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                svgx(
                  "0 0 16 16",
                  "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-2 size-full",
                  path("M 0 16 h 4"),
                  path("M 4 0 h 8"),
                  path("M 12 16 h 4"),
                  g(
                    "[stroke-dasharray:0_4]",
                    path("M 4 0 v 16"),
                    path("M 12 0 v 16"),
                  ),
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        components: null,
        extras: null,
      },
    },
  },
  eval: {
    fn: {
      normaldist,
      tdist,
      poissondist,
      binomialdist,
      uniformdist,
    },
  },
}
