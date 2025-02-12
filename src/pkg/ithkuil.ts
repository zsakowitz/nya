import { affixes, roots } from "@zsnout/ithkuil/data"
import { wordToIthkuil } from "@zsnout/ithkuil/generate"
import { glossWord } from "@zsnout/ithkuil/gloss"
import { parseWord } from "@zsnout/ithkuil/parse"
import { createRecognizer, unglossWord } from "@zsnout/ithkuil/ungloss"
import type { Package } from "."
import { FnDist } from "../eval/ops/dist"

const recognize = createRecognizer(affixes, roots)

export const PKG_ITHKUIL: Package = {
  id: "nya:ithkuil",
  name: "ithkuil utilities",
  label: "adds utilities for working with the language ithkuil",
  eval: {
    fns: {
      ithkuilgloss: new FnDist("ithkuilgloss", "glosses an ithkuil word").add(
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
        () => {
          throw new Error("Ithkuil utilities do not work in shaders.")
        },
      ),
      ithkuilungloss: new FnDist(
        "ithkuilungloss",
        "unglosses an ithkuil word",
      ).add(
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
        () => {
          throw new Error("Ithkuil utilities do not work in shaders.")
        },
      ),
    },
  },
}
