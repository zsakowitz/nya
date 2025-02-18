import type { Node, Nodes } from "./token"

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

/**
 * Like {@linkcode commalist}, but will remove a single layer of parentheses if
 * they exist.
 */
export function fnargs(node: Node): Node[] {
  return commalist(node)
}
