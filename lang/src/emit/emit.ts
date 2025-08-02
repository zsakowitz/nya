import { Pos } from "../ast/issue"
import {
  KBreak,
  KContinue,
  KMap,
  KMatrix,
  KReturn,
  OEq,
  TBuiltin,
} from "../ast/kind"
import { ExposePackage, type NodeExpose } from "../ast/node/expose"
import {
  ExprArray,
  ExprArrayByRepetition,
  ExprBinary,
  ExprBinaryAssign,
  ExprBlock,
  ExprDirectCall,
  ExprEmpty,
  ExprExit,
  ExprFor,
  ExprIf,
  ExprIndex,
  ExprLit,
  ExprParen,
  ExprProp,
  ExprRange,
  ExprStruct,
  ExprTaggedString,
  ExprUnary,
  ExprVar,
  type NodeExpr,
} from "../ast/node/expr"
import { FnReturnTypeTypeof, List } from "../ast/node/extra"
import {
  ItemExpose,
  ItemFn,
  ItemLet,
  ItemStruct,
  ItemTypeAlias,
  type NodeItem,
} from "../ast/node/item"
import { StmtExpr, StmtLet, type NodeStmt } from "../ast/node/stmt"
import {
  TypeAlt,
  TypeArray,
  TypeArrayUnsized,
  TypeEmpty,
  TypeParen,
  TypeVar,
  type NodeType,
} from "../ast/node/type"
import { fromScalars, scalars } from "./broadcast"
import { performCall, tryPerformCall } from "./call"
import { Coercion, isEligibleForCoercion, type CoercionTarget } from "./coerce"
import { Block, BlockGlobals, Exits, IdMap, type Declarations } from "./decl"
import { bug, issue, todo } from "./error"
import { Id, ident, type IdGlobal } from "./id"
import {
  Alt,
  AnyArray,
  Array,
  ArrayEmpty,
  Fn,
  isType,
  Struct,
  type Type,
  type UserFnType,
} from "./type"
import { Value } from "./value"

