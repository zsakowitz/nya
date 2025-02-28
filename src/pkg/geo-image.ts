import { faImage } from "@fortawesome/free-regular-svg-icons"
import type { Package } from "."
import { FnDist } from "../eval/ops/dist"
import { each, type JsValue } from "../eval/ty"
import { num, SNANPT, unpt } from "../eval/ty/create"
import { TY_INFO } from "../eval/ty/info"
import { CmdComma } from "../field/cmd/leaf/comma"
import { CmdWord } from "../field/cmd/leaf/word"
import { CmdBrack } from "../field/cmd/math/brack"
import { fa } from "../field/fa"
import { Block, L, R } from "../field/model"
import { h, sx } from "../jsx"
import { defineExt } from "../sheet/ext"
import { mark, translate } from "./geo/fn/translate"
import { glsl } from "./image"

declare module "../eval/ty" {
  interface Tys {
    image2d: {
      data: Val<"image">
      p1: SPoint
      p2: SPoint
      aspect: SReal | null
    }
  }

  interface TyComponents {
    image2d: never
  }
}

const FN_IMAGE = new FnDist(
  "image",
  "draws an image on the graphpaper; pass a number to override the preferred aspect ratio",
)
  .add(
    ["image", "segment"],
    "image2d",
    (a, b) => ({ data: a.value, p1: b.value[0], p2: b.value[1], aspect: null }),
    glsl,
  )
  .add(
    ["image", "segment", "r32"],
    "image2d",
    (a, b, c) => ({
      data: a.value,
      p1: b.value[0],
      p2: b.value[1],
      aspect: c.value,
    }),
    glsl,
  )

const EXT = defineExt<JsValue<"image2d">>({
  data(expr) {
    if (expr.js?.value.type == "image2d") {
      return expr.js.value as JsValue<"image2d">
    }
  },
  svg(data, paper) {
    for (const val of each(data)) {
      const p1 = paper.toOffset(unpt(val.p1))
      const p2 = paper.toOffset(unpt(val.p2))
      const width = Math.hypot(p1.x - p2.x, p1.y - p2.y)
      const height =
        (val.aspect ? 1 / num(val.aspect) : val.data.height / val.data.width) *
        width
      paper.append(
        "image",
        sx("image", {
          href: val.data.src,
          width,
          height: Math.abs(height),
          x: p1.x,
          y: (p1.y - height) * Math.sign(height),
          transform:
            `rotate(${(180 / Math.PI) * Math.atan2(p2.y - p1.y, p2.x - p1.x)} ${p1.x} ${p1.y})` +
            (height < 0 ? " scale(1 -1)" : ""),
          preserveAspectRatio: "none",
        }),
      )
    }
  },
})

export const PKG_IMAGE_GEO: Package = {
  id: "nya:geo-image",
  name: "image objects",
  label: "on the graphpaper",
  ty: {
    info: {
      image2d: {
        name: "drawn image",
        namePlural: "drawn images",
        coerce: {
          image: {
            js(self) {
              return self.data
            },
            glsl,
          },
        },
        garbage: {
          js: {
            data: {
              src: "",
              width: 0,
              height: 0,
            },
            p1: SNANPT,
            p2: SNANPT,
            aspect: null,
          },
          get glsl(): never {
            return glsl()
          },
        },
        get glsl(): never {
          return glsl()
        },
        write: {
          isApprox(value) {
            return [value.p1.x, value.p1.y, value.p2.x, value.p2.y].some(
              (x) => x.type == "approx",
            )
          },
          display(value, props) {
            new CmdWord("image", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            TY_INFO.image.write.display(value.data, inner)
            new CmdComma().insertAt(inner.cursor, L)
            TY_INFO.segment.write.display([value.p1, value.p2], inner)
            if (value.aspect) {
              new CmdComma().insertAt(inner.cursor, L)
              inner.num(value.aspect)
            }
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        icon() {
          return h(
            "",
            h(
              "text-[theme(colors.slate.500)] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              fa(
                faImage,
                "absolute top-1/2 left-1/2 w-[16px] -translate-x-1/2 -translate-y-1/2 fill-current",
              ),
            ),
          )
        },
      },
    },
  },
  eval: {
    fn: {
      image: FN_IMAGE,
    },
  },
  sheet: {
    exts: { 1: [EXT] },
  },
}

mark(
  "image2d",
  (a, b) => ({
    data: a.value.data,
    aspect: a.value.aspect,
    p1: translate(b, a.value.p1),
    p2: translate(b, a.value.p2),
  }),
  glsl,
)
