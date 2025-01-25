import type { Node } from "../ast/token"

export function subscript(node: Node): string {
  switch (node.type) {
    case "void":
      return ""
    case "num":
      return node.value
    case "var":
      return node.value
    case "magicvar":
      return node.value
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
