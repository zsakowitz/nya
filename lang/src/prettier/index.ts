import type { Doc } from "prettier"
import { builders } from "prettier/doc.js"
import { List, PlainList } from "../ast/node/extra"
import { Node } from "../ast/node/node"
import { Token } from "../ast/token"
import { print } from "./print"

const { group, indent, softline, ifBreak } = builders

export type K = string | number

export interface Subprint {
  (k: K): Doc
  opt(k: K): Doc
  alt(k: K, ifNull: Doc): Doc
  sub(a: K, b: K): Doc
  all(k: K): Doc[]
  paren(k: K, force?: boolean): Doc
  as(k: K | K[], f: () => Doc): Doc
  source: string
}

export function printVanilla(node: Node, source: string) {
  let current = node

  function go(next: Token<number> | Node | unknown): Doc {
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

    throw new Error("invalid token")
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
    const next = (current as any)[k]
    const doc = go(next)

    if (next instanceof List || next instanceof PlainList) {
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

  sp.as = (k: keyof any | (keyof any)[], f: () => Doc): Doc => {
    let prev = current
    try {
      if (Array.isArray(k)) {
        for (const el of k) {
          current = (current as any)[el]
        }
      } else {
        current = (current as any)[k]
      }
      return f()
    } finally {
      current = prev
    }
  }

  sp.source = source

  return print(node, sp)
}
