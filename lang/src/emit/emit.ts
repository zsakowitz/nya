import { EXPORTED_ALTS, KFalse, KTrue, TFloat, TInt, TSym } from "../ast/kind"
import {
  ExprBinary,
  ExprBlock,
  ExprEmpty,
  ExprLit,
  ExprProp,
  ExprStruct,
  ExprUnary,
  ExprVar,
  type NodeExpr,
} from "../ast/node/expr"
import {
  ItemAssert,
  ItemComment,
  ItemFn,
  ItemStruct,
  type NodeItem,
} from "../ast/node/item"
import { StmtComment, StmtExpr, type NodeStmt } from "../ast/node/stmt"
import { TypeEmpty, TypeVar, type NodeType } from "../ast/node/type"
import {
  Fn,
  IdMap,
  ScalarTy,
  Struct,
  type Declarations,
  type Type,
} from "./decl"
import { fieldName, Id, name, names } from "./id"
import type { EmitProps } from "./props"
import { createGlslRepr, emitGlslRepr } from "./repr"
import { bool, num, void_ } from "./stdlib"

const JS_KEYWORDS =
  "break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with implements interface let package private protected public static yield abstract accessor async await boolean constructor declare keyof module namespace readonly number object set undefined as".split(
    " ",
  )

function isAcceptableJsIdent(x: string) {
  return /^[A-Za-z_][A-Za-z0-9_$]*$/.test(x) && !JS_KEYWORDS.includes(x)
}

function encodeIdentForTypescriptDeclaration(x: string) {
  if (isAcceptableJsIdent(x)) {
    return x
  }
  return new Id("").ident()
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
  } else if (type instanceof TypeEmpty) {
    issue(`Empty type.`)
  } else {
    todo(`Cannot emit '${type.constructor.name}' yet.`)
  }
}

