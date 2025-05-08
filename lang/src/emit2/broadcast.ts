import { issue } from "../emit/error"
import type { Block } from "./decl"
import { bug } from "./error"
import type { Repr } from "./repr"
import type { Fn } from "./type"
import type { Value } from "./value"

export function canAutomaticallyBroadcast(repr: Repr) {
  return repr.type == "vec"
}

export function toScalars(value: Value, block: Block) {
  return value.type.toScalars(block.cache(value))
}

/**
 * A `FnBroadcast` promises that in GLSL, its source text is still valid even if
 * a vector and scalar, or a scalar and vector, or a vector and another vector
 * of equal length are plugged in.
 *
 * Normally, a `Fn` is always called with arguments of the correct type, but a
 * `FnBroadcast` will call its underlying function with arguments of vectors of
 * the expected type. This will only happen if at least one argument is not
 * const; if both arguments are const, the function will receive const arguments
 * with the expected types. The return value of the `Fn` will also be ignored
 * and overriden.
 */
export class FnBroadcast {
  constructor(fn: Fn) {
    const r0 = fn.ret.repr
    if (!(r0.type == "vec" && r0.count == 1)) {
      bug(`Cannot construct `)
    }

    switch (fn.args.length) {
      case 1: {
        const r1 = fn.args[0]!.type.repr
        if (!(r1.type == "vec" && r1.count == 1)) {
          bug(
            `Cannot construct a unary broadcast function unless the first argument is expected to be a single-element vector.`,
          )
        }
        break
      }
      case 2: {
        const r1 = fn.args[0]!.type.repr
        const r2 = fn.args[1]!.type.repr
        if (
          !(
            r1.type == "vec" &&
            r1.count == 1 &&
            r2.type == "vec" &&
            r2.count == 1
          )
        ) {
          bug(
            `Cannot construct a unary broadcast function unless the first argument is expected to be a single-element vector.`,
          )
        }
        break
      }
      default:
        bug(`Cannot construct a broadcasting function`)
    }
    if (fn.args.length == 1) {
      if (fn.args[0]!.type.repr.type != "vec") {
        throw new Error()
      }
    }
  }
}

export function broadcastBinary(
  _op: FnBroadcast,
  block: Block,
  arg1: Value,
  arg2: Value,
) {
  const r1 = arg1.type.repr
  const r2 = arg2.type.repr

  if (r1.type != "vec" || r2.type != "vec") {
    issue("Automatic broadcasting is only supported on vectors.")
  }

  const s1 = toScalars(arg1, block)
  const s2 = toScalars(arg2, block)

  if (block.lang == "glsl") {
    if (s1.length == 1 && s2.length > 1) {
    }
  }
}
