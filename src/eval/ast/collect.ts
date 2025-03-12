import type { Node } from "./token"

/**
 * Forcibly treats `node` as a comma-separated list, and gets its contained
 * nodes.
 */
export function commalist(node: Node): Node[] {
  if (node.type == "commalist") {
    return node.items.slice()
  }

  if (node.type == "void") {
    return []
  }

  return [node]
}
