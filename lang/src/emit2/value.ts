import type { Type } from "./type"

export type ConstValue = number | boolean | ConstValue[]

export class Value {
  constructor(
    readonly value: string | null | ConstValue,
    readonly type: Type,
  ) {}

  const(): this is { value: ConstValue } {
    return typeof this.value != "string"
  }

  toString(): string {
    if (typeof this.value == "string") {
      return this.value
    }

    return "<idk>" // FIXME:
  }
}
