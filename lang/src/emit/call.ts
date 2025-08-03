import type { Pos } from "!/ast/issue"
import { issue, issueError } from "@/error"
import { createTypedArray, getCommonSupertype } from "./coerce"
import { Block } from "./decl"
import { list, matrixMultiply } from "./emit"
import { Id, ident, type IdGlobal } from "./id"
import { ArrayEmpty, FixedArray, isArrayValue } from "./type"
import { Value } from "./value"

const ID_MATMUL = ident("@#")
const ID_JOIN = ident("join")

type CallResult = { ok: true; value: Value } | { ok: false; error: Error }

// special-cased since it's polymorphic to the core
function fnJoin(args: Value[], block: Block, pos: Pos): Value {
  args = args.filter((x) => x.type != ArrayEmpty)
  if (args.length == 0) {
    return new Value(0, ArrayEmpty, true)
  }

  const st = getCommonSupertype(
    args.map((x) => (x.type instanceof FixedArray ? x.type.item : x.type)),
    block.decl,
  )
  if (st.type == "no-items") {
    return new Value(0, ArrayEmpty, true)
  }
  if (st.type == "impossible") {
    issue(
      `Cannot join ${list(
        args.map((x) => x.type),
        null,
      )}.`,
      pos,
    )
  }

  const into = st.type == "identical" ? st.as : st.into

  const coerced =
    st.type == "identical" ?
      args
    : args.map((x) =>
        block.decl.coercions.coerce(
          x,
          x.type instanceof FixedArray ?
            new FixedArray(block.props, into, x.type.count)
          : into,
          block,
          pos,
        ),
      )

  const count = args.reduce(
    (a, b) => a + (b.type instanceof FixedArray ? b.type.count : 1),
    0,
  )

  const type = new FixedArray(block.props, into, count)

  if (block.lang == "js") {
    return new Value(
      `[${coerced.map((x) => (x.type instanceof FixedArray ? "..." + x : x)).join(",")}]`,
      type,
      false,
    )
  }

  const retId = new Id("join result").ident()
  const ret = new Value(retId, type, false)
  const idxId = new Id("join index").ident()
  block.source += `${type.emit} ${retId};`
  let min = 0
  for (const el of coerced) {
    if (el.type instanceof FixedArray) {
      const cached = block.cache(el, true)
      block.source += `for(int ${idxId}=0;${idxId}<${el.type.count};${idxId}++)${retId}[${idxId}+${min}]=${cached}[${idxId}];`
      min += el.type.count
    } else {
      block.source += `${retId}[${min}]=${el};`
      min++
    }
  }
  return ret
}

