import type { Parser, Printer, SupportLanguage } from "prettier"
import { printVanilla } from "."
import { parse } from "../ast/parse"
import { createStream } from "../ast/stream"

export const languages = [
  {
    name: "NyaLangScript",
    parsers: ["nya-parse"],
extensions:['.nya'],
vscodeLanguageIds:['nya'],
  } satisfies SupportLanguage,
]

export const parsers = {
  "nya-parse": {
    parse(text) {
      const stream = createStream(text, { comments: false })
      const result = parse(stream)
      Object.assign(result, {source:text})
      return result
    },
    astFormat: "nya-ast",
    locStart(node) {
      return node.start
    },
    locEnd(node) {
      return node.end
    },
  } satisfies Parser,
}

export const printers = {
  "nya-ast": {
    print(path) {
      return printVanilla(path.node, path.root.source)
    },
  } satisfies Printer,
}
