import type { Package } from "#/types"
import { imageShaderError } from "$/image"
import { example } from "@/docs/core"
import { FnDist } from "@/eval/ops/dist"
import { each, type JsValue, type Val } from "@/eval/ty"
import { TY_INFO } from "@/eval/ty/info"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdBrack } from "@/field/cmd/math/brack"
import { L, R } from "@/field/dir"
import { Block } from "@/field/model"
import { b, fa, h, px } from "@/jsx"
import { ptnan, type SPoint } from "@/lib/point"
import { frac, type SReal } from "@/lib/real"
import { defineExt } from "@/sheet/ext"
import type { Cv } from "@/sheet/ui/cv"
import { Order } from "@/sheet/ui/cv/consts"
import { faImage } from "@fortawesome/free-regular-svg-icons"
import { dilateJs, mark as markDilate } from "./dcg/util-fn/dilate"
import { mark as markReflect, reflectJs } from "./dcg/util-fn/reflect"
import { mark as markRotate, rotateJs } from "./dcg/util-fn/rotate"
import { mark as markTranslate, translate } from "./dcg/util-fn/translate"

declare module "@/eval/ty" {
  interface Tys {
    image2d: {
      data: Val<"image">
      p1: SPoint
      p2: SPoint
      aspect: SReal | null
    }
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
    imageShaderError,
    "image(\\ty{image},segment((-5,0),(5,0)))",
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
    imageShaderError,
    "image(\\ty{image},segment((-5,0),(5,0)),\\frac{16}{9})",
  )

function draw(cv: Cv, val: Val<"image2d">) {
  if (!val.data.src?.data) {
    return
  }

  const p1 = cv.toCanvas(val.p1.xy())
  const p2 = cv.toCanvas(val.p2.xy())
  const width = Math.hypot(p1.x - p2.x, p1.y - p2.y)
  const height =
    (val.aspect ? 1 / val.aspect.num() : val.data.height / val.data.width) *
    width

  const transform = new DOMMatrix()
  transform.translateSelf(p1.x, p1.y)
  transform.rotateSelf((180 / Math.PI) * Math.atan2(p2.y - p1.y, p2.x - p1.x))
  transform.translateSelf(-p1.x, -p1.y)
  if (height < 0) transform.scaleSelf(1, -1)
  cv.ctx.setTransform(transform)
  cv.ctx.drawImage(
    val.data.src.data,
    p1.x,
    (p1.y - height) * Math.sign(height),
    width,
    Math.abs(height),
  )
  cv.ctx.resetTransform()
}

const EXT = defineExt({
  data(expr) {
    if (expr.js?.value.type == "image2d") {
      return { value: expr.js.value as JsValue<"image2d">, expr }
    }
  },
  plot: {
    order() {
      return Order.Backdrop
    },
    items(data) {
      return each(data.value)
    },
    draw(data, val) {
      draw(data.expr.sheet.cv, val)
    },
  },
})

export default {
  name: "image objects",
  label: "on the graphpaper",
  category: "images",
  deps: ["image", "geo/point", "geo/dcg", "num/real"],
  ty: {
    info: {
      image2d: {
        name: "drawn image",
        namePlural: "drawn images",
        get glsl(): never {
          return imageShaderError()
        },
        toGlsl() {
          imageShaderError()
        },
        garbage: {
          js: {
            data: {
              src: null,
              width: 0,
              height: 0,
            },
            p1: ptnan(2),
            p2: ptnan(2),
            aspect: null,
          },
          get glsl(): never {
            return imageShaderError()
          },
        },
        coerce: {
          image: {
            js(self) {
              return self.data
            },
            glsl: imageShaderError,
          },
        },
        write: {
          isApprox(value) {
            return [value.p1.x, value.p1.y, value.p2.x, value.p2.y].some((x) =>
              x.isApprox(),
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
        order: Order.Backdrop,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-slate-500 size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-(--nya-bg) inline-block relative border-2 border-current rounded-[4px]",
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
        token: null,
        glide: null,
        preview: draw,
        extras: null,
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
  docs: [
    {
      name: "images",
      poster: String.raw`\operatorname{image}\left(i_{1},\operatorname{segment}\left(...\right)\right)`,
      render() {
        return [
          px`In project nya, images are expressions, just like everything else. To create one, select the ${b("image")} item type in the second-topmost navigation bar.`,
          px`To draw the image onto the graphpaper, use the ${b("image")} function.`,
          example(
            String.raw`\operatorname{image}\left(i_{1},\operatorname{segment}\left(\left(0,0\right),\left(1,0\right)\right)\right)`,
            null,
          ),
          px`The ${b("image")} function places an image on top of a line segment with its preferred aspect ratio, so it isn't distorted. If you want distortion, you can pass your own aspect ratio:`,
          example(
            String.raw`\operatorname{image}\left(i_{1},\operatorname{segment}\left(\left(0,0\right),\left(1,0\right)\right,\frac23\right)`,
            null,
          ),
          px`Negative values for the aspect ratio will draw a mirrored version of the image on the other side of the line segment.`,
        ]
      },
    },
  ],
} satisfies Package

markTranslate(
  "image2d",
  (a, b) => ({
    data: a.value.data,
    aspect: a.value.aspect,
    p1: translate(b, a.value.p1),
    p2: translate(b, a.value.p2),
  }),
  imageShaderError,
  "image(...)",
)

markRotate(
  "image2d",
  (a, b) => ({
    data: a.value.data,
    aspect: a.value.aspect,
    p1: rotateJs(b, a.value.p1),
    p2: rotateJs(b, a.value.p2),
  }),
  imageShaderError,
  "image(...)",
)

markDilate(
  "image2d",
  (a, b) => ({
    data: a.value.data,
    aspect: a.value.aspect,
    p1: dilateJs(b, a.value.p1),
    p2: dilateJs(b, a.value.p2),
  }),
  imageShaderError,
  "image(...)",
)

markReflect(
  "image2d",
  (a, b) => ({
    data: a.value.data,
    aspect:
      a.value.aspect ?
        a.value.aspect.neg()
      : frac(-a.value.data.width, a.value.data.height),
    p1: reflectJs(b, a.value.p1),
    p2: reflectJs(b, a.value.p2),
  }),
  imageShaderError,
  "image(...)",
)
