import {
  ExprBinary,
  ExprBlock,
  ExprEmpty,
  ExprLit,
  ExprParen,
  ExprUnary,
  ExprVar,
  type NodeExpr,
} from "../ast/node/expr"
import type { NodeItem } from "../ast/node/item"
import { StmtExpr, type NodeStmt } from "../ast/node/stmt"
import { TypeEmpty, TypeParen, TypeVar, type NodeType } from "../ast/node/type"
import type { Block, Declarations } from "./decl"
import { issue, todo } from "./error"
import { globalIdent as ident, type Id } from "./id"
import type { Type } from "./type"
import { Value } from "./value"

function list(a: { toString(): string }[], empty: "no arguments" | null) {
  if (a.length == 0) {
    return empty ?? "<null>"
  }
  if (a.length == 1) {
    return `'${a[0]!}'`
  }
  if (a.length == 2) {
    return `'${a[0]!}' and '${a[1]!}'`
  }
  return (
    a
      .slice(0, -1)
      .map((x) => `'${x}'`)
      .join(", ") +
    ", and " +
    `'${a[a.length - 1]}'`
  )
}

function performCall(id: Id, block: Block, args: Value[]): Value {
  const fns = block.decl.fns.get(id)

  if (!fns) {
    // FIXME: broadcasting
    issue(`Function '${id}' is not defined.`)
  }

  const overload = fns.find(
    (x) =>
      x.args.length == args.length &&
      x.args.every((a, i) => a.type == args[i]!.type),
  )
  if (!overload) {
    issue(
      `No overload of '${id}' accepts ${list(
        args.map((x) => x.type),
        "no arguments",
      )}. Try:` + fns.map((x) => "\n" + x.toString()).join(""),
    )
  }

  return overload.run(
    args.map((x) => {
      if (x.value == null) {
        issue(`Cannot pass a void value to '${id}'.`)
      }

      return x
    }),
  )
}

function emitType(node: NodeType, decl: Declarations): Type {
  if (node instanceof TypeParen) {
    return emitType(node.of, decl)
  } else if (node instanceof TypeEmpty) {
    issue("Empty type.")
  } else if (node instanceof TypeVar) {
    if (node.targs) {
      todo("Type arguments are not supported yet.")
    }
    const ty = decl.types.get(ident(node.name.val))
    if (!ty) {
      issue(`Type '${node.name.val}' is not defined.`)
    }
    return ty
  }

  todo(`Cannot emit '${node.constructor.name}' as a type yet.`)
}

function nonNull(value: Value | null): Value {
  if (value == null) {
    issue(`Expected non-void value.`)
  }
  return value
}

function emitExpr(node: NodeExpr, block: Block): Value {
  if (node instanceof ExprBlock) {
    return emitBlock(node, block)
  } else if (node instanceof ExprBinary) {
    return performCall(ident(node.op.val), block, [
      nonNull(emitExpr(node.lhs, block)),
      nonNull(emitExpr(node.rhs, block)),
    ])
  } else if (node instanceof ExprUnary) {
    return performCall(ident(node.op.val), block, [
      nonNull(emitExpr(node.of, block)),
    ])
  } else if (node instanceof ExprEmpty) {
    issue("Empty expression.")
  } else if (node instanceof ExprLit) {
    return block.decl.createLiteral(node)
  } else if (node instanceof ExprVar) {
    if (node.targs) {
      todo("Type arguments are not supported yet.")
    }
    return performCall(
      ident(node.name.val),
      block,
      node.args?.items.map((e) => nonNull(emitExpr(e, block))) ?? [],
    )
  } else if (node instanceof ExprParen) {
    return emitExpr(node.of.value, block)
  }

  todo(`Cannot emit '${node.constructor.name}' as an expression yet.`)
}

function emitLvalue(node: NodeExpr, block: Block): { current: Value; id: Id } {
  todo(`Cannot emit '${node.constructor.name}' as an assignment target yet.`)
}

export function emitBlock(node: ExprBlock, block: Block): Value {
  let ret = nullValue(block)
  for (const item of node.of.items) {
    ret = emitStmt(item, block)
  }
  return ret
}

function nullValue(block: Block) {
  return new Value(null, block.decl.void)
}

function emitStmt(node: NodeStmt, block: Block): Value {
  if (node instanceof StmtExpr) {
    const expr = emitExpr(node.expr, block)
    if (node.semi) {
      // TODO: do we need to preserve expr's computation? as in, can expr return values have side effects? imo no, since they should just output to block.source
      return nullValue(block)
    }
    return expr
  }

  todo(`Cannot emit '${node.constructor.name}' as a statement yet.`)
}

function emitItem(node: NodeItem, decl: Declarations) {
  todo(`Cannot emit '${node.constructor.name}' as an item yet.`)
}