export function list(
  a: { toString(): string }[],
  empty: "no arguments" | null,
) {
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

function emitTypeGeneric(node: NodeType, decl: Declarations): UserFnType {
  if (node instanceof TypeParen) {
    return emitTypeGeneric(node.of, decl)
  } else if (node instanceof TypeEmpty) {
    issue("Empty type.", node)
  } else if (node instanceof TypeVar) {
    if (node.targs) {
      todo("Type arguments are not supported yet.")
    }
    const ty = decl.types.get(ident(node.name.val))
    if (!ty) {
      issue(`Type '${node.name.val}' is not defined.`, node.name)
    }
    return ty
  } else if (node instanceof TypeAlt) {
    const lhs = emitTypeGeneric(node.lhs, decl)
    const rhs = emitTypeGeneric(node.rhs, decl)
    const l =
      lhs instanceof Alt ? lhs.alts
      : lhs instanceof Struct ? [lhs]
      : issue(
          `Types may only be used in a union if both types were initially declared in a single 'struct' declaration.`,
          node,
        )
    const r =
      rhs instanceof Alt ? rhs.alts
      : rhs instanceof Struct ? [rhs]
      : issue(
          `Types may only be used in a union if both types were initially declared in a single 'struct' declaration.`,
          node,
        )
    return new Alt([...l, ...r])
  } else if (node instanceof TypeArray) {
    const item = emitTypeGeneric(node.of, decl)
    if (!isType(item)) {
      issue(`The element type of an array must be a concrete type.`)
    }
    if (item instanceof Array || node.sizes.items.length != 1) {
      todo(`Multidimensional arrays are not supported yet.`)
    }
    const count = arraySize(
      decl.toArraySize(
        emitExpr(
          node.sizes.items[0]!,
          new Block(new BlockGlobals(decl), new Exits(null)),
        ),
      ),
      node.sizes,
    )
    return new Array(decl.props, item, count)
  } else if (node instanceof TypeArrayUnsized) {
    const item = emitTypeGeneric(node.of.value, decl)
    if (!isType(item)) {
      issue(`The element type of an array must be a concrete type.`)
    }
    return new AnyArray(decl.props, item)
  } else {
    todo(`Cannot emit '${node.constructor.name}' as a type yet.`)
  }
}

function emitType(node: NodeType, decl: Declarations): Type {
  const ty = emitTypeGeneric(node, decl)
  if (isType(ty)) {
    return ty
  }
  issue(`Expected concrete type, but found ${ty} instead.`, node)
}

function arraySize(size: number | null, pos: Pos): number {
  if (size == null) {
    issue(
      `Array sizes must be constant integers; an array's size cannot depend on local variables.`,
      pos,
    )
  }

  return size
}

export function emitExpr(node: NodeExpr, block: Block): Value {
  if (node instanceof ExprBlock) {
    return emitBlock(node, block)
  } else if (node instanceof ExprBinary) {
    if (node.op.kind == OEq) {
      const { current } = emitLvalue(node.lhs, block)
      const rhs = emitExpr(node.rhs, block)

      if (current.type.repr.type != "void") {
        // no const check since it hasn't been tested in if-else constructs
        block.source += `${current}=${rhs};`
      }
      // TODO: should we include rhs in case it has side effects?

      return nullValue(block)
    }

    return performCall(
      ident(node.op.val),
      block,
      [emitExpr(node.lhs, block), emitExpr(node.rhs, block)],
      node.op,
      node,
    )
  } else if (node instanceof ExprUnary) {
    return performCall(
      ident(node.op.val),
      block,
      [emitExpr(node.of, block)],
      node.op,
      node,
    )
  } else if (node instanceof ExprEmpty) {
    issue("Empty expression.", node)
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
      node.name,
      node,
    )
  } else if (node instanceof ExprDirectCall) {
    if (node.targs) {
      todo("Type arguments are not supported yet.")
    }
    if (!node.name1) {
      issue(
        "Function call via 'call' syntax is missing a function name.",
        node.kw,
      )
    }
    const args = node.args?.items.map((e) => emitExpr(e, block)) ?? []
    if (node.name2 != null) {
      const result = tryPerformCall(
        ident(node.name2.val),
        block,
        args,
        node.name2,
        node,
      )
      if (result != null) {
        return result
      }
    }
    return performCall(ident(node.name1.val), block, args, node.name1, node)
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
    const mapPos = new Map<string, Pos>()
    for (const arg of node.args.items) {
      map.set(
        arg.name.val,
        arg.expr ?
          emitExpr(arg.expr, block)
        : performCall(ident(arg.name.val), block, [], arg.name, arg.name),
      )
      mapPos.set(arg.name.val, arg)
    }

    return ty.with(ty.verifyAndOrderFields(map, mapPos), block)
  } else if (node instanceof ExprProp) {
    if (node.targs) {
      todo("Type arguments are not supported yet.")
    }
    if (!node.prop.name) {
      issue(`Missing property name for dotted property access.`)
    }
    return performCall(
      ident(node.prop.name.val),
      block,
      [
        emitExpr(node.on, block),
        ...(node.args?.items.map((e) => emitExpr(e, block)) ?? []),
      ],
      node.prop.name,
      node,
    )
  } else if (node instanceof ExprIf) {
    const cond = emitExpr(node.condition, block)
    const { tyBool: bool, tyVoid: void_ } = block.decl
    if (cond.type != bool) {
      issue(`The condition of an 'if' statement must be a boolean value.`)
    }
    if (cond.value == null) {
      issue(`The condition of an 'if' statement must not be void.`)
    }
    if (cond.const()) {
      if (cond.value) {
        const child = block.child(block.exits)
        if (!node.block) {
          issue(`Missing block on 'if' statement.`)
        }
        const retval = emitBlock(node.block, child)
        block.source += child.source
        return retval
      } else {
        if (!node.rest) {
          return block.decl.void()
        }
        const child = block.child(block.exits)
        if (!node.rest.block) {
          issue(`Missing block on 'else' statement.`)
        }
        const retval = emitExpr(node.rest.block, child)
        block.source += child.source
        return retval
      }
    }

    const child1 = block.child(block.exits)
    if (!node.block) {
      issue(`Missing block on 'if' statement.`)
    }
    const main = emitBlock(node.block, child1)

    const child2 = block.child(block.exits)
    let alt: Value = nullValue(block)
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
        issue(
          `Types of 'if' (${main.type}) and 'else' branches (${alt.type}) must match.`,
          node,
        )
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

      return new Value(0, main.type, true)
    }

    // Optimization for ternaries, since those are quite frequent
    if (!child1.source && !child2.source) {
      return new Value(`(${cond})?(${main}):(${alt})`, main.type, false)
    }

    const ret = new Id("return value")
    if (block.props.lang == "glsl") {
      block.source += `${main.type.emit} ${ret.ident()};`
    } else {
      block.source += `var ${ret.ident()};`
    }
    block.source += `if(${cond}){${child1.source}${ret.ident()}=${main};}else{${child2.source}${ret.ident()}=${alt};}`
    return new Value(ret.ident(), main.type, false)
  } else if (node instanceof ExprArray) {
    const items = node.of.items.map((item) => emitExpr(item, block))
    if (items.length == 0) {
      return new Value(0, ArrayEmpty, true)
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
    if (type.repr.type == "void") {
      return new Value(0, type, true)
    }

    if (items.every((x) => x.const())) {
      return new Value(
        items.map((x) => x.value),
        type,
        true,
      )
    }

    const strings = items.map((x) => x.toString())
    if (block.props.lang == "glsl") {
      return new Value(`${type.emit}(${strings.join(",")})`, type, false)
    } else {
      return new Value(`[${strings.join(",")}]`, type, false)
    }
  } else if (node instanceof ExprArrayByRepetition) {
    const item = emitExpr(node.of, block)
    if (!item.const()) {
      todo(
        `Cannot form arrays of a repeated element unless the element is a constant.`,
        node.of,
      )
    }

    if (node.sizes.items.length != 1) {
      todo(
        `Arrays by repetition can currently only be 1-dimensional.`,
        node.sizes,
      )
    }
    const count = arraySize(
      block.decl.toArraySize(emitExpr(node.sizes.items[0]!, block)),
      node.sizes,
    )

    const type = new Array(block.props, item.type, count)
    return new Value(
      type.repr.type == "void" ?
        0
      : globalThis.Array.from({ length: count }, () => item.value),
      type,
      true,
    )
  } else if (node instanceof ExprFor) {
    // TODO: some for loops can be evaluated at const time

    const expr = node
    if (node.kw.kind == KMap) {
      todo(`'map' loops are not supported yet.`)
    }
    if (node.headers.items.length != 1) {
      todo(`'for' loops with multiple headers are not supported yet.`)
    }
    const header = expr.headers.items[0]
    if (header?.bound.items.length != header?.sources.items.length) {
      issue(
        `'for' loops must have the same number of bound variables and sources.`,
      )
    }
    if (!header?.sources.items.length) {
      issue(`'for' loops must have at least one source.`)
    }
    if (!expr.block) {
      issue(`Missing body of 'for' loop.`)
    }

    // TODO: add break and continue as exits
    const child = block.child(block.exits)
    let size: number | null = null

    const index = new Id("for loop index").ident()
    for (let i = 0; i < header?.bound.items.length; i++) {
      const x = header?.bound.items[i]!

      const gid = ident(x.val)
      if (!child.locals.canDefine(gid)) {
        issue(`Variable '${gid}' was declared twice in a 'for' loop.`)
      }

      const source = emitExpr(header?.sources.items[i]!, block)

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
      const value = new Value(
        `${sourceCached}[${index}]`,
        source.type.item,
        false,
      )
      child.locals.set(gid, value)
    }

    const ret = emitBlock(expr.block, child)
    if (ret.type != block.decl.tyVoid) {
      todo(`The body of a 'for' loop must return 'void'; found '${ret.type}'.`)
    }
    block.source += `for(${block.props.lang == "glsl" ? "int" : "var"} ${index}=0;${index}<${size!};${index}++) {${child.source}}`
    return nullValue(block)
  } else if (node instanceof ExprBinaryAssign) {
    const { current, id } = emitLvalue(node.lhs, block)
    const rhs = emitExpr(node.rhs, block)
    const updated = performCall(
      ident(node.op.val),
      block,
      [current, rhs],
      node.op,
      node,
    )

    if (current.const()) {
      block.locals.set(id, updated)
    } else {
      block.source += `${current}=${updated};`
    }

    return nullValue(block)
  } else if (node instanceof ExprExit) {
    switch (node.kw.kind) {
      case KBreak:
      case KContinue:
        todo(`'${node.kw}' statements are not supported yet.`, node)

      case KReturn:
        if (node.label) {
          issue(`'return' statements cannot be labeled.`, node)
        }
        const returned = block.exits.return(
          node.value ? emitExpr(node.value, block) : nullValue(block),
          node.value ?? node.kw,
        )
        if (returned.type.repr.type == "void") {
          block.source += `return;`
        } else {
          const r = returned.toRuntime()
          block.source += r == null ? `return;` : `return(${r});`
        }
        // TODO: this should return something like TS's `never` type
        return nullValue(block)
    }
  } else if (node instanceof ExprTaggedString) {
    const tag = block.decl.tags.get(ident(node.tag.val))
    if (!tag) {
      issue(`Tag '${node.tag.val}' does not exist.`, node.tag)
    }
    const interps = node.interps.map((x) => emitExpr(x, block))
    return tag.create(
      node.parts.map((x) => x.val),
      interps,
      node.interps,
      block,
      node.tag,
      node,
    )
  } else if (node instanceof ExprRange) {
    const lb = new Block(block.globals, new Exits(null), block.locals)
    const rb = new Block(block.globals, new Exits(null), block.locals)
    const lv = emitExpr(node.lhs ?? todo(`Ranges must have lower bounds.`), lb)
    const rv = emitExpr(node.rhs ?? todo(`Ranges must have upper bounds.`), rb)
    if (lv.type != block.decl.tyNum || rv.type != block.decl.tyNum) {
      todo(`Range bounds must be of 'num' type.`, node)
    }
    if (lb.source || rb.source || !lv.const() || !rv.const()) {
      todo(`Range bounds must be simple constants.`, node)
    }
    const value = `${lv.value}..${node.eq ? "=" : ""}${rv.value}`
    if (
      !(Number.isSafeInteger as (x: unknown) => x is number)(lv.value) ||
      !(Number.isSafeInteger as (x: unknown) => x is number)(rv.value)
    ) {
      todo(`Range bounds in ${value} must be integers.`, node)
    }
    if (!(lv.value < rv.value)) {
      todo(`Range bounds in ${value} must be in proper order.`, node)
    }
    let count = rv.value - lv.value + +!!node.eq
    if (count > 64) {
      todo(
        `Range ${value} has ${count} entries, but may only contain up to 64.`,
        node,
      )
    }
    return new Value(
      `[${globalThis.Array.from({ length: count }, (_, i) => i + (lv.value as number)).join(",")}]`,
      new Array(block.props, block.decl.tyNum, count),
      false,
    )
    // TODO: NYALANG: this outputs horrible code in `for` loops, and should be optimized to a plain `for (let i = 0; i < 20; i++)` loop
  } else if (node instanceof ExprIndex) {
    const on = emitExpr(node.on, block)
    if (on.type == ArrayEmpty) {
      issue(`Empty arrays cannot be indexed.`, node.on)
    }
    if (!(on.type instanceof Array)) {
      issue(`Only arrays can be indexed.`, node.on)
    }
    const idxValue = emitExpr(node.index.value, block)
    if (!idxValue.const()) {
      todo(`Arrays can only be indexed by constants for now.`, node.index.value)
    }
    const idx =
      block.decl.toArraySize(idxValue) ??
      issue(
        `${on.type} was indexed by non-integer '${idxValue}'.`,
        node.index.value,
      )
    if (!(0 <= idx && idx < on.type.count)) {
      todo(
        `${on.type} was indexed by '${idx}', which is out of bounds.`,
        node.index.value,
      )
    }
    if (on.const()) {
      return new Value((on.value as any[])[idx]!, on.type.item, true)
    }
    return new Value(`(${on})[${idx}]`, on.type.item, false)
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
): { current: Value; id: IdGlobal } {
  if (node instanceof ExprVar) {
    if (node.targs) {
      issue("Cannot assign to something with type arguments.", node.targs)
    }
    if (node.args) {
      issue("Cannot assign to a function call.", node.args)
    }
    if (node.name.kind == TBuiltin) {
      issue("Cannot assign to a builtin function.", node.name)
    }

    const id = ident(node.name.val)
    const current = block.locals.get(id)
    if (!current) {
      issue(`Variable '${id}' is not locally defined.`, node.name)
    }
    if (!current?.assignable) {
      issue(
        `'${id}' must be a variable declared with 'let mut' in order to be assignable.`,
        node.name,
      )
    }

    return { current, id }
  } else {
    todo(`Cannot emit '${node.constructor.name}' as an assignment target yet.`)
  }
}

export function matrixMultiply(block: Block, arg1: Value, arg2: Value): Value {
  if (arg1.type.repr.type == "void" || arg2.type.repr.type == "void") {
    issue(`Cannot matrix multiply a void value.`)
  }

  const r1 = arg1.type.repr
  const r2 = arg2.type.repr

  // mat * vec = vec
  if (r1.type == "mat" && r2.type == "vec" && r2.of == "float") {
    if (r1.cols == r1.rows && r1.rows == r2.count) {
      if (block.props.lang == "glsl") {
        return new Value(`(${arg1})*(${arg2})`, arg2.type, false)
      } else {
        const a1scalars = scalars(arg1, block)
        const a2scalars = scalars(arg2, block)
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
            return new Value(r, block.decl.tyNum, false)
          }),
          block,
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

export function nullValue(block: Block) {
  return block.decl.void()
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
      value = emitType(type.type, block.decl).convertFrom(value, init)
    }
    const gid = ident(identName.val)

    if (value.type.repr.type == "void") {
      block.locals.set(gid, new Value(0, value.type, true, true))
    } else if (!node.mut && value.const()) {
      block.locals.set(gid, new Value(value.value, value.type, true))
    } else {
      const lid = new Id(identName.val)
      block.locals.set(
        gid,
        new Value(lid.ident(), value.type, false, !!node.mut),
      )
      block.source += `${block.lang == "glsl" ? value.type.emit : "var"} ${lid.ident()}=${value};`
    }

    return nullValue(block)
  } else {
    todo(`Cannot emit '${node.constructor.name}' as a statement yet.`)
  }
}

function emitExpose(node: NodeExpose, _decl: Declarations) {
  if (node instanceof ExposePackage) {
    // skip it since it should be preprocessed
  } else {
    todo(`Cannot expose '${node.constructor.name}' as an item yet.`)
  }
}

function emitItemStruct(node: ItemStruct, decl: Declarations) {
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
    decl.fns.push(fn.id as IdGlobal, fn)
  }
  decl.addTypeDeclaration(
    result
      .map((x) => x.decl)
      .filter((x) => x)
      .join("\n"),
  )
}

