import {
  ExprBinary,
  ExprBlock,
  ExprEmpty,
  ExprLit,
  ExprParen,
  ExprProp,
  ExprStruct,
  ExprUnary,
  ExprVar,
  type NodeExpr,
} from "../ast/node/expr"
import { ItemFn, ItemStruct, type NodeItem } from "../ast/node/item"
import { StmtExpr, type NodeStmt } from "../ast/node/stmt"
import { TypeEmpty, TypeParen, TypeVar, type NodeType } from "../ast/node/type"
import { Block, IdMap, type Declarations } from "./decl"
import { issue, todo } from "./error"
import { Id, ident, type GlobalId } from "./id"
import { Fn, Struct, type Type } from "./type"
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

function performCall(id: GlobalId, block: Block, args: Value[]): Value {
  const local = block.locals.get(id)

  if (local) {
    if (args.length != 0) {
      issue(`Locally defined variable '${id}' is not a function.`)
    }

    return local
  }

  const fns = block.decl.fns.get(id)

  if (!fns) {
    // FIXME: broadcasting
    issue(`Function '${id}' is not defined.`)
  }

  const overload = fns.find(
    (x) =>
      x.args.length == args.length &&
      x.args.every((a, i) => a.type.canConvertFrom(args[i]!.type)),
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
    args.map((x, i) => {
      if (x.value == null) {
        issue(`Cannot pass a void value to '${id}'.`)
      }

      return overload.args[i]!.type.convertFrom(x)
    }),
    block,
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
  } else {
    todo(`Cannot emit '${node.constructor.name}' as a type yet.`)
  }
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
  } else if (node instanceof ExprStruct) {
    const name = node.name.val
    if (!node.args) {
      issue(`No arguments were passed to struct '${name}'.`)
    }

    const ty = block.decl.types.get(ident(name))
    if (!ty) {
      issue(`Type '${name}' is not defined.`)
    }
    if (!(ty instanceof Struct)) {
      issue(`Type '${name}' is not a struct.`)
    }

    const map = new Map<string, Value>()
    for (const arg of node.args.items) {
      map.set(
        arg.name.val,
        arg.expr ?
          emitExpr(arg.expr, block)
        : performCall(ident(arg.name.val), block, []),
      )
    }

    return ty.with(ty.verifyAndOrderFields(map))
  } else if (node instanceof ExprProp) {
    if (node.targs) {
      todo("Type arguments are not supported yet.")
    }
    if (!node.prop.name) {
      issue(`Missing property name for dotted property access.`)
    }
    return performCall(ident(node.prop.name.val), block, [
      emitExpr(node.on, block),
      ...(node.args?.items.map((e) => nonNull(emitExpr(e, block))) ?? []),
    ])
  } else {
    todo(`Cannot emit '${node.constructor.name}' as an expression yet.`)
  }
}

// function emitLvalue(node: NodeExpr, block: Block): { current: Value; id: Id } {
//   todo(`Cannot emit '${node.constructor.name}' as an assignment target yet.`)
// }

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
  } else {
    todo(`Cannot emit '${node.constructor.name}' as a statement yet.`)
  }
}

export type ItemResult = { decl: string; declTy?: string } | null

export function emitItem(node: NodeItem, decl: Declarations): ItemResult {
  if (node instanceof ItemStruct) {
    if (!node.name) {
      issue(`Missing name in struct declaration.`)
    }
    const id = ident(node.name.val)
    if (!node.fields) {
      issue(`Missing fields when declaring struct '${id}'.`)
    }
    if (node.tparams) {
      issue("Type parameters are not supported yet.")
    }
    if (!decl.types.canDefine(id)) {
      issue(`Type '${id}' was declared multiple times.`)
    }
    const fields = []
    for (const { name, type } of node.fields.items) {
      if (!name) {
        issue(`Missing name for field when declaring struct '${id}'.`)
      }
      const ty = emitType(type, decl)
      fields.push({ name: name.val, type: ty })
    }
    const result = Struct.of(decl.props, id.label, fields)
    decl.types.set(id, result.struct)
    const fns = result.struct.generateFieldAccessors(decl.props)
    for (const fn of fns) {
      decl.fns.push(fn.id as GlobalId, fn)
    }
    return result.decl ? { decl: result.decl, declTy: result.declTyOnly } : null
  } else if (node instanceof ItemFn) {
    const fname = node.name?.val
    if (fname == null) {
      issue(`Function declaration is missing a name.`)
    }
    if (node.tparams) {
      issue(`Type parameters are not supported yet.`)
    }
    if (!node.params) {
      issue(`Function '${fname}' is missing a parameter list.`)
    }
    if (node.usage) {
      todo(`The 'usage' keyword is not implemented yet.`)
    }
    if (!node.block) {
      issue(`Function '${fname}' is missing its contents.`)
    }
    const ret = node.ret ? emitType(node.ret.retType, decl) : decl.void
    const locals = new IdMap<Value>(null)
    const params = node.params.items.map((x) => {
      const local = ident(x.ident.val)
      const name = new Id(x.ident.val)
      if (locals.has(local)) {
        issue(`Parameter '${local}' is declared twice in function '${fname}'.`)
      }
      const type = emitType(x.type, decl)
      locals.set(local, new Value(name.ident(), type))
      return { name, type }
    })
    const fparams = params.map((x) => ({ name: x.name.label, type: x.type }))
    const block = new Block(decl, locals)
    const value = ret.convertFrom(emitBlock(node.block, block))
    const lid = new Id(fname)
    const gid = ident(fname)
    const lident = lid.ident()
    const body =
      decl.props.lang == "glsl" ?
        `${ret.emit} ${lident}(${params
          .filter((x) => x.type.repr.type != "void")
          .map((x) => x.type.emit + " " + x.name.ident())
          .join(",")}) {${block.source}${returnValue(value)}}`
      : `function ${lident}(${params
          .filter((x) => x.type.repr.type != "void")
          .map((x) => x.name.ident())
          .join(",")}) {${block.source}${returnValue(value)}}`

    const fn =
      block.source == "" && value.const() ?
        // Non-side-effecting constant optimization
        new Fn(gid, fparams, ret, () => value)
      : new Fn(gid, fparams, ret, (args) => {
          const actualArgs = args.map((x, i) => params[i]!.type.convertFrom(x))
          const expr = `${lident}(${actualArgs
            .filter((x) => x.type.repr.type != "void")
            .map((x) => x.toRuntime())
            .join(",")})`
          return new Value(expr, ret)
        })

    decl.fns.push(gid, fn)
    return { decl: body }
  } else {
    todo(`Cannot emit '${node.constructor.name}' as an item yet.`)
  }
}

function returnValue(val: Value) {
  const text = val.toRuntime()
  if (text == null) {
    return ""
  } else {
    return `return(${text});`
  }
}
