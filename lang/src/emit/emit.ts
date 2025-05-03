import { KFalse, KTrue, TFloat, TInt, TSym } from "../ast/kind"
import {
  ExprBinary,
  ExprBlock,
  ExprLit,
  ExprStruct,
  ExprUnary,
  ExprVar,
  type NodeExpr,
} from "../ast/node/expr"
import { ItemAssert, ItemFn, type NodeItem } from "../ast/node/item"
import { StmtComment, StmtExpr, type NodeStmt } from "../ast/node/stmt"
import { TypeVar, type NodeType } from "../ast/node/type"
import {
  Fn,
  IdMap,
  ScalarTy,
  Struct,
  type Declarations,
  type Type,
} from "./decl"
import { Id, name, names } from "./id"
import type { EmitProps } from "./props"
import { bool, num, void_ } from "./stdlib"

const JS_KEYWORDS =
  "break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with implements interface let package private protected public static yield abstract accessor async await boolean constructor declare keyof module namespace readonly number object set undefined as".split(
    " ",
  )

function encodeIdentForTypescriptDeclaration(x: string) {
  if (/^[A-Za-z_]\w*$/.test(x)) {
    if (JS_KEYWORDS.includes(x)) {
      return x + "_"
    }
    return x
  }
  return "p" + new Id("").value
}

function todo(x: string): never {
  throw new Error(x)
}

function issue(x: string): never {
  throw new Error(x)
}

export function getType(type: NodeType, decl: Declarations): Type {
  if (type instanceof TypeVar) {
    if (type.targs) {
      todo(`Cannot use generics yet.`)
    }

    const ty = decl.types.get(names.of(type.name.val))
    if (!ty) {
      issue(`Type '${type.name.val}' is not defined.`)
    }

    return ty
  } else {
    todo(`Cannot emit '${type.constructor.name}' yet.`)
  }
}

export function emitType(type: Type, props: EmitProps): string {
  if (type instanceof ScalarTy) {
    return type.emit(props)
  } else if (type instanceof Struct) {
    return type.name(props)
  }

  return type satisfies never
}

class Block {
  source = ""

  constructor(
    readonly decl: Declarations,
    readonly props: EmitProps,
    readonly locals: IdMap<Value> = new IdMap(null),
  ) {}

  child() {
    return new Block(this.decl, this.props, new IdMap(this.locals))
  }
}

type Value = { value: string | null; type: Type }

function performCall(id: Id, block: Block, args: Value[]): Value {
  const fns = block.decl.fns.get(id)
  if (!fns) {
    issue(`Function '${id}' is not defined.`)
  }

  const overload = fns.find(
    (x) =>
      x.args.length == args.length &&
      x.args.every((a, i) => a.type == args[i]!.type),
  )
  if (!overload) {
    issue(
      `No overload of '${id.value}' accepts arguments of type '${args.map((x) => x.type).join(", ")}'.`,
    )
  }

  return {
    value: overload.of(
      block.props,
      args.map((x) => {
        if (x.value == null) {
          issue(`Cannot pass a void value to '${id.value}'.`)
        }

        return x.value
      }),
    ),
    type: overload.ret,
  }
}

// In the future, this will need an expected type, so that enums and structs
// work. We'll leave it simple for now.
export function emitExpr(expr: NodeExpr, block: Block): Value {
  if (expr instanceof ExprBinary) {
    return performCall(names.of(expr.op.val), block, [
      emitExpr(expr.lhs, block),
      emitExpr(expr.rhs, block),
    ])
  } else if (expr instanceof ExprUnary) {
    return performCall(names.of(expr.op.val), block, [emitExpr(expr.of, block)])
  } else if (expr instanceof ExprVar) {
    const id = names.of(expr.name.val)
    if (expr.targs) {
      todo("Type generics are not supported yet.")
    }

    const local = block.locals.get(id)
    if (local) {
      if (expr.args) {
        issue(`Cannot call locally defined variable '${id}'.`)
      }
      return local
    }

    return performCall(
      id,
      block,
      expr.args ? expr.args.items.map((x) => emitExpr(x, block)) : [],
    )
  } else if (expr instanceof ExprLit) {
    switch (expr.value.kind) {
      case TSym:
        todo("Symbols are not supported yet.")

      case TFloat:
      case TInt:
        if (expr.value.val.includes("p")) {
          todo("Hexadecimal literals with exponents are not supported yet.")
        }
        return {
          value: parseFloat(expr.value.val).toExponential(),
          type: num,
        }

      case KTrue:
        return { value: "true", type: bool }
      case KFalse:
        return { value: "false", type: bool }
    }
  } else if (expr instanceof ExprStruct) {
    const id = names.of(expr.name.val)
    if (id == name`.`) {
      todo(`Implicit struct names are not supported yet.`)
    }
    if (block.locals.has(id)) {
      issue(`Locally defined variable '${id}' is not a struct type.`)
    }

    const ty = block.decl.types.get(id)
    if (!(ty instanceof Struct)) {
      issue(`Type '${id}' is not a struct.`)
    }

    // Missing args are checked in parsing stage; assume they exist.
    const args = expr.args?.items ?? []

    if (args.length != ty.fields.length) {
      const missing = ty.fields
        .map((x) => x.id)
        .filter((x) => !args.some((arg) => names.of(arg.name.val) == x))
      if (missing.length) {
        issue(
          `Missing fields ${missing.map((x) => `'${x}'`).join(", ")} to struct '${ty.id}'.`,
        )
      } else {
        issue(
          `Incorrect fields were passed to struct '${ty.id}': expected ${ty.fields.length}, received ${args.length}.`,
        )
      }
    }

    const ids: Record<number, Value> = Object.create(null)
    for (const arg of args) {
      const id = names.of(arg.name.val)
      const value =
        arg.expr ?
          emitExpr(arg.expr, block)
        : (block.locals.get(id) ?? performCall(id, block, []))
      if (id.value in ids) {
        issue(`Field '${id}' was passed multiple times to struct '${ty.id}'.`)
      }
      ids[id.value] = value
    }

    return {
      value: ty.emitValues(
        block.props,
        ty.fields.map(({ id, type }): string => {
          const value = ids[id.value]
          if (!value) {
            issue(`Missing field '${id}' to struct '${ty.id}'.`)
          }

          if (type != value.type) {
            issue(
              `Expected '${ty.id}.${id}' to be '${type}'; received '${value.type}'.`,
            )
          }

          if (value.value == null) {
            issue(
              `Cannot construct struct '${ty.id}' with a void value for '${id}'.`,
            )
          }

          return value.value
        }),
      ),
      type: ty,
    }
  } else if (expr instanceof ExprBlock) {
    const child = block.child()
    let last: Value = { value: null, type: void_ }
    for (const stmt of expr.of.items) {
      if (stmt instanceof StmtComment) continue
      if (last.value) {
        block.source += last.value + ";"
      }
      last = emitStmt(stmt, child)
    }
    return last
  } else {
    todo(`Cannot emit '${expr.constructor.name}' yet.`)
  }
}