export function emitType(type: Type, props: EmitProps): string {
  if (type instanceof ScalarTy) {
    return type.emit(props)
  } else if (type instanceof Struct) {
    return type.emit
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
      `No overload of '${id}' accepts arguments of type '${args.map((x) => x.type).join(", ")}'.`,
    )
  }

  return {
    value: overload.of(
      block.props,
      args.map((x) => {
        if (x.value == null) {
          issue(`Cannot pass a void value to '${id}'.`)
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
      value: ty.cons(
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
  } else if (expr instanceof ExprEmpty) {
    issue(`Empty expression.`)
  } else if (expr instanceof ExprProp) {
    if (expr.targs) {
      todo(`Type generics are not supported yet.`)
    }
    if (!expr.prop.name) {
      todo(`Missing function name in dotted access.`)
    }
    const args = [emitExpr(expr.on, block)]
    if (expr.args) {
      for (const arg of expr.args.items) {
        args.push(emitExpr(arg, block))
      }
    }
    return performCall(names.of(expr.prop.name.val), block, args)
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

function createFunctionDTS(
  props: EmitProps,
  name: Id,
  args: { id: Id; type: Type; value: string }[],
  ret: Type,
): string {
  return `function ${name.ident()}(${args.map((x) => `${encodeIdentForTypescriptDeclaration(x.id.label)}: ${emitType(x.type, props)}`).join(", ")}): ${emitType(ret, props)}`
}

function createFunction(
  props: EmitProps,
  name: Id,
  args: { id: Id; type: Type; value: string }[],
  block: Block,
  retValue: string | null,
  ret: Type,
): string {
  switch (props.lang) {
    case "glsl":
      return `${emitType(ret, props)} ${name.ident()}(${args.map((x) => `${emitType(x.type, props)} ${x.value!}`).join(",")}){${block.source}${retValue == null ? "" : `return(${retValue});`}}`
    default:
      props.lang satisfies `js:${string}`
      return `function ${name.ident()}(${args.map((x) => x.value!).join(",")}){${block.source}${retValue == null ? "" : `return(${retValue})`}}`
  }
}

export interface ItemEmit {
  actual: string
  typeOnly?: string
  exports?: { actual: Export[]; typeOnly: Export[] }
}

export interface Export {
  internal: string
  exported: string
}

function emitStruct(
  item: ItemStruct,
  decl: Declarations,
  props: EmitProps,
): ItemEmit | null {
  if (!item.name) {
    issue(`Missing struct name.`)
  }
  if (!item.fields) {
    issue(`Missing fields on struct '${item.name.val}'.`)
  }
  if (item.tparams) {
    todo(`Type generics are not supported yet.`)
  }

  const id = names.of(item.name.val)
  const fields: { id: Id; type: Type }[] = []
  for (const field of item.fields.items) {
    if (field.constKw) {
      todo(`Const struct fields are not supported yet.`)
    }
    if (!field.name) {
      issue(`Missing field name in struct '${item.name.val}'.`)
    }
    const id = names.of(field.name.val)
    if (fields.some((x) => x.id == id)) {
      issue(
        `Field '${id}' was declared multiple times in struct '${item.name.val}'.`,
      )
    }
    fields.push({ id, type: getType(field.type, decl) })
  }

  const idFn = new Id(item.name.val)
  const repr = createGlslRepr(
    item.name.val,
    fields.map((x) => x.type.repr),
  )
  const name =
    props.lang == "glsl" ?
      emitGlslRepr(repr.repr)
    : new Id(item.name.val).ident()
  const fields2 = fields.map((x, i) => ({
    id: x.id,
    type: x.type,
    get:
      props.lang == "glsl" ?
        (source: string) => repr.fields[i]!(source)
      : (s: string) => s + "." + fieldName(i),
  }))
  const struct = new Struct(id, name, repr.repr, fields2, (of) => {
    if (props.lang == "glsl") {
      return repr.create(of)
    } else {
      return `${idFn.ident()}(${of.join(",")})`
    }
  })
  if (!decl.types.canDefine(id)) {
    issue(`Type '${id}' was declared multiple times.`)
  }
  decl.types.init(id, struct)
  for (const field of fields2) {
    decl.fns.push(
      field.id,
      new Fn(field.id, [{ id, type: struct }], field.type, (_, [s]) =>
        field.get(s!),
      ),
    )
  }

  if (props.lang == "glsl") {
    return repr.structDecl ? { actual: repr.structDecl } : null
  }

  const fieldsEncoded = fields.map((_, i) => fieldName(i)).join(",")
  return {
    actual: `function ${idFn.ident()}(${fieldsEncoded}){return{${fieldsEncoded}}}`,
    typeOnly: `interface ${name} { readonly __brand: unique symbol; ${fields.map((field, i) => fieldName(i) + ": " + emitType(field.type, props)).join("; ")} }
function ${idFn.ident()}(${fields.map((field) => encodeIdentForTypescriptDeclaration(field.id.label) + ": " + emitType(field.type, props)).join(", ")}): ${name}`,
    exports: {
      actual: [{ internal: `${idFn.ident()}`, exported: id.label }],
      typeOnly: [{ internal: name, exported: id.label }],
    },
  }
}

export function emitItem(
  item: NodeItem,
  decl: Declarations,
  props: EmitProps,
): ItemEmit | null {
  if (item instanceof ItemAssert) {
    const block = new Block(decl, props)
    const { value, type } = emitExpr(item.expr, block)
    if (type != bool) {
      issue(`Assertions must return a boolean; found '${type}' instead.`)
    }
    if (value == null) {
      issue(`Cannot assert a void value.`)
    }

    if (props.lang == "glsl") {
      return null
    }

    return {
      actual:
        block.source ?
          `(()=>{${block.source}return(${value})})()`
        : `(${value})`,
    }
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
    const args: { id: Id; type: Type; value: string }[] = []
    for (const param of item.params.items) {
      const id = names.of(param.ident.val)
      if (locals.has(id)) {
        issue(
          `Parameter '${id}' to function '${item.name.val}' is declared multiple times.`,
        )
      }
      const ty = getType(param.type, decl)
      const lid = new Id(param.ident.val)
      const value = lid.ident()
      const val = { type: ty, value }
      locals.init(id, val)
      args.push({ id, type: ty, value })
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
      (_, args) => `${name.ident()}(${args.join(",")})`,
    )

    decl.fns.push(names.of(item.name.val), f)

    return {
      actual: createFunction(props, name, args, block, value, ret),
      typeOnly:
        props.lang == "glsl" ?
          undefined
        : createFunctionDTS(props, name, args, ret),
      exports:
        props.lang == "glsl" ?
          undefined
        : {
            actual: [
              {
                internal: name.ident(),
                exported: EXPORTED_ALTS[item.name.kind] ?? name.label,
              },
            ],
            typeOnly: [],
          },
    }
  } else if (item instanceof ItemComment) {
    return null
  } else if (item instanceof ItemStruct) {
    return emitStruct(item, decl, props)
  } else {
    todo(`Cannot emit '${item.constructor.name}' yet.`)
  }
}

function exportedName(x: string) {
  if (isAcceptableJsIdent(x)) {
    return x
  } else {
    return JSON.stringify(x)
  }
}

export function createExports(of: string[], as: string, typeOnly: boolean) {
  if (of.length == 0) {
    return null
  }
  if (of.length == 1) {
    return `export ${typeOnly ? "type " : ""}{ ${of[0]!} as ${exportedName(as)} }`
  }
  return of
    .map(
      (x, i) =>
        `export ${typeOnly ? "type " : ""}{ ${x} as ${exportedName(as + "_" + (i + 1))} }`,
    )
    .join("\n")
}