export function performCallRaw(
  id: IdGlobal,
  block: Block,
  args: Value[],
  namePos: Pos,
  fullPos: Pos,
): CallResult {
  // Matrix multiplication is special; exit early and do not perform coercion
  if (id == ID_MATMUL) {
    if (args.length == 2) {
      return { ok: true, value: matrixMultiply(block, args[0]!, args[1]!) }
    }
  } else if (id == ID_JOIN) {
    return { ok: true, value: fnJoin(args, block, fullPos) }
  }
  // TODO: special-case count

  const local = block.locals.get(id)

  // Locals have no arguments; exit early and do not perform coercion
  if (local) {
    if (args.length == 0) {
      return { ok: true, value: local }
    }
  }

  const fns = block.decl.fns.get(id)

  // No overloads exist; exit early
  if (!fns) {
    return {
      ok: false,
      error:
        local ?
          issueError(
            `Locally defined variable '${id}' is not a function.`,
            namePos,
          )
        : issueError(`'${id}' is not defined.`, namePos),
    }
  }

  const count = args.length // quick filter for proper overloads
  const cx = block.decl.coercions

  overloads: for (const fn of fns) {
    // fast path for constants
    if (fn.kind.type == "const") {
      if (count != 0) {
        continue
      }

      return { ok: true, value: fn.run([], block, namePos, fullPos) }
    } else if (count == 0) continue

    // If a function takes a single array, it works if a spread parameter is passed to it
    // TODO: make this work with coercion
    if (fn.kind.type == "spread") {
      // If no arguments, skip overload
      if (args.length == 0) {
        continue
      }

      const into = fn.kind.arg

      // If all scalars, coerce scalars into one array and use it
      if (args.every((x) => !isArrayValue(x.type))) {
        if (args.every((x) => cx.can(x.type, into))) {
          const array = createTypedArray(
            args.map((x) => cx.coerce(x, into, block, fullPos)),
            block,
            into,
          )
          return { ok: true, value: fn.run([array], block, namePos, fullPos) }
        }

        continue
      }

      // If a single array, use it
      const a0 = args[0]!
      if (args.length == 1 && isArrayValue(a0.type)) {
        if (a0.type == ArrayEmpty) {
          return { ok: true, value: fn.run([a0], block, namePos, fullPos) }
        }

        if (!cx.can(a0.type, fn.args[0]!.type)) {
          continue
        }

        return {
          ok: true,
          value: fn.run(
            [cx.coerce(a0, fn.args[0]!.type, block, fullPos)],
            block,
            namePos,
            fullPos,
          ),
        }
      }

      // We have a mixture of arrays and scalars; perform broadcasting and clipping
      let count = Infinity
      const cached: Value[] = []
      for (const arg of args) {
        if (arg.type == ArrayEmpty) {
          count = 0
          // no need to cache it since we won't used the cached values
        } else if (arg.type instanceof FixedArray) {
          if (!cx.can(arg.type.item, into)) {
            continue overloads
          }
          if (arg.type.count < count) {
            count = arg.type.count
          }
          if (count != 0) {
            cached.push(block.cache(arg, true))
          }
        } else {
          if (!cx.can(arg.type, into)) {
            continue overloads
          }
          if (count != 0) {
            cached.push(block.cache(arg, true))
          }
        }
      }
      if (count == 0) {
        return { ok: true, value: new Value(0, ArrayEmpty, true) }
      }

      return {
        ok: true,
        value: block.map(count, (index, block) => {
          const args = createTypedArray(
            cached.map((arg) =>
              cx.coerce(
                arg.type instanceof FixedArray ?
                  new Value(`(${arg})[${index}]`, arg.type.item, false)
                : arg,
                into,
                block,
                fullPos,
              ),
            ),
            block,
            into,
          )
          return fn.run([args], block, namePos, fullPos)
        }),
      }
    }

    if (fn.args.length != count) {
      continue
    }

    // If a function only accepts scalars, do list broadcasting on it
    if (fn.kind.type == "single") {
      // Path 1: No arrays involved
      if (!args.some((x) => isArrayValue(x.type))) {
        if (!args.every((arg, i) => cx.can(arg.type, fn.args[i]!.type))) {
          continue overloads
        }

        const args2 = args.map((arg, i) =>
          cx.coerce(arg, fn.args[i]!.type, block, fullPos),
        )

        return {
          ok: true,
          value: fn.run(args2, block, namePos, fullPos),
        }
      }

      // Path 2: Arrays involved
      if (
        !args.every(
          (arg, i) =>
            arg.type == ArrayEmpty ||
            (arg.type instanceof FixedArray ?
              cx.can(arg.type.item, fn.args[i]!.type)
            : cx.can(arg.type, fn.args[i]!.type)),
        )
      ) {
        continue overloads
      }

      let len = Infinity
      const cached: Value[] = []
      for (const arg of args) {
        if (arg.type == ArrayEmpty) {
          len = 0
        } else if (arg.type instanceof FixedArray) {
          if (arg.type.count < len) {
            len = arg.type.count
          }
          if (len != 0) {
            cached.push(block.cache(arg, true))
          }
        } else {
          if (len != 0) {
            cached.push(block.cache(arg, true))
          }
        }
      }
      if (len == 0) {
        return { ok: true, value: new Value(0, ArrayEmpty, true) }
      }

      return {
        ok: true,
        value: block.map(len, (index, block) => {
          const args = cached.map((arg, i) =>
            cx.coerce(
              arg.type instanceof FixedArray ?
                new Value(`(${arg})[${index}]`, arg.type.item, false)
              : arg,
              fn.args[i]!.type,
              block,
              fullPos,
            ),
          )
          return fn.run(args, block, namePos, fullPos)
        }),
      }
    }

    if (!args.every((arg, i) => cx.can(arg.type, fn.args[i]!.type))) {
      continue
    }

    return {
      ok: true,
      value: fn.run(
        args.map((arg, i) => cx.coerce(arg, fn.args[i]!.type, block, fullPos)),
        block,
        namePos,
        fullPos,
      ),
    }
  }

  // No overloads found; return an error
  return {
    ok: false,
    error: issueError(
      `No overload of '${id}' accepts ${list(
        args.map((x) => x.type),
        "no arguments",
      )}. Try:` + fns.map((x) => "\n" + x.toString()).join(""),
      fullPos,
    ),
  }
}

export function tryPerformCall(
  id: IdGlobal,
  block: Block,
  args: Value[],
  namePos: Pos,
  fullPos: Pos,
): Value | null {
  const result: CallResult = performCallRaw(id, block, args, namePos, fullPos)

  if (result.ok) {
    return result.value
  } else {
    return null
  }
}

export function performCall(
  id: IdGlobal,
  block: Block,
  args: Value[],
  namePos: Pos,
  fullPos: Pos,
): Value {
  const result: CallResult = performCallRaw(id, block, args, namePos, fullPos)

  if (result.ok) {
    return result.value
  } else {
    throw result.error
  }
}
