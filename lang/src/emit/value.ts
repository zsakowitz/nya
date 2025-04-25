import type { EmitBlock } from "./block"
import type { Lang } from "./lang"
import type { VType } from "./type"

export type ConstValue = number | boolean | readonly ConstValue[]
export type DynValue = string | ConstValue | readonly DynValue[]

export class Value {
  constructor(
    readonly type: VType,
    readonly value: DynValue,
  ) {}

  emit(lang: Lang, block: EmitBlock): string {
    return this.type.emit(this.value, lang, block)
  }

  toString(): string {
    throw new Error("Cannot convert a value to a string.")
  }
}
