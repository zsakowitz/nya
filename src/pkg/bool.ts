import type { Package } from "."
import { FN_VALID } from "../eval/ops/fn/valid"
import { OP_AND } from "../eval/ops/op/and"
import { OP_OR } from "../eval/ops/op/or"
import { real } from "../eval/ty/create"
import { CmdWord } from "../field/cmd/leaf/word"
import { L } from "../field/model"
import { h } from "../jsx"

declare module "../eval/ty/index.js" {
  interface Tys {
    bool: boolean
  }

  interface TyComponents {
    bool: never
  }
}

OP_AND.add(
  ["bool", "bool"],
  "bool",
  (a, b) => a.value && b.value,
  (_, a, b) => `(${a.expr} && ${b.expr})`,
)

OP_OR.add(
  ["bool", "bool"],
  "bool",
  (a, b) => a.value || b.value,
  (_, a, b) => `(${a.expr} || ${b.expr})`,
)

export const PKG_BOOL: Package = {
  id: "nya:bool-ops",
  name: "boolean operations",
  label: "adds basic support for boolean values",
  ty: {
    info: {
      bool: {
        name: "true/false value",
        namePlural: "true/false values",
        glsl: "bool",
        garbage: { js: false, glsl: "false" },
        coerce: {
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
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            new CmdWord("" + value, "var").insertAt(props.cursor, L)
          },
        },
        icon() {
          return h(
            "",
            h(
              "size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] inline-block relative",
              h(
                "text-[#c74440] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px]",
                h(
                  "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
                ),
                h(
                  "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-[#388c46] rounded-full",
                ),
              ),
              h(
                "text-[#388c46] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px] [clip-path:polygon(100%_100%,100%_0%,0%_100%)]",
                h(
                  "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
                ),
                h(
                  "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#c74440] rounded-full",
                ),
              ),
            ),
          )
        },
      },
    },
  },
}

FN_VALID.add(
  ["bool"],
  "bool",
  () => true,
  () => "true",
)
