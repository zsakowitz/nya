import { KMatrix, OEq, TBuiltin } from "../ast/kind"
import {
  ExprArray,
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
  ItemFn,
  ItemStruct,
  ItemTypeAlias,
  type NodeItem,
} from "../ast/node/item"
import { StmtExpr, StmtLet, type NodeStmt } from "../ast/node/stmt"
import {
  TypeAlt,
  TypeArray,
  TypeEmpty,
  TypeParen,
  TypeVar,
  type NodeType,
} from "../ast/node/type"
import { fromScalars, toScalars } from "./broadcast"
import { Block, IdMap, type Declarations } from "./decl"
import { issue, todo } from "./error"
import { Id, ident, type GlobalId } from "./id"
import { Alt, Array, ArrayEmpty, Fn, Struct, type Type } from "./type"
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

const ID_MATMUL = ident("@#")
function performCall(id: GlobalId, block: Block, args: Value[]): Value {
  if (id == ID_MATMUL) {
    if (args.length == 2) {
      return matrixMultiply(block, args[0]!, args[1]!)
    }
  }

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
  } else if (node instanceof TypeAlt) {
    const lhs = emitType(node.lhs, decl)
    const rhs = emitType(node.rhs, decl)
    const l =
      lhs instanceof Alt ? lhs.alts
      : lhs instanceof Struct ? [lhs]
      : issue(
          `Types may only be used in a union if both types were initially declared in a single 'struct' declaration.`,
        )
    const r =
      rhs instanceof Alt ? rhs.alts
      : rhs instanceof Struct ? [rhs]
      : issue(
          `Types may only be used in a union if both types were initially declared in a single 'struct' declaration.`,
        )
    return new Alt([...l, ...r])
  } else if (node instanceof TypeArray) {
    const item = emitType(node.of, decl)
    if (item instanceof Array || node.sizes.items.length != 1) {
      todo(`Multidimensional arrays are not supported yet.`)
    }
    const count = arraySize(
      decl.arraySize(emitExpr(node.sizes.items[0]!, new Block(decl))),
    )
    return new Array(decl.props, item, count)
  } else {
    todo(`Cannot emit '${node.constructor.name}' as a type yet.`)
  }
}

function arraySize(size: number | null): number {
  if (size == null) {
    issue(
      `Array sizes must be constant integers; an array's size cannot depend on local variables.`,
    )
  }

  return size
}

