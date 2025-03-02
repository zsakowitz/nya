import type { Node } from "../ast/token"

// TODO: this should be part of txrs

export function subscript(node: Node): string {
  switch (node.type) {
    case "void":
      return ""
    case "num":
      if (node.sub) break
      return node.value
    case "var":
      if (node.sub) break
      if (node.sup) break
      return node.value
    case "magicvar":
      if (node.prop) break
      if (node.sub) break
      if (node.sup) break
      return node.value + subscript(node.contents)
    case "juxtaposed":
      return node.nodes.map((x) => subscript(x)).reduce((a, b) => a + b, "")
    case "num16":
    case "group":
    case "sub":
    case "sup":
    case "raise":
    case "call":
    case "frac":
    case "mixed":
    case "piecewise":
    case "matrix":
    case "bigsym":
    case "big":
    case "root":
    case "index":
    case "op":
    case "commalist":
    case "cmplist":
    case "factorial":
    case "error":
    case "punc":
  }

  throw new Error("Subscripts may only contains letters and numbers.")
}

export function isSubscript(node: Node): boolean {
  switch (node.type) {
    // @ts-expect-error intentional fallthrough
    case "var":
      if (node.sup) break
    case "num":
      if (node.sub) break
      return true
    case "juxtaposed":
      return node.nodes.every(isSubscript)
    case "num16":
    case "group":
    case "sub":
    case "sup":
    case "raise":
    case "call":
    case "frac":
    case "mixed":
    case "piecewise":
    case "matrix":
    case "bigsym":
    case "big":
    case "root":
    case "index":
    case "op":
    case "commalist":
    case "cmplist":
    case "factorial":
    case "error":
    case "punc":
  }

  return false
}
