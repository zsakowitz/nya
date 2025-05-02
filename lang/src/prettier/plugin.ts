import type { Parser, Printer, SupportLanguage } from "prettier"
import { printVanilla } from "."
import { parse } from "../ast/parse"
import { createStream } from "../ast/stream"

export const languages = [
  {
    name: "NyaLangScript",
    parsers: ["nya-parse"],
    extensions: [".nya"],
    vscodeLanguageIds: ["nya"],
  } satisfies SupportLanguage,
]

export const parsers = {
  "nya-parse": {
    parse(text) {
      const stream = createStream(text, { comments: true })
      const result = parse(stream)
      if (stream.issues.entries.length) {
        throw new Error(
          stream.issues.entries
            .map(
              (x) =>
                `${x} '${stream.source.slice(x.pos.start - 10, x.pos.end + 10)}'`,
            )
            .join("\n\n"),
        )
      }
      Object.assign(result, { source: text })
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
