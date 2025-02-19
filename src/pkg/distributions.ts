import type { Package } from "."
import { real } from "../eval/ty/create"
import { jsOnly } from "../eval/ty/info"
import { h, p, svgx } from "../jsx"

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
                  "stroke-current fill-[#c7444040] overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-[.68px] size-full",
                  p(
                    `M ${data[0]![1]} ${-12 * +data[0]![2]}` +
                      data
                        .map(
                          ([, , , c, d, e, f, g, h]) =>
                            ` C ${c} ${-12 * +d} ${e} ${-12 * +f} ${g} ${-12 * +h}`,
                        )
                        .join(""),
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

const data: [
  "",
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  "",
][] = [
  [
    "",
    "-3",
    "0.0044318484",
    "-2.6666961",
    "0.0088633052",
    "-2.3314068",
    "0.018205018",
    "-2",
    "0.053990967",
    "",
  ],
  [
    "",
    "-2",
    "0.053990967",
    "-1.6685932",
    "0.089776915",
    "-1.3239836",
    "0.16357617",
    "-1",
    "0.24197072",
    "",
  ],
  [
    "",
    "-1",
    "0.24197072",
    "-0.67601635",
    "0.32036528",
    "-0.33333333",
    "0.39894228",
    "0",
    "0.39894228",
    "",
  ],
  [
    "",
    "0",
    "0.39894228",
    "0.33333333",
    "0.39894228",
    "0.67601635",
    "0.32036528",
    "1",
    "0.24197072",
    "",
  ],
  [
    "",
    "1",
    "0.24197072",
    "1.3239836",
    "0.16357617",
    "1.6685932",
    "0.089776915",
    "2",
    "0.053990967",
    "",
  ],
  [
    "",
    "2",
    "0.053990967",
    "2.3314068",
    "0.018205018",
    "2.6666961",
    "0.0088633052",
    "3",
    "0.0044318484",
    "",
  ],
]
