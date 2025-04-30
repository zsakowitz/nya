import { doc, type AstPath } from "prettier"

const { join, line, ifBreak, group } = doc.builders

export function print(
  path: AstPath,
  options: object,
  // Recursively print a child node
  print: (selector?: string | number | Array<string | number> | AstPath) => Doc,
) {}
