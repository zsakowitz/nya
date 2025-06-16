import { KFalse, KTrue, TString } from "../ast/kind"
import type { ExposePackage } from "../ast/node/expose"
import { ExprLit, ExprParen, type NodeExpr } from "../ast/node/expr"
import { issue } from "./error"

interface PackageProperties {
  name: string
  default: boolean
  label: string
}

function lit(node: NodeExpr) {
  while (node instanceof ExprParen) {
    node = node.of.value
  }
  if (node instanceof ExprLit) {
    return node.value
  }
  return null
}

function str(node: NodeExpr): string {
  const value = lit(node)
  if (value?.kind == TString) {
    // TODO: figure out how escapes should work
    return value.val.slice(1, -1)
  }
  issue(`Expected string.`, node)
}

function bool(node: NodeExpr): boolean {
  const value = lit(node)
  if (value?.kind == KTrue) {
    return true
  }
  if (value?.kind == KFalse) {
    return false
  }
  issue(`Expected 'true' or 'false'.`, node)
}

export function parseExposePackage(node: ExposePackage): PackageProperties {
  if (!node.args) {
    issue(`'expose package' is missing fields.`, node)
  }
  const fields: Record<string, NodeExpr> = Object.create(null)
  for (const arg of node.args.items) {
    if (arg.name.val in fields) {
      issue(
        `Field '${arg.name.val}' specified twice in 'expose package' declaration.`,
        arg.name,
      )
    }
    fields[arg.name.val] =
      arg.expr ??
      issue(`Missing field value in 'expose package' declaration.`, arg.name)
  }
  function field(name: string) {
    return (
      fields[name] ??
      issue(`Missing '${name}' in 'expose package' declaration.`, node.kw)
    )
  }
  return {
    name: str(field("name")),
    default: bool(field("default")),
    label: str(field("label")),
  }
}