function emitExpr(node: NodeExpr, block: Block): Value {
  if (node instanceof ExprBlock) {
    return emitBlock(node, block)
  } else if (node instanceof ExprBinary) {
    if (node.op.kind == OEq) {
      const { current, id } = emitLvalue(node.lhs, block)
      const rhs = emitExpr(node.rhs, block)

      if (current.const()) {
        block.locals.set(id, rhs)
      } else {
        block.source += `${current}=${rhs};`
      }

      return new Value(0, block.decl.void)
    }

    return performCall(ident(node.op.val), block, [
      emitExpr(node.lhs, block),
      emitExpr(node.rhs, block),
    ])
  } else if (node instanceof ExprUnary) {
    return performCall(ident(node.op.val), block, [emitExpr(node.of, block)])
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
      node.args?.items.map((e) => emitExpr(e, block)) ?? [],
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
      ...(node.args?.items.map((e) => emitExpr(e, block)) ?? []),
    ])
  } else if (node instanceof ExprIf) {
    const cond = emitExpr(node.condition, block)
    const { bool, void: void_ } = block.decl
    if (cond.type != bool) {
      issue(`The condition of an 'if' statement must be a boolean value.`)
    }
    if (cond.value == null) {
      issue(`The condition of an 'if' statement must not be void.`)
    }

    const child1 = block.child()
    if (!node.block) {
      issue(`Missing block on 'if' statement.`)
    }
    const main = emitBlock(node.block, child1)

    const child2 = block.child()
    let alt: Value = new Value(0, block.decl.void)
    if (node.rest) {
      if (!node.rest.block) {
        issue(`Missing block on 'else' branch of 'if' statement.`)
      }
      alt = emitExpr(node.rest.block, child2)
    }

    if (main.type != alt.type) {
      if (main.type != void_ && !node.rest) {
        issue(`An 'if' statement with a value must have an 'else' block.`)
      } else {
        issue(`Branches of an 'if' statement must have the same type.`)
      }
    }

    // Special handling when void output is specified
    if (main.type.repr.type == "void") {
      if (child1.source && child2.source) {
        block.source += `if(${cond}){${child1.source}}else{${child2.source}}`
      } else if (child1.source) {
        block.source += `if(${cond}){${child1.source}}`
      } else if (child2.source) {
        block.source += `if(!(${cond})){${child2.source}}`
      }

      return new Value(0, main.type)
    }

    // Optimization for ternaries, since those are quite frequent
    if (!child1.source && !child2.source) {
      return new Value(`(${cond})?(${main}):(${alt})`, main.type)
    }

    const ret = new Id("return value")
    if (block.props.lang == "glsl") {
      block.source += `${main.type.emit} ${ret.ident()};`
    } else {
      block.source += `var ${ret.ident()};`
    }
    block.source += `if(${cond.value}){${child1.source}${ret.ident()}=${main.value};}else{${child2.source}${ret.ident()}=${alt.value};}`
    return new Value(ret.ident(), main.type)
  } else if (node instanceof ExprArray) {
    const items = node.of.items.map((item) => emitExpr(item, block))
    if (items.length == 0) {
      return new Value(0, ArrayEmpty)
    }

    const ty = items[0]!.type
    if (!items.every((x) => x.type == ty)) {
      issue(
        `All elements in an array must be the same type; found ${list(
          items
            .map((x) => x.type.toString())
            .filter((x, i, a) => a.indexOf(x) == i),
          null,
        )}.`, // TODO: automatic casting of array elements
      )
    }

    const type = new Array(block.props, ty, items.length)
    if (items.every((x) => x.const())) {
      return new Value(
        items.map((x) => x.value),
        type,
      )
    }

    const strings = items.map((x) => x.toString())
    if (block.props.lang == "glsl") {
      return new Value(`${type.emit}(${strings.join(",")})`, type)
    } else {
      return new Value(`[${strings.join(",")}]`, type)
    }
  } else if (node instanceof ExprFor) {
    // TODO: some for loops can be evaluated at const time

    const expr = node
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

      const gid = ident(x.val)
      if (child.locals.has(gid)) {
        issue(`Variable '${gid}' was declared twice in a 'for' loop.`)
      }

      const source = emitExpr(expr.sources.items[i]!, block)

      if (source.type == ArrayEmpty) {
        todo(`'for' loop sources may not be empty arrays.`)
      }
      if (!(source.type instanceof Array)) {
        issue(`'for' loop sources must be arrays.`)
      }
      if (source.type.item instanceof Array) {
        todo(`'for' loop sources cannot be multidimensional arrays.`)
      }
      if (source.value == null) {
        todo(`'for' loop sources must not be void.`)
      }
      if (size == null) {
        size = source.type.count
      } else if (source.type.count != size) {
        issue(`'for' loop sources must have identical lengths.`)
      }

      const sourceCached = block.cache(source, false)
      const value = new Value(`${sourceCached}[${index}]`, source.type.item)
      child.locals.set(gid, value)
    }

    const ret = emitBlock(expr.block, child)
    if (ret.type != block.decl.void) {
      todo(`The body of a 'for' loop must return 'void'; found '${ret.type}'.`)
    }
    const final = ret.value ? ret.value + ";" : ""
    block.source += `for(${block.props.lang == "glsl" ? "int" : "var"} ${index}=0;${index}<${size!};${index}++) {${child.source}${final}}`
    return new Value(0, block.decl.void)
  } else if (node instanceof ExprBinaryAssign) {
    const { current, id } = emitLvalue(node.lhs, block)
    const rhs = emitExpr(node.rhs, block)
    const updated = performCall(ident(node.op.val), block, [current, rhs])

    if (current.const()) {
      block.locals.set(id, updated)
    } else {
      block.source += `${current}=${updated};`
    }

    return new Value(0, block.decl.void)
  } else {
    todo(`Cannot emit '${node.constructor.name}' as an expression yet.`)
  }

  //   else if (node instanceof ExprArrayByRepetition) {
  //     const item = emitExpr(node.of, block)
  //     const sizes = node.sizes.items.map((size) =>
  //       arraySize(block.decl.arraySize(emitExpr(size, block))),
  //     )
  //   }
}

function emitLvalue(
  node: NodeExpr,
  block: Block,
): { current: Value; id: GlobalId } {
  if (node instanceof ExprVar) {
    if (node.targs) {
      issue("Cannot assign to something with type arguments.")
    }
    if (node.args) {
      issue("Cannot assign to a function call.")
    }
    if (node.name.kind == TBuiltin) {
      issue("Cannot assign to a builtin function.")
    }

    const id = ident(node.name.val)
    const current = block.locals.get(id)
    if (!current) {
      issue(`Variable '${id}' is not locally defined.`)
    }
    if (!current?.assignable) {
      issue(
        `Cannot assign to '${id}'. If it's a function parameter, it's readonly.`,
      )
    }

    return { current, id }
  } else {
    todo(`Cannot emit '${node.constructor.name}' as an assignment target yet.`)
  }
}

