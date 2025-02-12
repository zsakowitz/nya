import { affixes, roots } from "@zsnout/ithkuil/data"
import { wordToIthkuil } from "@zsnout/ithkuil/generate"
import { glossWord } from "@zsnout/ithkuil/gloss"
import { parseWord } from "@zsnout/ithkuil/parse"
import { CharacterRow, getBBox, textToScript } from "@zsnout/ithkuil/script"
import { createRecognizer, unglossWord } from "@zsnout/ithkuil/ungloss"
import type { Package } from "."
import { FnDist } from "../eval/ops/dist"
import { each, type JsValue } from "../eval/ty"
import { Leaf } from "../field/cmd/leaf"
import { L } from "../field/model"
import { h, p, svgx } from "../jsx"
import { defineExt } from "../sheet/ext"

declare module "../eval/ty" {
  interface Tys {
    ikscript: readonly [string, SVGSVGElement]
  }

  interface TyComponents {
    ikscript: never
  }
}

class CmdIthkuilScript extends Leaf {
  constructor(
    readonly source: string,
    el: SVGSVGElement,
  ) {
    const hx = el.viewBox.baseVal.height
    const y = el.viewBox.baseVal.y + hx

    super(
      "\\ithkuil ",
      h(
        {
          class: "inline-block *:h-[--h]",
          style: `--h:${hx / 70}em;vertical-align:${-0.22 - (y - 35) / 70}em`,
        },
        el,
      ),
    )
  }

  reader(): string {
    return " IthkuilScript "
  }

  ascii(): string {
    return " IthkuilScript "
  }

  latex(): string {
    return " IthkuilScript "
  }

  ir(): true | void {}
}

const recognize = createRecognizer(affixes, roots)

export const PKG_ITHKUIL: Package = {
  id: "nya:ithkuil",
  name: "ithkuil utilities",
  label: "adds utilities for working with the language ithkuil",
  ty: {
    info: {
      ikscript: {
        name: "ithkuil script",
        namePlural: "ithkuil scripts",
        coerce: {},
        garbage: {
          get js() {
            return ["", svgx("", "")] as const
          },
          get glsl(): never {
            return err()
          },
        },
        get glsl(): never {
          return err()
        },
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            new CmdIthkuilScript(value[0], value[1]).insertAt(props.cursor, L)
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
                "-9.5367431640625e-7 -35.04999923706055 34.20000076293945 70.0999984741211",
                "absolute top-1/2 left-1/2 h-[90%] -translate-x-1/2 -translate-y-1/2 fill-current",
                p(
                  "M 8.449998474121093 -25.05 l 0 25 l -8.45 8.45 l 26.7 26.65 l 7.5 -7.5 l -25.5 -25.5 l 9.75 -9.7 l 0 -27.4 l -10 10 z",
                ),
              ),
            ),
          )
        },
      },
    },
  },
  eval: {
    fns: {
      ikgloss: new FnDist("ikgloss", "glosses an ithkuil word").add(
        ["text"],
        "text",
        (a) => {
          const source = a.value.map((x) => x.value).join("")
          const parsed = parseWord(source)
          if (!parsed) {
            throw new Error("Failed to parse word.")
          }
          return [{ type: "plain", value: glossWord(parsed).short }]
        },
        err,
      ),
      ikungloss: new FnDist("ikungloss", "unglosses an ithkuil word").add(
        ["text"],
        "text",
        (str) => {
          const source = str.value.map((x) => x.value).join("")
          const recognized = recognize(source)
          const [a, b, c, d, e] = unglossWord(recognized.gloss)
          const unglossed = [c, b, d, e, a]
          const success = unglossed.filter((x) => x.type == "success")
          const error = unglossed.filter((x) => x.type == "error")
          if (success[0]) {
            return [{ type: "plain", value: wordToIthkuil(success[0].value) }]
          } else if (error[0]) {
            throw new Error(error[0].reason)
          } else {
            throw new Error(`Failed to parse '${str}'.`)
          }
        },
        err,
      ),
      ikscript: new FnDist(
        "ikscript",
        "converts an ithkuil word into script form",
      ).add(
        ["text"],
        "ikscript",
        (str) => {
          const source = str.value.map((x) => x.value).join("")
          const result = textToScript(source, {
            handwritten: false,
            useCaseIllValDiacritics: true,
          })
          if (!result.ok) {
            throw new Error(result.reason)
          }
          const characters = CharacterRow({
            children: result.value,
            compact: false,
            space: 10, //+ renderedStrokeWidth,
          }) as SVGGElement
          const box = getBBox(characters)
          return [
            source,
            svgx(
              box.x + " " + box.y + " " + box.width + " " + box.height,
              "",
              characters,
            ),
          ]
        },
        err,
      ),
    },
  },
  sheet: {
    exts: {
      1: [
        defineExt({
          data(expr) {
            if (expr.js?.value.type == "ikscript") {
              return expr.js.value as JsValue<"ikscript">
            }
          },
          el(data) {
            return h(
              "flex flex-col gap-6 pb-4 -mt-2",
              ...each(data).map((x) => {
                const el = x[1]
                return h(
                  {
                    class: "px-4 inline-block *:h-[--h]",
                    style: `--h:${(el.viewBox.baseVal.height / 70) * 2}rem`,
                  },
                  el,
                )
              }),
            )
          },
        }),
      ],
    },
  },
}

function err(): never {
  throw new Error("Ithkuil utilities do not work in shaders.")
}
