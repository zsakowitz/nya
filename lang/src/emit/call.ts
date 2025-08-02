import type { Pos } from "!/ast/issue"
import { issueError } from "@/error"
import { createTypedArray } from "./coerce"
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

        const ty = a0.type as NyaArray

        if (ty.item == into) {
          return { ok: true, value: fn.run([a0], block, namePos, fullPos) }
        }

        continue
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
            (arg.type instanceof NyaArray ?
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
        } else if (arg.type instanceof NyaArray) {
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
              arg.type instanceof NyaArray ?
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

      continue overloads
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
