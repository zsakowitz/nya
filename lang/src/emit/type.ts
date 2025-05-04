import type { Id } from "./id"
import type { EmitProps } from "./props"
import type { GlslRepr, GlslReprScalar } from "./repr"

export class ScalarTy {
  constructor(
    readonly id: Id,
    readonly emit: (props: EmitProps) => string,
    readonly repr: GlslReprScalar,
  ) {}

  toString() {
    return this.id.label
  }

  cons(value: string[]) {
    return value[0]!
  }

  eq(other: Type) {
    return other == this
  }
}

export class Struct {
  constructor(
    readonly id: Id,
    readonly emit: string,
    readonly repr: GlslRepr,
    readonly fields: { id: Id; type: Type; get: (source: string) => string }[],
    readonly cons: (of: string[]) => string,
  ) {}

  toString() {
    return this.id.label
  }

  eq(other: Type) {
    return other == this
  }
}

const arrayCache = new WeakMap<Type, Record<number, Array>>()

export class Array {
  constructor(
    readonly of: Type,
    readonly size: number,
  ) {
    const l1 = arrayCache.get(of)

    const cached = l1?.[size]
    if (cached != null) return cached

    if (l1 == null) {
      const l1 = Object.create(null)
      l1[size] = this
      arrayCache.set(of, l1)
    } else {
      l1[size] = this
    }

    this.repr = { type: "array", of: of.repr, size }
  }

  toString() {
    let of = this.of
    const sizes = [this.size]
    while (of instanceof Array) {
      sizes.push(of.size)
      of = of.of
    }
    return `[${of}; ${sizes.join(", ")}]`
  }

  readonly repr!: GlslRepr
}

export type Type = ScalarTy | Struct | Array
