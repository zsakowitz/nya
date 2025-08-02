import type { Pos } from "!/ast/issue"
import { issueError } from "@/error"
import { createTypedArray, type Coercion } from "./coerce"
import { Block } from "./decl"
import { list, matrixMultiply } from "./emit"
import { ident, type IdGlobal } from "./id"
import { ArrayEmpty, isArrayValue, NyaArray } from "./type"
import { Value } from "./value"

const ID_MATMUL = ident("@#")

type CallResult = { ok: true; value: Value } | { ok: false; error: Error }

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
  }

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
    // If a function takes a single array, it works if a spread parameter is passed to it
    if (fn.kind.type == "spread") {
      // If no arguments, skip overload
      if (args.length == 0) {
        continue overloads
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

        continue overloads
      }

      // If a single array, use it
      const a0 = args[0]!
      if (args.length == 1 && isArrayValue(a0.type)) {
        if (a0.type == ArrayEmpty) {
          return { ok: true, value: fn.run([a0], block, namePos, fullPos) }
        }

        const ty = a0.type as NyaArray

        if (ty.item == into) {
          return { ok: true, value: fn.run([a0], block, namePos, fullPos) }
        }

        continue overloads
      }

      // We have a mixture of arrays and scalars; perform broadcasting and clipping
      let count = Infinity
      const cached: Value[] = []
      for (const arg of args) {
        if (arg.type == ArrayEmpty) {
          count = 0
          // no need to cache it since we won't used the cached values
        } else if (arg.type instanceof NyaArray) {
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
                arg.type instanceof NyaArray ?
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

    const coercions: Coercion[] = []

    for (let i = 0; i < count; i++) {
      const expected = fn.args[i]!.type
      const actual = args[i]!.type
      if (expected.canConvertFrom(actual)) continue

      const coercion = block.decl.coercions.for(actual, expected)
      if (!coercion) continue overloads
      coercions[i] = coercion
    }

    const args2 = args.map((arg, i) =>
      coercions[i] ?
        coercions[i].exec(arg, block, fullPos)
      : fn.args[i]!.type.convertFrom(arg, fullPos),
    )

    const value = fn.run(args2, block, namePos, fullPos)

    return { ok: true, value }
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
