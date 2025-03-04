import { faImage } from "@fortawesome/free-solid-svg-icons/faImage"
import type { Package } from "."
import type { Node } from "../eval/ast/token"
import { NO_DRAG } from "../eval/ast/tx"
import { FnDist } from "../eval/ops/dist"
import type { JsValue, Val } from "../eval/ty"
import { frac, real } from "../eval/ty/create"
import { Leaf } from "../field/cmd/leaf"
import { OpEq } from "../field/cmd/leaf/cmp"
import { CmdToken, TokenCtx } from "../field/cmd/leaf/token"
import { CmdWord } from "../field/cmd/leaf/word"
import { fa } from "../field/fa"
import { toText } from "../field/latex"
import { L, R } from "../field/model"
import { h, hx, path, svgx, t } from "../jsx"
import { FieldComputed } from "../sheet/deps"
import { type ItemFactory } from "../sheet/item"
import type { ItemRef } from "../sheet/items"

declare module "../eval/ast/token" {
  interface Nodes {
    image: { data: Val<"image"> }
  }
}

declare module "../eval/ty" {
  interface Tys {
    image: {
      src: string
      width: number
      height: number
    }
  }

  interface TyComponents {
    image: never
  }
}

export class CmdImgRaw extends Leaf {
  constructor(public data: Val<"image">) {
    super("", h(""))
  }

  reader(): string {
    return ""
  }

  ascii(): string {
    return ""
  }

  latex(): string {
    return `\\imgraw{${toText(this.data.src)}}`
  }

  ir(tokens: Node[]): true | void {
    tokens.push({ type: "image", data: this.data })
  }
}

class CmdImg extends Leaf {
  constructor(readonly src: string) {
    super(
      "",
      h(
        "relative inline-block size-24 border border-[--nya-border] rounded overflow-hidden align-middle",
        hx("img", {
          class: "absolute object-cover inset-0 size-24 blur scale-[120%]",
          src,
        }),
        hx("img", {
          class: "absolute object-contain inset-0 size-24",
          src,
        }),
      ),
    )
  }

  reader(): string {
    return " Image "
  }

  ascii(): string {
    return ""
  }

  latex(): string {
    return ""
  }

  ir(): true | void {}
}

interface Data {
  url: string | null
  id: number
  ref: ItemRef<Data>
  el: HTMLElement
  output: FieldComputed
}

const FACTORY: ItemFactory<Data> = {
  id: "nya:image",
  name: "image",
  icon: faImage,

  init(ref, source) {
    const msg = t("")

    const msgEl = h(
      "hidden [line-height:1] text-center absolute inset-x-2 z-10 bottom-1 bg-[--nya-bg] text-[--nya-expr-error] font-sans",
      h(
        "absolute bottom-full inset-x-0 from-[--nya-bg] to-transparent bg-gradient-to-t h-2",
      ),
      msg,
    )

    function setMsg(text: string) {
      if (text) {
        msgEl.classList.remove("hidden")
        msgEl.classList.add("block")
        msg.data = text
      } else {
        msgEl.classList.add("hidden")
        msgEl.classList.remove("block")
      }
    }

    const token =
      source && /^\d+$/.test(source) ?
        new CmdToken(+source, new TokenCtx(ref.list.sheet.scope))
      : CmdToken.new(ref.list.sheet.scope.ctx)

    const field = hx("input", {
      type: "file",
      accept: "image/*",
      class: "sr-only",
    })

    const none = h(
      "flex-1 flex items-center justify-center px-3 py-2 font-sans",
      "Click to upload an image.",
    )

    const img1 = hx(
      "img",
      "hidden absolute size-full inset-0 object-cover blur",
    )
    const img2 = hx("img", "hidden absolute size-full inset-0 object-contain")

    const output = new FieldComputed(ref.list.sheet.scope)

    const data: Data = {
      url: null,
      id: token.id,
      ref,
      output,
      el: h(
        "relative flex items-center pl-4 p-2",
        token.el,
        new OpEq(false).el,
        hx(
          "label",
          "relative flex h-32 min-w-32 flex-1 bg-[--nya-bg-sidebar] rounded border border-[--nya-border] overflow-hidden",
          field,
          none,
          img1,
          img2,
        ),
        msgEl,
      ),
    }

    let natWidth = 0
    let natHeight = 0

    function update() {
      output.onBeforeChange()
      output.block.clear()
      const cursor = output.block.cursor(R)
      token.clone().insertAt(cursor, L)
      new OpEq(false).insertAt(cursor, L)
      new CmdImgRaw({
        src: data.url ?? "",
        height: natHeight,
        width: natWidth,
      }).insertAt(cursor, L)
      output.onAfterChange(false)
      output.queueAstUpdate()
    }

    function check() {
      if (data.url == null) {
        setMsg("Select an image to import.")
        return
      }

      setMsg("")
    }

    check()
    update()

    img2.onload = () => {
      natWidth = img2.naturalWidth
      natHeight = img2.naturalHeight
      update()
    }

    field.addEventListener("copy", (event) => {
      event.preventDefault()
      navigator.clipboard.writeText(`\\token{${token.id}}`)
    })

    ref.elGrayBar.addEventListener("copy", (event) => {
      event.preventDefault()
      navigator.clipboard.writeText(`\\token{${token.id}}`)
    })

    field.addEventListener("change", () => {
      const file = field.files?.[0]
      field.value = ""
      if (!file) return

      const prev = data.url
      const next = URL.createObjectURL(file)
      data.url = next
      img1.src = img2.src = next
      none.classList.add("hidden")
      img1.classList.remove("hidden")
      img1.classList.add("block")
      img2.classList.remove("hidden")
      img2.classList.add("block")

      if (prev) {
        URL.revokeObjectURL(prev)
      }

      check()
    })

    data.el.addEventListener("click", () => {
      ref.focusAside()
    })

    if (source == null) {
      queueMicrotask(() => {
        ref.pasteBelow([`image(\\token{${token.id}},segment((-5,0),(5,0)))`])
      })
    }

    return data
  },
  aside() {
    return fa(faImage, "mx-auto size-6 mt-1 mb-1.5 fill-current")
  },
  main(data) {
    return data.el
  },
  encode(data) {
    return "" + data.id
  },
  unlink(data) {
    data.output.unlink()
  },
  focus() {
    // TODO:
  },
}

