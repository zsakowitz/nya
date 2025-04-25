import type { EmitBlock } from "./block"
import { nextId, type Id } from "./id"
import type { Lang } from "./lang"
import type { DynValue } from "./value"

export class Type {
  constructor(
    readonly id: Id,
    readonly emit: (value: DynValue, lang: Lang, block: EmitBlock) => string,
  ) {}

  toString(): string {
    throw new Error("Cannot stringify a type.")
  }
}

export const YUint = new Type(nextId(), (v) => {
  if (typeof v == "string") {
    return `(${v})`
  }
  if (typeof v == "number") {
    return `(${v})`
  }
  throw new Error("Value of type 'uint' was stored incorrectly.")
})

export const YReal = new Type(nextId(), (v) => {
  if (typeof v == "string") {
    return `(${v})`
  }
  if (typeof v == "number") {
    return `(${v.toExponential()})`
  }
  throw new Error("Value of type 'real' was stored incorrectly.")
})

export const YBool = new Type(nextId(), (v) => {
  if (typeof v == "string") {
    return `(${v})`
  }
  if (typeof v == "boolean") {
    return `(${v})`
  }
  throw new Error("Value of type 'bool' was stored incorrectly.")
})

export const YSym = new Type(nextId(), (v) => {
  if (typeof v == "string") {
    return `(${v})`
  }
  if (typeof v == "number") {
    return `(${v})`
  }
  throw new Error("Value of type 'sym' was stored incorrectly.")
})
