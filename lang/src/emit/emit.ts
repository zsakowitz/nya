import {
  EXPORTED_ALTS,
  KFalse,
  KMatrix,
  KTrue,
  OEq,
  TFloat,
  TInt,
  TSym,
} from "../ast/kind"
import {
  ExprArray,
  ExprArrayByRepetition,
  ExprBinary,
  ExprBinaryAssign,
  ExprBlock,
  ExprEmpty,
  ExprFor,
  ExprIf,
  ExprLit,
  ExprParen,
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
import { StmtComment, StmtExpr, StmtLet, type NodeStmt } from "../ast/node/stmt"
import { TypeEmpty, TypeVar, type NodeType } from "../ast/node/type"
import { Fn, IdMap, type Declarations } from "./decl"
import { bug, issue, todo } from "./error"
import { fieldName, Id, name, names } from "./id"
import type { EmitProps } from "./props"
import { createGlslRepr, emitGlslRepr, type GlslScalar } from "./repr"
import {
  bool,
  broadcastBinaryOps,
  broadcastUnaryOps,
  num,
  void_,
} from "./stdlib"
import { Array, ScalarTy, Struct, type Type } from "./type"

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

export class Block {
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

export interface BroadcastBinaryDefinition {
  name: string
  on: GlslScalar[]
  op(props: EmitProps, a: string, b: string, scalar: boolean): string
}

export interface BroadcastUnaryDefinition {
  name: string
  on: GlslScalar[]
  op(props: EmitProps, a: string, scalar: boolean): string
}

function toScalars(
  arg: { value: string; type: Type },
  block: Block | null,
): string[] {
  if (arg.type instanceof Array) {
    todo(`Cannot yet convert arrays into scalar components.`)
  }

  if (arg.type.repr.type == "void") {
    return []
  }

  if (arg.type instanceof ScalarTy) {
    return [arg.value]
  }

  if (arg.type instanceof Struct) {
    let val = arg.value
    if (block) val = cacheValue(arg, block, true)
    return arg.type.fields.flatMap((x) =>
      toScalars({ value: x.get(val), type: x.type }, null),
    )
  }

  bug(`Unable to get scalar components of value.`)
}

function fromScalars(type: Type, scalars: string[]): string {
  if (type instanceof ScalarTy) {
    return scalars[0]!
  }

  if (type instanceof Struct) {
    const values = type.fields.map((f) => {
      if (f.type instanceof Array) {
        todo(`Cannot yet generate arrays from scalar components.`)
      }
      if (f.type.repr.type == "void") {
        return "false"
      }
      if (f.type.repr.type == "vec") {
        return fromScalars(f.type, scalars.splice(0, f.type.repr.count))
      }
      bug(`Tried to construct non-vector struct from scalar components.`)
    })
    return type.cons(values)
  }

  bug(`Unable to create value from scalar components.`)
}

/**
 * Only usable if the operator returns the same type as its inputs.
 *
 * `op` is guaranteed to be passed two values of the same type, and they will
 * both be scalars.
 */
function broadcastBinary(
  block: Block,
  { name, on, op }: BroadcastBinaryDefinition,
  arg1: Value,
  arg2: Value,
): Value {
  const props = block.props
  const r1 = arg1.type.repr
  const r2 = arg2.type.repr

  if (r1.type != "vec" || r2.type != "vec") {
    issue(
      "Broadcast operators are only available on structs or scalars with 1-4 elements of the same type.",
    )
  }

  if (r1.of != r2.of || !on.includes(r1.of)) {
    issue(`The operator '${name}' only broadcasts over ${list(on, null)}`)
  }

  if (arg1.value == null || arg2.value == null) {
    issue(`The operator '${name}' does not accept void arguments.`)
  }

  if (r1.count != 1 && r2.count != 1 && r1.count != r2.count) {
    issue(`Cannot broadcast between sizes of '${r1.count}' and '${r2.count}'.`)
  }

  if (props.lang == "glsl") {
    return {
      type:
        r2.count == 1 ? arg1.type
        : r1.count == 1 ? arg2.type
        : arg1.type,
      value: op(props, arg1.value, arg2.value, r1.count == 1 && r2.count == 1),
    }
  }

  // We checked for `value: null` earlier
  const s1 = toScalars(arg1 as { value: string; type: Type }, block)
  const s2 = toScalars(arg2 as { value: string; type: Type }, block)

  if (r2.count == 1) {
    const els = s1.map((x) => op(props, x, s2[0]!, true))
    return { value: fromScalars(arg1.type, els), type: arg1.type }
  } else if (r1.count == 1) {
    const els = s2.map((x) => op(props, x, s1[0]!, true))
    return { value: fromScalars(arg2.type, els), type: arg2.type }
  } else if (r1.count == r2.count) {
    const els = s1.map((x, i) => op(props, x, s2[i]!, true))
    return { value: fromScalars(arg1.type, els), type: arg1.type }
  } else {
    bug(`Unable to broadcast.`)
  }
}

/**
 * Only usable if the operator returns the same type as its inputs.
 *
 * `op` is guaranteed to be passed two values of the same type, and they will
 * both be scalars.
 */
function broadcastUnary(
  block: Block,
  { name, on, op }: BroadcastUnaryDefinition,
  arg1: Value,
): Value {
  const r1 = arg1.type.repr

  if (r1.type != "vec") {
    issue(
      "Broadcast operators are only available on structs or scalars with 1-4 elements of the same type.",
    )
  }

  if (!on.includes(r1.of)) {
    issue(`The operator '${name}' only broadcasts over '${on.join(", ")}'`)
  }

  if (arg1.value == null) {
    issue(`The operator '${name}' does not accept void arguments.`)
  }

  const { props } = block

  if (props.lang == "glsl") {
    return {
      type: arg1.type,
      value: op(props, arg1.value, r1.count == 1),
    }
  }

  // We checked for `value: null` earlier
  const s1 = toScalars(arg1 as { value: string; type: Type }, block)
  const els = s1.map((x) => op(props, x, true))
  return { value: fromScalars(arg1.type, els), type: arg1.type }
}

function matrixMultiply(block: Block, arg1: Value, arg2: Value): Value {
  if (!(arg1.value && arg2.value)) {
    issue(`Cannot matrix multiply a void value.`)
  }

  const r1 = arg1.type.repr
  const r2 = arg2.type.repr

  // mat * vec = vec
  if (r1.type == "mat" && r2.type == "vec" && r2.of == "float") {
    if (r1.cols == r1.rows && r1.rows == r2.count) {
      if (block.props.lang == "glsl") {
        return {
          value: `(${arg1.value})*(${arg2.value})`,
          type: arg2.type,
        }
      } else {
        const a1scalars = toScalars(arg1 as ValueNN, block)
        const a2scalars = toScalars(arg2 as ValueNN, block)
        a1scalars // [c1r1 c1r2 .. c1rn] .. [cnr1 cnr2 .. cnrn]
        a2scalars // r1 r2 r3 ..

        return {
          value: fromScalars(
            arg2.type,
            a2scalars.map((_, i) => {
              let r = ""
              for (let j = 0; j < r1.cols; j++) {
                if (j != 0) {
                  r += "+"
                }
                r += `(${a1scalars[j * r1.rows + i]})*(${a2scalars[j]})`
                // u[i] = m[0][i] * v[0] + m[1][i] * v[1] + m[2][i] * v[2];
              }
              return r
            }),
          ),
          type: arg2.type,
        }
      }
    } else {
      todo(
        `Can only multiply matrices and vectors if the matrix is square and the vector has the same size as the matrix.`,
      )
    }
  }

  todo("Matrix multiplication is not available here.")
}

export interface Value {
  value: string | null
  type: Type
}

export interface ValueNN {
  value: string
  type: Type
}

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

export function performCall(id: Id, block: Block, args: Value[]): Value {
  const fns = block.decl.fns.get(id)

  if (!fns) {
    if (args.length == 1) {
      const bb = broadcastUnaryOps[id.value]
      if (bb) {
        return broadcastUnary(block, bb, args[0]!)
      }
    }

    if (args.length == 2) {
      if (id == names.of("@#")) {
        return matrixMultiply(block, args[0]!, args[1]!)
      }

      const bb = broadcastBinaryOps[id.value]
      if (bb) {
        return broadcastBinary(block, bb, args[0]!, args[1]!)
      }
    }

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
    item.kw.kind == KMatrix,
  )
  const name = props.lang == "glsl" ? emitGlslRepr(repr.repr) : idFn.ident()
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
  const brand = new Id("brand")
  return {
    actual: `function ${idFn.ident()}(${fieldsEncoded}){return{${fieldsEncoded}}}`,
    typeOnly: `declare const ${brand.ident()}: unique symbol
interface ${name} { readonly [${brand.ident()}]: unique symbol; ${fields.map((field, i) => fieldName(i) + ": " + emitType(field.type, props)).join("; ")} }
function ${idFn.ident()}(${fields.map((field) => encodeIdentForTypescriptDeclaration(field.id.label) + ": " + emitType(field.type, props)).join(", ")}): ${name}`,
    exports: {
      actual: [{ internal: `${idFn.ident()}`, exported: id.label }],
      typeOnly: [],
    },
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

export const NYA_LANG_TEST_PRELUDE = `const NYA_TEST = {
  successes: [],
  fails: [],
  check(cb, source, message) {
    try {
      const value = cb()
      if (value === true) {
        NYA_TEST.successes.push({
          source,
        })
      } else if (value === false) {
        NYA_TEST.fails.push({
          source,
          message,
        })
      } else {
        NYA_TEST.fails.push({
          source,
          message,
          error: "test did not return a boolean value",
        })
      }
    } catch (e) {
      NYA_TEST.fails.push({
        source,
        message,
        error: e,
      })
    }
  },
  report() {
    let ret = []
    for (const { source } of NYA_TEST.fails) {
      ret.push(\`❌ \${source.trim().slice(0, 80)}\`)
    }
    ret.push('ℹ️ ' + (NYA_TEST.successes.length + NYA_TEST.fails.length) + ' tests run.')
    if (NYA_TEST.successes.length) {
      ret.push('✅ ' + NYA_TEST.successes.length + ' tests passed.')
    }
    if (NYA_TEST.fails.length) {
      ret.push('⚠️ ' + NYA_TEST.fails.length + ' tests failed.')
    }
    return ret
  },
}
`

function getType(type: NodeType, decl: Declarations): Type {
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

function emitType(type: Type, props: EmitProps): string {
  if (props.lang == "glsl") {
    return emitGlslRepr(type.repr)
  }

  if (type instanceof ScalarTy) {
    return type.emit(props)
  } else if (type instanceof Struct) {
    return type.emit
  } else if (type instanceof Array) {
    return emitType(type.of, props) + "[]"
  }

  return type satisfies never
}

function emitAssignmentTarget(expr: NodeExpr, block: Block): Value {
  if (expr instanceof ExprVar) {
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

    issue(`Cannot assign to variables other than locally defined ones.`)
  } else if (expr instanceof ExprParen) {
    return emitAssignmentTarget(expr.of.value, block)
  } else {
    todo(`Cannot assign to '${expr.constructor.name}' yet.`)
  }
}

const PRECACHED = /^(?:[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?|[A-Za-z_$][\w_$]+)$/

function cacheValue(
  value: Value,
  block: Block,
  skipIfPrecached: boolean,
): string {
  if (value.value == null) {
    bug(`Cannot cache void values.`)
  }

  if (skipIfPrecached && PRECACHED.test(value.value)) {
    return value.value
  }

  // We can't ignore values which are plain idents since we need to copy them before usage.

  const ident = new Id("cached value").ident()
  block.source +=
    block.props.lang == "glsl" ?
      `${emitType(value.type, block.props)} ${ident}=${value.value};`
    : `var ${ident}=${value.value};`
  return ident
}

// In the future, this will need an expected type, so that enums and structs
// work. We'll leave it simple for now.
function emitExpr<T extends NodeExpr>(
  expr: [T] extends [ExprBlock] ? never : T,
  block: Block,
): Value {
  const raw = expr as NodeExpr
  switch (expr.constructor) {
    case ExprBlock:
      return emitExprBlock(raw as ExprBlock, block)
    case ExprBinary: {
      const expr = raw as ExprBinary
      if (expr.op.kind == OEq) {
        const lhs = emitAssignmentTarget(expr.lhs, block)
        const rhs = emitExpr(expr.rhs, block)
        block.source += `${lhs.value}=${rhs.value};`
        return { value: null, type: void_ }
      }

      return performCall(names.of(expr.op.val), block, [
        emitExpr(expr.lhs, block),
        emitExpr(expr.rhs, block),
      ])
    }
    case ExprBinaryAssign: {
      const expr = raw as ExprBinaryAssign
      const lhs = emitAssignmentTarget(expr.lhs, block)
      const rhs = emitExpr(expr.rhs, block)
      const ret = performCall(names.of(expr.op.val), block, [lhs, rhs])
      block.source += `${lhs.value}=${ret.value};`
      return { value: null, type: void_ }
    }
    case ExprUnary: {
      const expr = raw as ExprUnary
      return performCall(names.of(expr.op.val), block, [
        emitExpr(expr.of, block),
      ])
    }
    case ExprVar: {
      const expr = raw as ExprVar
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
    }
    case ExprLit: {
      const expr = raw as ExprLit
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
    }
    case ExprStruct: {
      const expr = raw as ExprStruct
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
            `Missing field${missing.length == 1 ? "" : "s"} ${list(missing, null)} to struct '${ty.id}'.`,
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
    }
    case ExprEmpty:
      issue(`Empty expression.`)
    case ExprProp: {
      const expr = raw as ExprProp
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
    }
    case ExprIf: {
      const expr = raw as ExprIf
      const cond = emitExpr(expr.condition, block)
      if (cond.type != bool) {
        issue(`The condition of an 'if' statement must be a boolean value.`)
      }
      if (cond.value == null) {
        issue(`The condition of an 'if' statement must not be void.`)
      }

      const child1 = block.child()
      if (!expr.block) {
        issue(`Missing block on 'if' statement.`)
      }
      const main = emitExprBlock(expr.block, child1)

      const child2 = block.child()
      let alt: Value = { value: null, type: void_ }
      if (expr.rest) {
        if (!expr.rest.block) {
          issue(`Missing block on 'else' branch of 'if' statement.`)
        }
        alt = emitExpr(expr.rest.block, child2)
      }

      if (main.type != alt.type) {
        if (main.type != void_ && !expr.rest) {
          issue(`An 'if' statement with a value must have an 'else' block.`)
        } else {
          issue(`Branches of 'if' statement has different types.`)
        }
      }

      // Optimization for ternaries, since those are quite frequent
      if (main.value && alt.value && !child1.source && !child2.source) {
        return {
          value: `(${cond.value})?(${main.value}):(${alt.value})`,
          type: main.type,
        }
      }

      // Optimization for plain 'if' block when there is no alternative
      if (!alt.value && !child2.source) {
        block.source += `if(${cond.value}){${child1.source}${main.value == null ? "" : main.value + ";"}}`
        return { value: null, type: void_ }
      }

      // Optimization for when 'if' block is only for side-effects
      if (main.type == void_ || !main.value || !alt.value) {
        block.source += `if(${cond.value}){${child1.source}${main.value == null ? "" : main.value + ";"}}else{${child2.source}${alt.value == null ? "" : alt.value + ";"}}`
        return { value: null, type: void_ }
      }

      const ret = new Id("return_value")
      if (block.props.lang == "glsl") {
        block.source += `${emitType(main.type, block.props)} ${ret.ident()};`
      } else {
        block.source += `var ${ret.ident()};`
      }
      block.source += `if(${cond.value}){${child1.source}${ret.ident()}=${main.value};}else{${child2.source}${ret.ident()}=${alt.value};}`
      return { value: ret.ident(), type: main.type }
    }
    case ExprParen: {
      const expr = raw as ExprParen
      return emitExpr(expr.of.value, block)
    }
    case ExprArray: {
      const expr = raw as ExprArray
      const items = expr.of.items.map((x) => emitExpr(x, block))
      if (items.length == 0) {
        todo("Cannot construct arrays of length zero yet.")
      }
      const type = items[0]!.type
      const incorrectTypes = items.filter((x) => x.type != type)
      if (incorrectTypes.length) {
        issue(
          `Mismatched types in array: ${list([type, ...incorrectTypes], null)}.`,
        )
      }
      if (!items.every((x) => x.value != null)) {
        issue(`Cannot create arrays of void.`)
      }
      const els = items.map((x) => x.value).join(",")
      const value =
        block.props.lang == "glsl" ?
          `${emitType(type, block.props)}[${items.length}](${els})`
        : `[${els}]`
      return { value, type: new Array(type, items.length) }
    }
    case ExprFor: {
      const expr = raw as ExprFor
      if (expr.bound.items.length != expr.sources.items.length) {
        issue(
          `'for' loops must have the same number of bound variables and sources.`,
        )
      }
      if (!expr.sources.items.length) {
        issue(`'for' loops must have at least one source.`)
      }
      if (!expr.block) {
        issue(`Missing body of 'for' loop.`)
      }

      const child = block.child()
      let size: number | null = null

      const index = new Id("for loop index").ident()
      for (let i = 0; i < expr.bound.items.length; i++) {
        const x = expr.bound.items[i]!

        const gid = names.of(x.val)
        if (child.locals.has(gid)) {
          issue(`Variable '${gid}' was declared twice in a 'for' loop.`)
        }

        const source = emitExpr(expr.sources.items[i]!, block)
        if (!(source.type instanceof Array)) {
          issue(`'for' loop sources must be arrays.`)
        }
        if (source.value == null) {
          issue(`'for' loop sources must not be void.`)
        }
        if (size == null) {
          size = source.type.size
        } else if (source.type.size != size) {
          issue(`'for' loop sources must have identical lengths.`)
        }

        const sourceCached = cacheValue(source, block, false)
        const value: Value = {
          value: `${sourceCached}[${index}]`,
          type: source.type.of,
        }
        child.locals.set(gid, value)
      }

      const ret = emitExprBlock(expr.block, child)
      if (ret.type != void_) {
        todo(
          `The body of a 'for' loop must return 'void'; found '${ret.type}'.`,
        )
      }
      const final = ret.value ? ret.value + ";" : ""
      block.source += `for(${block.props.lang == "glsl" ? "int" : "var"} ${index}=0;${index}<${size!};${index}++) {${child.source}${final}}`
      return { value: null, type: void_ }
    }
    case ExprArrayByRepetition: {
      const expr = raw as ExprArrayByRepetition
      const item = emitExpr(expr.of, block)
      if (item.value == null) {
        issue(`Cannot construct an array of void.`)
      }

      const sizes = expr.sizes.items.map((x) =>
        x instanceof ExprLit && x.value.kind == TInt ?
          parseInt(x.value.val, 10)
        : null,
      )
      if (!sizes.every((x) => x != null)) {
        todo(`Array sizes must currently be constant integers.`)
      }

      if (sizes.length == 0) {
        return item
      }

      return sizes.reduceRight<ValueNN>((item, size): ValueNN => {
        const type = new Array(item.type, size)

        if (block.props.lang == "glsl") {
          const cached = cacheValue(item, block, true)
          return {
            value: `${emitType(type, block.props)}(${(cached + ",").repeat(size).slice(0, -1)})`,
            type,
          }
        } else {
          return { value: `Array(${size}).fill(${item.value})`, type }
        }
      }, item as ValueNN)
    }
  }

  todo(`Cannot emit '${expr.constructor.name}' yet.`)
}

export function emitExprBlock(expr: ExprBlock, block: Block): Value {
  const child = block.child()
  let last: Value = { value: null, type: void_ }
  for (const stmt of expr.of.items) {
    if (stmt instanceof StmtComment) continue
    if (last.value) {
      block.source += last.value + ";"
    }
    last = emitStmt(stmt, child)
  }
  if (child.source) {
    block.source += child.source
  }
  return last
}

function emitStmt(stmt: NodeStmt, block: Block): Value {
  if (stmt instanceof StmtComment) {
    issue("Unable to emit comments.")
  } else if (stmt instanceof StmtExpr) {
    const ret = emitExpr(stmt.expr, block)
    if (stmt.semi) {
      if (ret.value) {
        block.source += ret.value + ";" // works in JS and GLSL
      }
      return { value: null, type: void_ }
    } else {
      return ret
    }
  } else if (stmt instanceof StmtLet) {
    if (!stmt.ident) {
      issue(`Missing identifier for 'let' statement.`)
    }
    if (!(stmt.value || stmt.type)) {
      issue(`'let' statement must specify type or value.`)
    }

    const value = stmt.value && emitExpr(stmt.value.value, block)
    const type =
      (stmt.type && getType(stmt.type.type, block.decl)) || value!.type
    if (value && !value.value) {
      issue(`Cannot set a variable to void.`)
    }
    if (value && value.type != type) {
      issue(
        `Mismatched types for variable '${stmt.ident.val}'; expected '${type}', but got '${value.type}'.`,
      )
    }

    const gid = names.of(stmt.ident.val)
    const lid = new Id(stmt.ident.val)
    const name = lid.ident()

    if (block.props.lang == "glsl") {
      if (value) {
        block.source += `${emitType(type, block.props)} ${name}=${value.value};`
      } else {
        block.source += `${emitType(type, block.props)} ${name};`
      }
    } else {
      if (value) {
        block.source += `var ${name}=${value.value};`
      } else {
        block.source += `var ${name};`
      }
    }

    block.locals.set(gid, { value: name, type })
    return { value: null, type: void_ }
  } else {
    todo(`Cannot emit '${stmt.constructor.name}' yet.`)
  }
}

export function emitItem(
  item: NodeItem,
  decl: Declarations,
  props: EmitProps,
): ItemEmit | null {
  if (item instanceof ItemAssert) {
    if (!/^js:.+-tests$/.test(props.lang)) {
      return null
    }

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
      actual: `NYA_TEST.check(()=>{${block.source}return(${value})},${JSON.stringify(item.kw.source.slice(item.expr.start, item.expr.end))}${item.message?.message ? "," + JSON.stringify(JSON.parse(item.message.message.val)) : ""});`,
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
    const { value, type } = emitExprBlock(item.block, block)
    if (type != ret) {
      issue(
        `Expected to return '${ret}' from function '${item.name.val}'; actual return value is '${type}'.`,
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

// PERF IMPROVEMENTS OVER TIME
// js:native: 711.8µs ± 51µs       (5 groups, 1000/group) baseline
// js:native: 697.5µs ± 35µs       (5 groups, 1000/group) emitExprBlock special
// js:native: 685.0µs ± 34µs       (5 groups, 1000/group) switch on constructor
