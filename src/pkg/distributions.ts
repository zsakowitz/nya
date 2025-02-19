import type { Package } from "."
import { real } from "../eval/ty/create"
import { jsOnly } from "../eval/ty/info"
import { g, h, p, svgx } from "../jsx"

declare module "../eval/ty" {
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

export const PKG_DISTRIBUTIONS: Package = {
  id: "nya:distributions",
  name: "statistical distributions",
  label: null,
  ty: {
    info: {
      normaldist: jsOnly("Distributions are not supported in shaders yet.", {
        name: "normal distribution",
        namePlural: "normal distributions",
        coerce: {},
        garbage: [real(NaN), real(NaN)],
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display() {
            throw new Error("Cannot write 'normaldist' yet.")
          },
        },
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
                  p(D_NORMALDIST),
                ),
              ),
            ),
          )
        },
      }),
      tdist: jsOnly("Distributions are not supported in shaders yet.", {
        name: "t-distribution",
        namePlural: "t-distributions",
        coerce: {},
        garbage: real(NaN),
        write: {
          isApprox(value) {
            return value.type == "approx"
          },
          display() {
            throw new Error("Cannot write 'tdist' yet.")
          },
        },
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
                  p(D_NORMALDIST),
                  p(D_TDIST1),
                  // p(D_TDIST2),
                ),
              ),
            ),
          )
        },
      }),
      poissondist: jsOnly("Distributions are not supported in shaders yet.", {
        name: "Poisson distribution",
        namePlural: "Poisson distributions",
        coerce: {},
        garbage: real(NaN),
        write: {
          isApprox(value) {
            return value.type == "approx"
          },
          display() {
            throw new Error("Cannot write 'poissondist' yet.")
          },
        },
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
      }),
      binomialdist: jsOnly("Distributions are not supported in shaders yet.", {
        name: "binomial distribution",
        namePlural: "binomial distributions",
        coerce: {},
        garbage: [real(NaN), real(NaN)],
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display() {
            throw new Error("Cannot write 'binomialdist' yet.")
          },
        },
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
      }),
      uniformdist: jsOnly("Distributions are not supported in shaders yet.", {
        name: "uniform distribution",
        namePlural: "uniform distributions",
        coerce: {},
        garbage: [real(NaN), real(NaN)],
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display() {
            throw new Error("Cannot write 'uniform' yet.")
          },
        },
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
                  p("M 0 16 h 4"),
                  p("M 4 0 h 8"),
                  p("M 12 16 h 4"),
                  g(
                    "[stroke-dasharray:0_4]",
                    p("M 4 0 v 16"),
                    p("M 12 0 v 16"),
                  ),
                ),
              ),
            ),
          )
        },
      }),
    },
  },
}

const D_NORMALDIST =
  "M -3 -0.05318218079999999 C -2.6666961 -0.1063596624 -2.3314068 -0.21846021599999998 -2 -0.647891604 C -1.6685932 -1.07732298 -1.3239836 -1.9629140399999998 -1 -2.90364864 C -0.67601635 -3.8443833599999997 -0.33333333 -4.78730736 0 -4.78730736 C 0.33333333 -4.78730736 0.67601635 -3.8443833599999997 1 -2.90364864 C 1.3239836 -1.9629140399999998 1.6685932 -1.07732298 2 -0.647891604 C 2.3314068 -0.21846021599999998 2.6666961 -0.1063596624 3 -0.05318218079999999"

const D_TDIST1 =
  "M -3 -0.238257564 C -2.6666767 -0.2693337 -2.3332784 -0.30875664 -2 -0.381390468 C -1.6667216 -0.454024284 -1.3325789 -0.539772312 -1 -0.808743228 C -0.66742112 -1.077714144 -0.33333333 -2.3697438 0 -2.3697438 C 0.33333333 -2.3697438 0.66742112 -1.077714144 1 -0.808743228 C 1.3325789 -0.539772312 1.6667216 -0.454024284 2 -0.381390468 C 2.3332784 -0.30875664 2.6666767 -0.2693337 3 -0.238257564"
