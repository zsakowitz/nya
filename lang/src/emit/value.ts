import type { EmitBlock } from "./block"
import type { ConstValue } from "./const-value"
import type { Lang } from "./lang"
import type { VType } from "./type"

export type DynValue = string | ConstValue | readonly DynValue[]

export class Value {
  constructor(
    readonly type: VType,
    readonly value: DynValue,
  ) {}

  emit(lang: Lang, block: EmitBlock): string {
    return this.type.raw.emit(
      this.value,
      this.type.args.map((x) => x.value),
      lang,
      block,
    )
  }

  toString(): string {
    throw new Error("Cannot convert a value to a string.")
  }
}

export class ValueConst extends Value {
  declare readonly value: ConstValue // declared in superclass

  constructor(type: VType, value: ConstValue) {
    super(type, value)
  }
}
