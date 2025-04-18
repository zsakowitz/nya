import type { Package } from "#/types"
import { CmdTextInert, type TextSegment } from "$/text"
import type { Fn } from "@/eval/ops"
import { FnDist } from "@/eval/ops/dist"
import { ALL_DOCS, type WithDocs } from "@/eval/ops/docs"
import { each, type JsVal, type JsValue, type Val } from "@/eval/ty"
import { Leaf } from "@/field/cmd/leaf"
import { OpEq } from "@/field/cmd/leaf/cmp"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { L } from "@/field/dir"
import { h, path, svgx } from "@/jsx"
import { defineExt } from "@/sheet/ext"
import { circle } from "@/sheet/ui/expr/circle"
import { affixes, roots } from "@zsnout/ithkuil/data"
import {
  caToIthkuil,
  geminatedCAToIthkuil,
  wordToIthkuil,
} from "@zsnout/ithkuil/generate"
import {
  isLegalConsonantForm,
  isLegalWordFinalConsonantForm,
  isLegalWordInitialConsonantForm,
} from "@zsnout/ithkuil/generate/phonotactics"
import { glossWord } from "@zsnout/ithkuil/gloss"
import { version } from "@zsnout/ithkuil/package.json"
import { parseWord, transformWord } from "@zsnout/ithkuil/parse"
import { CharacterRow, getBBox, textToScript } from "@zsnout/ithkuil/script"
import {
  createRecognizer,
  parseCaGloss,
  unglossWord,
} from "@zsnout/ithkuil/ungloss"
import * as categories from "./util-categories"

// TODO: reduce ithkuil root and affix data size (it's 56% of the bundle currently)

