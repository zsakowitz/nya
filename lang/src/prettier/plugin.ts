import type { Doc, Parser, Printer, SupportLanguage } from "prettier"
import { builders } from "prettier/doc.js"
import { type K, type Subprint } from "."
import { List, PlainList } from "../ast/node/extra"
import { parse } from "../ast/parse"
import { createStream } from "../ast/stream"
import { print } from "./print"

const { group, indent, softline, ifBreak } = builders

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
          "Issues encountered: " + stream.issues.entries.join("\n"),
        )
      }

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
    print(path, _, sub) {
      const sb = Object.assign(
        (x: K): Doc => {
          return sub(x)
        },
        {
          source: path.root.source,
          all(k) {
            return path.map(sub, k)
          },
          sub(a, b) {
            return sub([a, b])
          },
          alt(k, ifNull) {
            return path.node[k] == null ? ifNull : sub(k)
          },
          opt(k) {
            return path.node[k] == null ? "" : sub(k)
          },
          as(node, f) {
            if (Array.isArray(node)) {
              return path.call(f, ...node)
            } else {
              return path.call(f, node)
            }
          },
          paren(k, force) {
            const next = path.node[k]

            if (next instanceof List || next instanceof PlainList) {
              return sub(k)
            }

            if (force) {
              return group(["(", indent([softline, sub(k)]), softline, ")"])
            }

            return group([
              ifBreak("("),
              indent([softline, sub(k)]),
              softline,
              ifBreak(")"),
            ])
          },
        } satisfies Pick<Subprint, keyof Subprint>,
      )
      return print(path.node, sb)
    },
  } satisfies Printer,
}
