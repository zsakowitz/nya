import type { Pos } from "!/ast/issue"
import { issueError } from "@/error"
import { createTypedArray, type Coercion } from "./coerce"
import type { Block } from "./decl"
import { list, matrixMultiply } from "./emit"
import { ident, type IdGlobal } from "./id"
import { Value } from "./value"

/**
 * Desmos has three types of functions involving arrays. In nyalang, these are
 * classified as "single", "spread", and "mixed".
 *
 * (For convenience, we will refer to non-array values as scalars, even though
 * the rest of project nya's has a different definition for scalar).
 *
 * **single**: `fn single(x: scalar, y: scalar, ...) -> scalar`. A `single` fn
 * has only non-array arguments, and a non-array return type. It can be called
 * in these ways:
 *
 * - If all arguments are scalar, the result is scalar.
 * - If any argument is an array, let `L` be the length of the shortest array.
 *   Then the function is invoked `L` times, with one value from each array and
 *   a copy of any provided scalars, and is returned as an array. Argument
 *   arrays longer than `L` items are effectively clipped.
 *
 * Examples from Desmos:
 *
 * - `2+3 = 5`, `real(2+3i) = 2`
 * - `[2,3]+4 = [6,7]`, `[2,3]+[4,7,6] = [6,10]`
 *
 * **spread**: `fn spread(x: array) -> scalar`. A `spread` fn has a single array
 * argument and a non-array return type. It can be called in these ways:
 *
 * - If a single array argument is provided, it is passed to the function as
 *   normal.
 * - If no arguments are provided, the function is not considered as a valid
 *   overload.
 * - If only scalar arguments are provided, they are passed to the function as an
 *   array.
 * - If at least two arguments are provided, and not all of them are scalars,
 *   single-style list broadcasting is invoked, but instead of passing
 *   `f(a,b,c)` with three arguments, it is passed `[a,b,c]` (i.e. one element
 *   from each array or scalar).
 *
 * Examples from Desmos:
 *
 * - `mean([3,7]) = 5`, `mean([]) = nan`
 * - `mean()` errors
 * - `mean(3,7) = 5`
 * - `mean(3,[5,7]) = [mean(3,5),mean(3,7)] = [4,5]`
 *
 * `mixed` fns are any fns which do not fit the above categories. Those can only
 * be called as their declared signature.
 */
// @ts-ignore
let _explanation

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

  nextOverload: for (const fn of fns) {
    // If a function takes a single array, it works if a spread parameter is passed to it
    if (fn.kind.type == "spread") {
      const expected = fn.kind.arg

      const items = args.map((x) => {
        // const ty = x.type instanceof NyaArray?x.type
      })

      if (
        args.every(
          (x) =>
            x.type == expected || block.decl.coercions.has(x.type, expected),
        )
      ) {
        const coerced = args.map((x) =>
          x.type == expected ?
            x
          : block.decl.coercions.for(x.type, expected)!.exec(x, block, fullPos),
        )

        const array = createTypedArray(coerced, block, expected)
        return { ok: true, value: fn.run([array], block, namePos, fullPos) }
      }

      continue nextOverload
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
      if (!coercion) continue nextOverload
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