declare module "@/eval/ty" {
  interface Tys {
    ithkuilscript: readonly [string, SVGSVGElement]
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

const CATEGORIES_RAW = Object.entries(categories)
  .filter((x) => x[0].startsWith("ALL_"))
  .map(([k, v]) => {
    k = k.slice(4).toLowerCase()
    if (k.endsWith("s")) k = k.slice(0, -1)
    if (k == "slot_x_stresse") k = "slot_x_stress"
    if (k == "cases_skipping_degree_8") k = "case_skipping_degree_8"
    return [k.replace(/_/g, ""), v, k.replace(/_/g, " ")] as const
  })
  .filter(
    (a): a is readonly [string, string[] & any[], string] =>
      Array.isArray(a[1]) && a[1].every((x) => typeof x == "string"),
  )

const CATEGORIES: Record<string, string[]> = Object.fromEntries(CATEGORIES_RAW)

function valid(x: string) {
  return (
    /^[bcçčdḑfghjklļmnňprřsštţvwxyzžż]+$/.test(x) &&
    !x.split("").some((x, i, a) => a[i - 2] == a[i - 1] && a[i - 1] == x)
  )
}

const FN_ITHKUILVALUES: Fn & WithDocs = {
  name: "ithkuilvalues",
  label:
    "given the name of a grammatical category of ithkuil, returns all values it can take",
  docs() {
    return [
      {
        params: [{ type: "text", list: false }],
        dots: false,
        ret: { type: "text", list: true },
        usage: `ithkuilvalues(\\textinert{affiliation})=[${categories.ALL_AFFILIATIONS.map((x) => `\\textinert{${x}}`).join(", ")}]`,
      },
    ]
  },
  js(_ctx, args) {
    if (
      !(args.length == 1 && args[0]!.list === false && args[0]!.type == "text")
    ) {
      throw new Error(
        "The 'ithkuilvalues' function expects the name of a grammatical category.",
      )
    }
    const arg = args[0]! as JsVal<"text">

    const name = arg.value.map((x) => x.value).join("")
    const category = CATEGORIES[name.toLowerCase().replace(/[_.\s]/g, "")]
    if (!category) {
      throw new Error(`The category '${name}' doesn't exist.`)
    }
    return {
      type: "text",
      list: category?.length,
      value: category.map((x): Val<"text"> => [{ type: "plain", value: x }]),
    }
  },
  glsl: err,
}

ALL_DOCS.push(FN_ITHKUILVALUES)

export default {
  name: "ithkuil utilities",
  label:
    "parsing, text and script generation, and consonant cluster checking for the Ithkuil language",
  category: "miscellaneous",
  deps: ["text"],
  ty: {
    info: {
      ithkuilscript: {
        name: "ithkuil script",
        namePlural: "ithkuil scripts",
        get glsl(): never {
          return err()
        },
        toGlsl() {
          err()
        },
        garbage: {
          get js() {
            return ["", svgx("", "")] as const
          },
          get glsl(): never {
            return err()
          },
        },
        coerce: {},
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            new CmdIthkuilScript(value[0], value[1]).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
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
                path(
                  "M 8.449998474121093 -25.05 l 0 25 l -8.45 8.45 l 26.7 26.65 l 7.5 -7.5 l -25.5 -25.5 l 9.75 -9.7 l 0 -27.4 l -10 10 z",
                ),
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
  eval: {
    fn: {
      "ithkuil gloss": new FnDist(
        "ithkuilgloss",
        "glosses an ithkuil word",
      ).add(
        ["text"],
        "text",
        (a): TextSegment[] => {
          const sourceRaw = a.value.map((x) => x.value).join("")
          return sourceRaw
            .split(/[-\s]+/)
            .map((source): TextSegment => {
              const parsed = parseWord(source)
              if (!parsed) {
                throw new Error(`Failed to parse ${source}.`)
              }
              return { type: "plain", value: glossWord(parsed).short }
            })
            .flatMap((x, i) =>
              i == 0 ? [x] : [{ type: "plain", value: "\n" }, x],
            )
        },
        err,
        "ithkuilgloss(\\textinert{rraza})=\\textinert{S1-“🐈 cat (Felis catus)”-MFS}",
      ),
      "ithkuil ungloss": new FnDist(
        "ithkuilungloss",
        "unglosses an ithkuil word",
      ).add(
        ["text"],
        "text",
        (str): TextSegment[] => {
          const sourceRaw = str.value.map((x) => x.value).join("")
          return sourceRaw
            .split(/\s/)
            .map((source): TextSegment => {
              const recognized = recognize(source)
              const [a, b, c, d, e] = unglossWord(recognized.gloss)
              const unglossed = [c, b, d, e, a]
              const success = unglossed.filter((x) => x.type == "success")
              const error = unglossed.filter((x) => x.type == "error")
              if (success[0]) {
                return { type: "plain", value: wordToIthkuil(success[0].value) }
              } else if (error[0]) {
                throw new Error(error[0].reason)
              } else {
                throw new Error(`Failed to parse '${str}'.`)
              }
            })
            .flatMap((x, i) =>
              i == 0 ? [x] : [{ type: "plain", value: "\n" }, x],
            )
        },
        err,
        'ithkuilungloss(\\textinert{"cat"-MFS})=\\textinert{rraza}',
      ),
      "ithkuil script": new FnDist(
        "ithkuilscript",
        "converts an ithkuil word into script form",
      ).add(
        ["text"],
        "ithkuilscript",
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
              "fill-current",
              characters,
            ),
          ]
        },
        err,
        "ithkuilscript(\\textinert{rraza})",
      ),
      "ithkuil values": FN_ITHKUILVALUES,
      "ithkuil valid": new FnDist(
        "ithkuilvalid",
        "checks if a consonant form is valid according to ithkuil phonotactics",
      ).add(
        ["text"],
        "bool",
        (v) => {
          const val = transformWord(v.value.map((x) => x.value).join("")).word
          return valid(val) && isLegalConsonantForm(val)
        },
        err,
        [
          "ithkuilvalid(\\textinert{rz})=true",
          "ithkuilvalid(\\textinert{šzr})=false",
        ],
      ),
      "ithkuil valid initial": new FnDist(
        "ithkuilvalidinitial",
        "checks if a consonant form is valid word-initially according to ithkuil phonotactics",
      ).add(
        ["text"],
        "bool",
        (v) => {
          const val = transformWord(v.value.map((x) => x.value).join("")).word
          return valid(val) && isLegalWordInitialConsonantForm(val)
        },
        err,
        [
          "ithkuilvalid(\\textinert{rz})=false",
          "ithkuilvalid(\\textinert{pl})=true",
        ],
      ),
      "ithkuil valid final": new FnDist(
        "ithkuilvalidfinal",
        "checks if a consonant form is valid word-finally according to ithkuil phonotactics",
      ).add(
        ["text"],
        "bool",
        (v) => {
          const val = transformWord(v.value.map((x) => x.value).join("")).word
          return valid(val) && isLegalWordFinalConsonantForm(val)
        },
        err,
        [
          "ithkuilvalid(\\textinert{rz})=true",
          "ithkuilvalid(\\textinert{pl})=false",
        ],
      ),
      "ithkuil ca": new FnDist(
        "ithkuilca",
        "generates an ithkuil CA form, optionally geminated",
      )
        .add(
          ["text"],
          "text",
          (v) => {
            const val = v.value.map((x) => x.value).join("")
            const ca = parseCaGloss(val)
            return [{ type: "plain", value: caToIthkuil(ca) }]
          },
          err,
          "ithkuilca(\\textinert{ASO.MSC})=\\textinert{lk}",
        )
        .add(
          ["text", "bool"],
          "text",
          (v, b) => {
            const val = v.value.map((x) => x.value).join("")
            const ca = parseCaGloss(val)
            return [
              {
                type: "plain",
                value: b.value ? geminatedCAToIthkuil(ca) : caToIthkuil(ca),
              },
            ]
          },
          err,
          "ithkuilca(\\textinert{ASO.MSC},true)=\\textinert{lkk}",
        ),
    },
    var: {
      "ithkuil version": {
        label: "version of @zsnout/ithkuil currently in use",
        js: {
          type: "text",
          list: false,
          value: [{ type: "latex", value: version }],
        },
        get glsl(): never {
          return err()
        },
        display: true,
      },
      "ithkuil all": {
        label: "list of all grammatical categories in ithkuil",
        js: {
          type: "text",
          list: CATEGORIES_RAW.length,
          value: CATEGORIES_RAW.map(
            (name): Val<"text"> => [{ type: "plain", value: name[2] }],
          ),
        },
        get glsl(): never {
          return err()
        },
        display(prop) {
          new OpEq(false).insertAt(prop.cursor, L)
          let first = true
          for (const [, , name] of CATEGORIES_RAW) {
            if (first) {
              first = false
            } else {
              new CmdComma().insertAt(prop.cursor, L)
            }

            new CmdTextInert(name).insertAt(prop.cursor, L)
          }
        },
      },
    },
  },
  sheet: {
    exts: {
      1: [
        defineExt({
          data(expr) {
            if (expr.js?.value.type == "ithkuilscript") {
              return { expr, value: expr.js.value as JsValue<"ithkuilscript"> }
            }
          },
          aside() {
            return circle("ithkuilscript")
          },
          el(data) {
            const el = h(
              "flex flex-col gap-6 pb-4 -mt-2 [.nya-expr:has(&):not(:focus-within)_.nya-display]:sr-only [.nya-expr:has(&):not(:focus-within)_&]:py-3 [.nya-expr:has(&):not(:focus-within)_&]:mt-0",
              ...each(data.value).map((x) => {
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
            el.addEventListener("click", () => data.expr.field.el.focus())
            return el
          },
        }),
      ],
    },
  },
} satisfies Package

function err(): never {
  throw new Error("Ithkuil utilities do not work in shaders.")
}