export function emitStmt(stmt: NodeStmt, block: Block): Value {
  if (stmt instanceof StmtComment) {
    issue("Unable to emit comments.")
  } else if (stmt instanceof StmtExpr) {
    const ret = emitExpr(stmt.expr, block)
    if (stmt.semi) {
      block.source += ret.value + ";" // works in JS and GLSL
      return { value: null, type: void_ }
    } else {
      return ret
    }
  } else {
    todo(`Cannot emit '${stmt.constructor.name}' yet.`)
  }
}

export function emitItem(
  item: NodeItem,
  decl: Declarations,
  props: EmitProps,
): string | null {
  if (item instanceof ItemAssert) {
    const block = new Block(decl, props)
    const { value, type } = emitExpr(item.expr, block)
    if (type != bool) {
      issue(`Assertions must return a boolean; found '${type}' instead.`)
    }
    if (value == null) {
      issue(`Cannot assert a void value.`)
    }

    if (props.lang == "js:native") {
      if (block.source) {
        return `(()=>{${block.source}return(${value})})()`
      } else {
        return `(${value})`
      }
    }
    return null
  } else if (item instanceof ItemFn) {
    if (!item.name) {
      issue(`Missing function name.`)
    }
    if (item.tparams) {
      todo(`Type generics are not supported yet.`)
    }
    if (!item.params) {
      issue(`Missing parameters on function '${item.name.val}'.`)
    }
    if (!item.block) {
      issue(`Missing body on function '${item.name.val}'.`)
    }

    const ret = item.ret ? getType(item.ret.retType, decl) : void_
    const locals = new IdMap<Value>(null)
    const args: { id: Id; type: Type }[] = []
    const params: Value[] = []
    for (const param of item.params.items) {
      const id = names.of(param.ident.val)
      if (locals.has(id)) {
        issue(
          `Parameter '${id}' to function '${item.name.val}' is declared multiple times.`,
        )
      }
      const ty = getType(param.type, decl)
      const lid = new Id(param.ident.val)
      const val = { type: ty, value: "p" + lid.value }
      locals.init(id, val)
      params.push(val)
      args.push({ id, type: ty })
    }
    const block = new Block(decl, props, locals)
    const { value, type } = emitExpr(item.block, block)
    if (type != ret) {
      issue(
        `Expected to return '${type}' from function '${item.name.val}'; actual return value is '${ret}'.`,
      )
    }

    const name = new Id(item.name.val)

    const f = new Fn(
      name,
      args,
      ret,
      (_, args) => `f${name.value}(${args.join(",")})`,
    )

    decl.fns.push(names.of(item.name.val), f)

    switch (props.lang) {
      case "js:native":
        return `function f${name.value}(${params.map((x) => x.value!).join(",")}){${block.source}${value == null ? "" : `return(${value})`}}`
      case "dts":
        return `function f${name.value}(${args.map((x) => `${encodeIdentForTypescriptDeclaration(x.id.label)}: ${emitType(x.type, props)}`).join(", ")}): ${emitType(ret, props)}`
      case "glsl":
        return `${emitType(ret, props)} f${name.value}(${params.map((x) => `${emitType(x.type, props)} ${x.value!}`).join(",")}){${block.source}${value == null ? "" : `return(${value});`}}`
    }
  } else {
    todo(`Cannot emit '${item.constructor.name}' yet.`)
  }
}
