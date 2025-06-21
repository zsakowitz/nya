import { bug } from "./error"
import type { Type } from "./type"

export type ConstValue =
  | number
  | boolean
  | { data: unknown }
  | ConstValue[]
  | string

export class Value {
  readonly _const

  constructor(
    value: ConstValue,
    type: Type,
    isConst: true,
    assignable?: boolean,
  )

  constructor(
    value: string | null,
    type: Type,
    isConst: false,
    assignable?: boolean,
  )

  constructor(
    readonly value: string | null | ConstValue,
    readonly type: Type,
    isConst: boolean,
    readonly assignable = false,
  ) {
    this._const = isConst
  }

  const(): this is { value: ConstValue } {
    return this._const
  }

  toRuntime(): string | null {
    if (this.const()) {
      return this.type.toRuntime(this.value)
    } else {
      return this.value as string | null
    }
  }

  toString(): string {
    const val = this.toRuntime()
    if (val == null) {
      bug("A null value was produced while printing a value.")
    }
    return val
  }

  toScalars() {
    return this.type.toScalars(this)
  }

  unsafeWithType(type: Type) {
    return new Value(this.value as any, type, this._const as false)
    // technically false but whatever
  }
}