function matrixMultiply(block: Block, arg1: Value, arg2: Value): Value {
  if (arg1.type.repr.type == "void" || arg2.type.repr.type == "void") {
    issue(`Cannot matrix multiply a void value.`)
  }

  const r1 = arg1.type.repr
  const r2 = arg2.type.repr

  // mat * vec = vec
  if (r1.type == "mat" && r2.type == "vec" && r2.of == "float") {
    if (r1.cols == r1.rows && r1.rows == r2.count) {
      if (block.props.lang == "glsl") {
        return new Value(`(${arg1.value})*(${arg2.value})`, arg2.type)
      } else {
        const a1scalars = toScalars(arg1, block)
        const a2scalars = toScalars(arg2, block)
        a1scalars // [c1r1 c1r2 .. c1rn] .. [cnr1 cnr2 .. cnrn]
        a2scalars // r1 r2 r3 ..

        return fromScalars(
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
            return new Value(r, _.type)
          }),
        )
      }
    } else {
      todo(
        `Can only multiply matrices and vectors if the matrix is square and the vector has the same size as the matrix.`,
      )
    }
  }

  todo(
    `Cannot multiply '${arg1.type}' by '${arg2.type}' via matrix multiplication.`,
  )
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
  } else if (node instanceof StmtLet) {
    const { ident: identName, type } = node
    if (!identName) {
      issue(`Missing identifier for 'let' statement.`)
    }
    const init = node.value?.value
    if (!init) {
      todo(`'let' statements must have initializers for now.`)
    }
    let value = emitExpr(init, block)
    if (type) {
      value = emitType(type.type, block.decl).convertFrom(value)
    }
    if (value.type.repr.type == "void") {
      todo(`'let' statements cannot have void values.`)
    }
    const gid = ident(identName.val)
    const lid = new Id(identName.val)
    block.locals.set(gid, new Value(lid.ident(), value.type, true))
    block.source += `${block.lang == "glsl" ? value.type.emit : "var"} ${lid.ident()}=${value};`
    return new Value(null, block.decl.void)
  } else {
    todo(`Cannot emit '${node.constructor.name}' as a statement yet.`)
  }
}

export type ItemResult = {
  decl?: string
  declTy?: string
  declNya?: { name: string; of: string; kind: "type" | "fn" }[]
} | null

export function emitItem(node: NodeItem, decl: Declarations): ItemResult {
  if (node instanceof ItemStruct) {
    const ids = node.name.items.map((x) => ident(x.val))
    if (ids.length == 0) {
      issue(`Missing name in struct declaration.`)
    }
    const label =
      ids.length == 1 ? `struct '${ids[0]}'` : `structs ${list(ids, null)}`
    if (!node.fields) {
      issue(`Missing fields when declaring ${label}.`)
    }
    if (node.tparams) {
      issue("Type parameters are not supported yet.")
    }
    for (const id of ids) {
      if (
        !decl.types.canDefine(id) ||
        ids.reduce((a, b) => a + +(b == id), 0) != 1
      ) {
        issue(`Type '${id}' was declared multiple times.`)
      }
    }
    const fields: { name: string; type: Type }[] = []
    for (const { name, type } of node.fields.items) {
      if (!name) {
        issue(`Missing name for field when declaring ${label}.`)
      }
      const ty = emitType(type, decl)
      fields.push({ name: name.val, type: ty })
    }
    const group = new Id("struct group")
    const result = ids.map((id) =>
      Struct.of(decl.props, id.label, fields, node.kw.kind == KMatrix, group),
    )
    if (node.kw.kind == KMatrix && result[0]!.struct.repr.type != "mat") {
      issue(`Unable to create ${label} as a matrix.`)
    }
    const type =
      result.length == 1 ?
        result[0]!.struct
      : new Alt(result.map((x) => x.struct))
    let accessors!: readonly Fn[]
    result.forEach(
      (x) => (accessors = x.struct.createAccessors(decl.props, type)),
    )
    for (let i = 0; i < ids.length; i++) {
      decl.types.set(ids[i]!, result[i]!.struct)
    }
    for (const fn of accessors) {
      decl.fns.push(fn.id as GlobalId, fn)
    }
    return {
      decl:
        result
          .map((x) => x.decl)
          .filter((x) => x)
          .join("\n") || undefined,
      declTy:
        result
          .map((x) => x.declTyOnly)
          .filter((x) => x)
          .join("\n") || undefined,
      declNya: result.map((x) => ({
        name: x.struct.name,
        of: x.struct.declaration(),
        kind: "type",
      })),
    }
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
          .join(",")}) {${block.source}${returnValue(value)}} // ${fname}`
      : `function ${lident}(${params
          .filter((x) => x.type.repr.type != "void")
          .map((x) => x.name.ident())
          .join(",")}) {${block.source}${returnValue(value)}} // ${fname}`

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
    return {
      decl: body,
      declNya: [{ name: fn.id.label, of: fn.declaration(), kind: "fn" }],
    }
  } else if (node instanceof ItemTypeAlias) {
    const val = node.ident?.val
    if (!val) {
      issue(`Missing name for type alias.`)
    }

    const id = ident(val)
    if (!decl.types.canDefine(id)) {
      issue(`Type '${id}' was declared twice.`)
    }
    if (!node.of) {
      issue(`Type alias '${id}' is missing an aliased type.`)
    }

    const ty = emitType(node.of, decl)
    decl.types.init(id, ty)

    return {
      // TODO: should this output a ts type alias?
      declNya: [
        {
          name: node.ident.val,
          of: `type ${node.ident.val} = ${ty};`,
          kind: "type",
        },
      ],
    }
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