function emitItemFnGeneric(
  node: ItemFn,
  decl: Declarations,
  fname: string,
  retType: UserFnType,
  params: { local: IdGlobal; name: Id; type: UserFnType }[],
  locals: IdMap<Value>,
  fparams: { name: string; type: UserFnType }[],
  nodeBlock: ExprBlock,
) {
  // Preliminary run of the function; this ensures it probably has no cycles
  // (TODO: cycling might be possible via coercion abuse. not sure though)
  {
    const globals = new BlockGlobals(decl)
    const exits = new Exits(retType, true)
    const block = new Block(globals, exits, locals)
    exits.return(emitBlock(nodeBlock, block), nodeBlock, true)
  }

  const fn = new Fn(
    ident(fname),
    fparams,
    retType,
    (args, block) => {
      const locals = new IdMap<Value>(null)
      for (let i = 0; i < args.length; i++) {
        locals.set(params[i]!.local, block.cache(args[i]!, true))
      }
      const exits = new Exits(retType, true)
      const fBlock = new Block(block.globals, exits, locals)
      const retval = exits.return(emitBlock(nodeBlock, fBlock), nodeBlock, true)
      block.source += fBlock.source
      return retval
    },
    node,
  )

  decl.fns.push(ident(fname), fn)
}

function assert(x: boolean): asserts x {
  if (!x) {
    bug(`Assertion failed.`)
  }
}