export const FN_IMGWIDTH = new FnDist(
  "imgwidth",
  "gets the natural width of an image",
).add(["image"], "r32", (a) => real(a.value.width), glsl)

export const FN_IMGHEIGHT = new FnDist(
  "imgheight",
  "gets the natural height of an image",
).add(["image"], "r32", (a) => real(a.value.height), glsl)

export const FN_IMGASPECT = new FnDist(
  "imgaspect",
  "gets the preferred aspect ratio of an image",
).add(["image"], "r32", (a) => frac(a.value.width, a.value.height), glsl)

export const PKG_IMAGE: Package = {
  id: "nya:image",
  name: "images",
  label: "upload and manipulate images",
  ty: {
    info: {
      image: {
        name: "image file",
        namePlural: "image files",
        coerce: {},
        garbage: {
          js: {
            src: "",
            width: 0,
            height: 0,
          },
          get glsl(): never {
            return glsl()
          },
        },
        get glsl(): never {
          return glsl()
        },
        write: {
          display(value, props) {
            if (value.src) {
              new CmdImg(value.src).insertAt(props.cursor, L)
            } else {
              new CmdWord("empty image", "var").insertAt(props.cursor, L)
            }
          },
          isApprox() {
            return false
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
              svgx(
                "0 0 6 6",
                "absolute top-1/2 left-1/2 size-[16px] -translate-x-1/2 -translate-y-1/2 fill-current",
                path(
                  `M 0 0 h 1 v 1 h -1 z M 0 1 h 1 v 1 h -1 z M 0 4 h 1 v 1 h -1 z M 0 5 h 1 v 1 h -1 z M 1 0 h 1 v 1 h -1 z M 2 2 h 1 v 1 h -1 z M 2 3 h 1 v 1 h -1 z M 2 5 h 1 v 1 h -1 z M 3 0 h 1 v 1 h -1 z M 3 3 h 1 v 1 h -1 z M 3 5 h 1 v 1 h -1 z M 4 0 h 1 v 1 h -1 z M 4 2 h 1 v 1 h -1 z M 4 5 h 1 v 1 h -1 z M 5 0 h 1 v 1 h -1 z M 5 1 h 1 v 1 h -1 z M 5 3 h 1 v 1 h -1 z M 5 5 h 1 v 1 h -1 z`,
                ),
              ),
            ),
          )
        },
        token(val) {
          return h(
            "",
            h(
              "text-[theme(colors.slate.500)] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block border-2 border-current relative rounded-[4px] overflow-hidden",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              hx("img", {
                class: "absolute inset-0 w-full h-full object-cover",
                src: val.src,
              }),
            ),
          )
        },
      },
    },
  },
  eval: {
    tx: {
      ast: {
        image: {
          deps() {},
          drag: NO_DRAG,
          js(node): JsValue<"image", false> {
            return { type: "image", value: node.data, list: false }
          },
          glsl() {
            return glsl()
          },
        },
      },
    },
    fn: {
      imgwidth: FN_IMGWIDTH,
      imgheight: FN_IMGHEIGHT,
      imgaspect: FN_IMGASPECT,
    },
  },
  sheet: {
    items: [FACTORY],
  },
}

export function glsl(): never {
  throw new Error("Cannot manipulate image data in shaders yet.")
}
