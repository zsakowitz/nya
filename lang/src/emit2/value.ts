import { bug } from "./error"
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

  toRuntime() {
    if (typeof this.value == "string" || this.value == null) {
      return this.value
    }

    return this.type.toRuntime(this.value)
  }

  toString(): string {
    const val = this.toRuntime()
    if (val == null) {
      bug("A null value was produced while printing a value.")
    }
    return val
  }
}
