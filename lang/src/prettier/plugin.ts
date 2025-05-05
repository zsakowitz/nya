import type { Parser, Printer, SupportLanguage } from "prettier"
import { builders } from "prettier/doc.js"
import { printVanilla } from "."
import type { List } from "../ast/node/extra"
import type { Node } from "../ast/node/node"
import { parse, parseBlockContents } from "../ast/parse"
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
  "nya-parse-block-contents": {
    parse(text) {
      const stream = createStream(text, { comments: true })
      const result = parseBlockContents(stream).of
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
    astFormat: "nya-ast-block-contents",
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
  "nya-ast-block-contents": {
    print(path) {
      return builders.join(
        builders.hardline,
        path.node.items.map((x: Node) =>
          printVanilla(x, (path.node as List<any>).bracket.source),
        ),
      )
    },
  } satisfies Printer,
}
