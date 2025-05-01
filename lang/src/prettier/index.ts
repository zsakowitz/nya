import type { Doc } from "prettier"
import { builders } from "prettier/doc.js"
import { List, PlainList } from "../ast/node/extra"
import { Node } from "../ast/node/node"
import { Token } from "../ast/token"
import { print } from "./print"

const { group, indent, softline, ifBreak } = builders

export function printVanilla(node: Node) {
  let current = node

  function go(next: Token<number> | Node | unknown) {
    if (next instanceof Token) {
      return next.val
    }

    if (next instanceof Node) {
      const prev = current
      current = next
      try {
        return print(next, sp)
      } finally {
        current = prev
      }
    }

    return "<invalid>"
  }

  function sp(k: keyof any): Doc {
    return go((current as any)[k])
  }

  sp.alt = (k: keyof any, v: Doc): Doc => {
    let next: any = (current as any)[k]
    if (next == null && v !== undefined) {
      return v
    }

    return go(next)
  }

  sp.opt = (k: keyof any): Doc => {
    let next: any = (current as any)[k]
    if (next == null) {
      return ""
    }

    return go(next)
  }

  sp.sub = (a: keyof any, b: keyof any): Doc => {
    return go((current as any)[a][b])
  }

  sp.all = (k: keyof any): Doc[] => {
    const r: Doc[] = []
    const prev = current
    try {
      const children: Node[] = (current as any)[k]
      for (const child of children) {
        current = child
        r.push(print(child, sp))
      }
    } finally {
      current = prev
    }
    return r
  }

  sp.paren = (k: keyof any, force: boolean): Doc => {
    const doc = go((current as any)[k])

    if (doc instanceof List || doc instanceof PlainList) {
      return doc
    }

    if (force) {
      return group(["(", indent([softline, doc]), softline, ")"])
    }

    return group([
      ifBreak("("),
      indent([softline, doc]),
      softline,
      ifBreak(")"),
    ])
  }

  return print(node, sp)
}