function emitItemFn(node: ItemFn, decl: Declarations) {
  // Ensure all data is in order
  const fname = node.name?.val
  if (fname == null) issue(`Function declaration is missing a name.`)
  if (node.tparams) issue(`Type parameters are not supported yet.`)
  if (!node.params) issue(`Function '${fname}' is missing a parameter list.`)
  if (node.usage) todo(`The 'usage' keyword is not implemented yet.`)
  if (!node.block) issue(`Function '${fname}' is missing its contents.`)
  if (node.ret instanceof FnReturnTypeTypeof)
    todo(`Function return types may not use 'typeof' yet.`)

  // Set up for evaluation
  const ret = node.ret ? emitTypeGeneric(node.ret.retType, decl) : decl.tyVoid
  const locals = new IdMap<Value>(null)
  let fnIsGeneric = !isType(ret)
  const params = node.params.items.map((x) => {
    const local = ident(x.ident.val)
    const name = new Id(x.ident.val)
    if (locals.has(local)) {
      issue(`Parameter '${local}' is declared twice in function '${fname}'.`)
    }
    const type = emitTypeGeneric(x.type, decl)

    locals.set(
      local,
      new Value(
        name.ident(),
        isType(type) ? type : ((fnIsGeneric = true), type.concreteInstance()),
        false,
      ),
    )
    return { local, name, type }
  })
  const fparams = params.map((x) => ({ name: x.name.label, type: x.type }))

  // Perform a different series of steps if it's a generic function
  if (fnIsGeneric) {
    if (fname == "->") {
      todo(`Coercion functions cannot be generic yet.`)
    }
    emitItemFnGeneric(
      node,
      decl,
      fname,
      ret,
      params,
      locals,
      fparams,
      node.block,
    )
    return
  }
  assert(
    params.every((x): x is { local: IdGlobal; name: Id; type: Type } =>
      isType(x.type),
    ),
  )
  assert(isType(ret))

  // Do pre-checks for coercions
  let isCoercion = false
  if (fname == "->") {
    isCoercion = true
    if (fparams.length != 1) {
      issue(`Coercion functions must take exactly one argument.`, node.params)
    }
    const ptype = fparams[0]!.type
    if (!isEligibleForCoercion(ptype)) {
      issue(
        `Argument type '${ptype}' must be a scalar or struct; coercion is not allowed for other types.`,
        node.params.items[0]!,
      )
    }
    const rtype = ret
    if (!isEligibleForCoercion(rtype)) {
      issue(
        `Return type '${rtype}' must be a scalar or struct; coercion is not allowed for other types.`,
        node.ret ?? node.name!,
      )
    }
    if (fparams[0]!.type == ret) {
      issue(
        `A coercion function must define a coercion between different types.`,
      )
    }
  }

  const globals = new BlockGlobals(decl)
  const block = new Block(globals, new Exits(ret), locals)
  const value = ret.convertFrom(emitBlock(node.block, block), node.block)
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
      new Fn(
        gid,
        fparams,
        ret,
        (_, caller) => {
          caller.addGlobalsFrom(globals)
          return value
        },
        node,
      )
    : new Fn(
        gid,
        fparams,
        ret,
        (args, caller, pos) => {
          caller.addGlobalsFrom(globals)
          caller.addGlobal(body)
          const actualArgs = args.map((x, i) =>
            params[i]!.type.convertFrom(x, pos),
          )
          const expr = `${lident}(${actualArgs
            .filter((x) => x.type.repr.type != "void")
            .map((x) => x.toRuntime())
            .join(",")})`
          return new Value(expr, ret, false)
        },
        node,
      )
  // Functions names "->" are used for coercions instead of normal definitions
  if (isCoercion) {
    const coercion = new Coercion(
      fparams[0]!.type as CoercionTarget, // this was checked earlier
      ret as CoercionTarget, // this was checked earlier
      false,
      (v, block, pos) => fn.run([v], block, pos, pos),
    )

    decl.coercions.addCoercion(coercion, node)
  } else {
    decl.fns.push(gid, fn)
  }

  Object.assign(fn, { source: body })
}

