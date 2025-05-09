import type { Block } from "./decl"
import { bug, issue } from "./error"
import type { GlobalId } from "./id"
import type { EmitProps } from "./props"
import type { GlslScalar, Repr, ReprVec } from "./repr"
import { Fn, type FnType, type Scalar, type Type } from "./type"
import { Value, type ConstValue } from "./value"

export class AnyVector implements FnType {
  constructor(readonly of: GlslScalar) {}

  canConvertFrom(type: Type): boolean {
    return type.repr.type == "vec" && type.repr.of == this.of
  }

  convertFrom(value: Value): Value {
    if (!this.canConvertFrom(value.type)) {
      issue(
        `Incompatible types: '${this}' expected, but '${value.type}' found.`,
      )
    }
    return value
  }

  toString(): string {
    return `vec<${this.of}>`
  }
}

export function canAutomaticallyBroadcast(repr: Repr) {
  return repr.type == "vec"
}

export function toScalars(value: Value, block: Block) {
  return value.type.toScalars(block.cache(value))
}

export function fromScalars(type: Type, value: Value[]) {
  value.reverse()
  return type.fromScalars(value)
}

export function createUnaryBroadcastingFn(
  props: EmitProps,
  id: GlobalId,
  arg1: { name: string; type: GlslScalar },
  ret: Scalar,
  fns: {
    glsl1(a: string): string
    glslVec(a: string): string
    js1(a: string): string
    const(a: ConstValue): ConstValue
  },
) {
  const r1 = ret.repr
  if (!(r1.type == "vec" && r1.count == 1)) {
    bug(`A broadcasting function must return a single scalar.`)
  }
  const of = r1.of

  const { glsl1, glslVec, js1, const: constFn } = fns

  if (props.lang == "glsl") {
    return new Fn(
      id,
      [{ name: arg1.name, type: new AnyVector(arg1.type) }],
      new AnyVector(of),
      ([a]): Value => {
        a = a!
        if (a.const()) {
          return fromScalars(
            a.type,
            a.type
              .toScalars(a)
              .map((x) => new Value(constFn(x.value as ConstValue), ret)),
          )
        }
        if ((a.type.repr as ReprVec).count == 1) {
          return new Value(glsl1(a.toString()), a.type)
        }
        return new Value(glslVec(a.toString()), a.type)
      },
    )
  }

  return new Fn(
    id,
    [{ name: arg1.name, type: new AnyVector(arg1.type) }],
    new AnyVector(of),
    ([a], block): Value => {
      a = a!
      if (a.const()) {
        return fromScalars(
          a.type,
          a.type
            .toScalars(a)
            .map((x) => new Value(constFn(x.value as ConstValue), ret)),
        )
      }
      if ((a.type.repr as ReprVec).count == 1) {
        return new Value(js1(a.toString()), a.type)
      }
      return fromScalars(
        a.type,
        toScalars(a, block).map((x) => new Value(js1(x.toString()), ret)),
      )
    },
  )
}
