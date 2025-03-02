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
  }

  throw new Error("Subscripts may only contains letters and numbers.")
}

export function isSubscript(node: Node): boolean {
  switch (node.type) {
    case "var":
      if (node.sup) break
      return true
    case "num":
      if (node.sub) break
      return true
    case "juxtaposed":
      return node.nodes.every(isSubscript)
  }

  return false
}
