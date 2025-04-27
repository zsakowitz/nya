import type { EmitBlock } from "./block"
import { isConstValueEq, type ConstValue } from "./const-value"
import { nextId, type Id } from "./id"
import type { Lang } from "./lang"
import type { DynValue, ValueConst } from "./value"

export class VTypeRaw {
  constructor(
    readonly id: Id,
    readonly emit: (
      value: DynValue,
      args: ConstValue[],
      lang: Lang,
      block: EmitBlock,
    ) => string,
  ) {}

  toString(): string {
    throw new Error("Cannot stringify a type.")
  }
}

export class VType {
  constructor(
    readonly raw: VTypeRaw,
    readonly args: ValueConst[],
  ) {}

  toString(): string {
    throw new Error("Cannot stringify a type.")
  }

  is(other: VType) {
    return (
      this.raw.id === other.raw.id &&
      this.args.length === other.args.length &&
      this.args.every((a, i) => isConstValueEq(a.value, other.args[i]!.value))
    )
  }
}

export const VUint = new VType(
  new VTypeRaw(nextId(), (v) => {
    if (typeof v == "string") {
      return `(${v})`
    }
    if (typeof v == "number") {
      return `(${v})`
    }
    throw new Error("Value of type 'uint' was stored incorrectly.")
  }),
  [],
)

export const VReal = new VType(
  new VTypeRaw(nextId(), (v) => {
    if (typeof v == "string") {
      return `(${v})`
    }
    if (typeof v == "number") {
      return `(${v.toExponential()})`
    }
    throw new Error("Value of type 'real' was stored incorrectly.")
  }),
  [],
)

export const VBool = new VType(
  new VTypeRaw(nextId(), (v) => {
    if (typeof v == "string") {
      return `(${v})`
    }
    if (typeof v == "boolean") {
      return `(${v})`
    }
    throw new Error("Value of type 'bool' was stored incorrectly.")
  }),
  [],
)

export const VSym = new VType(
  new VTypeRaw(nextId(), (v) => {
    if (typeof v == "string") {
      return `(${v})`
    }
    if (typeof v == "number") {
      return `(${v})`
    }
    throw new Error("Value of type 'sym' was stored incorrectly.")
  }),
  [],
)
