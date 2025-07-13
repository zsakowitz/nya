import type { Pos } from "../ast/issue"
import type { Block } from "./decl"
import type { GlslScalar } from "./repr"
import { invalidType, type FnType, type Type } from "./type"
import { Value } from "./value"

export class AnyVector implements FnType {
  constructor(readonly of: GlslScalar) {}

  canConvertFrom(type: Type): boolean {
    return type.repr.type == "vec" && type.repr.of == this.of
  }

  convertFrom(value: Value, pos: Pos): Value {
    if (!this.canConvertFrom(value.type)) {
      invalidType(this, value.type, pos)
    }
    return value
  }

  toString(): string {
    return `vec<${this.of}>`
  }
}

export function scalars(value: Value, block: Block) {
  return value.type.toScalars(block.cache(value, true))
}

export function fromScalars(type: Type, value: Value[]) {
  value.reverse()
  return type.fromScalars(value)
}
