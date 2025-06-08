import script from "!/color/core.nya"
import type { Package } from "#/types"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "@/eval/ops/vars"
import { CmdColor } from "@/field/cmd/leaf/color"
import { L } from "@/field/dir"
import { h } from "@/jsx"
import { ptnan, type SPoint } from "@/lib/point"
import { int, type SReal } from "@/lib/real"

declare module "@/eval/ty" {
  interface Tys {
    color: SPoint<4>
  }
}

export function plotJs(): never {
  throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
}

export default {
  name: "color functions core",
  label: "rgb and hsv functions",
  category: "color",
  deps: ["num/real", "bool"],
  scripts: [script],
  ty: {
    info: {
      color: {
        name: "color",
        namePlural: "colors",
        glsl: "vec4",
        toGlsl(v) {
          return v.gl32()
        },
        garbage: {
          js: ptnan(4),
          glsl: "vec4(0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.isApprox()
          },
          display(value, props) {
            const f = (x: SReal) => {
              const v = Math.min(
                255,
                Math.max(0, x.mul(int(255)).floor().num()),
              ).toString(16)
              if (v.length == 1) return "0" + v
              return v
            }

            new CmdColor(
              "#" + f(value.d[0]) + f(value.d[1]) + f(value.d[2]),
            ).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          function make(clsx: string) {
            return h(
              clsx,
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              palette(),
            )
          }

          function palette() {
            return h(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[18px] bg-[conic-gradient(hsl(360_100%_50%),hsl(315_100%_50%),hsl(270_100%_50%),hsl(225_100%_50%),hsl(180_100%_50%),hsl(135_100%_50%),hsl(90_100%_50%),hsl(45_100%_50%),hsl(0_100%_50%))] -rotate-90 rounded-full dark:opacity-50",
            )
          }

          return h(
            "",
            h(
              "size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] inline-block relative",
              make(
                "text-[#388c46] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px]",
              ),
              make(
                "text-[#2d70b3] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px] [mask-image:linear-gradient(#000,transparent)]",
              ),
              make(
                "text-[#c74440] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px] [mask-image:linear-gradient(to_right,#000,transparent)]",
              ),
              make(
                "text-[#fa7e19] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px] [mask-image:linear-gradient(45deg,#000,transparent,transparent)]",
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        extras: null,
      },
    },
  },
} satisfies Package
