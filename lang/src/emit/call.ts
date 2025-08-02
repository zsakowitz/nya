import type { Pos } from "!/ast/issue"
import { issueError } from "@/error"
import type { Coercion } from "./coerce"
import type { Block } from "./decl"
import { list, matrixMultiply } from "./emit"
import { ident, type IdGlobal } from "./id"
import type { Value } from "./value"

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

  nextOverload: for (const x of fns) {
    if (x.args.length != count) continue

    const coercions: Coercion[] = []

    for (let i = 0; i < count; i++) {
      const expected = x.args[i]!.type
      const actual = args[i]!.type
      if (expected.canConvertFrom(actual)) continue

      const coercion = block.decl.coercions.for(actual, expected)
      if (!coercion) continue nextOverload
      coercions[i] = coercion
    }

    const args2 = args.map((arg, i) =>
      coercions[i] ?
        coercions[i].exec(arg, block, fullPos)
      : x.args[i]!.type.convertFrom(arg, fullPos),
    )

    const value = x.run(args2, block, namePos, fullPos)

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
