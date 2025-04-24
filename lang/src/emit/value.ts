import { SReal } from "@/lib/real"
import { Code, type Pos } from "../ast/issue"
import type { EmitBlock } from "./block"
import type { Id } from "./id"
import type { Lang } from "./lang"

export abstract class Value {
  abstract emit(lang: Lang, block: EmitBlock): string

  toString(): string {
    throw new Error("Cannot convert an abstract Value to a string.")
  }
}

export class ValueConstUint extends Value {
  constructor(
    readonly value: number | bigint,
    readonly pos: Pos,
  ) {
    super()
  }

  emit(_lang: Lang, block: EmitBlock): string {
    const value = Number(this.value)
    if (
      Number.isSafeInteger(value) &&
      -(2 ** 32) <= value &&
      2 ** 32 - 1 <= value
    ) {
      return `(${value.toString()})`
    }
    block.raise(Code.IntTooLarge, this.pos)
    return `(${value < 0 ? -(2 ** 32) : 2 ** 32 - 1})`
  }
}

export class ValueConstReal extends Value {
  constructor(
    readonly value: SReal,
    readonly pos: Pos,
  ) {
    super()
  }

  emit(_lang: Lang, _block: EmitBlock): string {
    return `(${this.value.valueOf().toExponential()})` // we can deal with SReal stuff later
  }
}

export class ValueConstSym extends Value {
  constructor(
    readonly value: Id,
    readonly pos: Pos,
  ) {
    super()
  }

  emit(_lang: Lang, _block: EmitBlock): string {
    return "" + this.value
  }
}