function emitItemLet(node: ItemLet, decl: Declarations) {
  const fname = node.ident?.val
  if (fname == null) {
    issue(`'let' declaration is missing a name.`)
  }
  if (!node.value) {
    issue(`Function '${fname}' is missing its contents.`)
  }
  const expected = node.type ? emitType(node.type.type, decl) : null
  // even though 'let' is implemented as a function, this is an implementation
  // detail and should not be relied on. it's also harder to detect the proper
  // output type when 'return' is allowed
  const globals = new BlockGlobals(decl)
  const block = new Block(globals, new Exits(null))
  let value = emitExpr(node.value.value, block)
  if (expected) value = expected.convertFrom(value, node.value.value)
  const ret = value.type
  const lid = new Id(fname)
  const gid = ident(fname)
  const lident = lid.ident()
  const body =
    decl.props.lang == "glsl" ?
      `${ret.emit} ${lident}() {${block.source}${returnValue(value)}} // ${fname}`
    : `function ${lident}() {${block.source}${returnValue(value)}} // ${fname}`
  const fn = new Fn(
    gid,
    [],
    ret,
    block.source == "" && value.const() ?
      // Non-side-effecting constant optimization
      (_, caller) => {
        caller.addGlobalsFrom(globals)
        return value
      }
    : (_, caller) => {
        caller.addGlobalsFrom(globals)
        caller.addGlobal(body)
        return new Value(`${lident}()`, ret, false)
      },
    node,
  )
  decl.fns.push(gid, fn)
}

export function emitItem(node: NodeItem, decl: Declarations): void {
  if (node instanceof ItemStruct) {
    emitItemStruct(node, decl)
  } else if (node instanceof ItemFn) {
    emitItemFn(node, decl)
  } else if (node instanceof ItemLet) {
    emitItemLet(node, decl)
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
  } else if (node instanceof ItemExpose) {
    const items =
      node.item instanceof List ?
        node.item.items
      : [node.item ?? issue(`Expected exposable item after 'expose'.`)]

    for (const item of items) {
      emitExpose(item, decl)
    }
  } else {
    todo(`Cannot emit '${node.constructor.name}' as an item yet.`)
  }
}

function returnValue(val: Value) {
  if (val.type.repr.type == "void") {
    return ""
  }
  const text = val.toRuntime()
  if (text == null) {
    return ""
  } else {
    return `return(${text});`
  }
}
