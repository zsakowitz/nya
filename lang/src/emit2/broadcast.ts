import type { Block } from "./decl"
import { bug, issue } from "./error"
import type { GlobalId } from "./id"
import type { EmitProps } from "./props"
import type { GlslScalar, Repr, ReprVec } from "./repr"
import { Fn, invalidType, type FnType, type Scalar, type Type } from "./type"
import { Value, type ConstValue } from "./value"

export class AnyVector implements FnType {
  constructor(readonly of: GlslScalar) {}

  canConvertFrom(type: Type): boolean {
    return type.repr.type == "vec" && type.repr.of == this.of
  }

  convertFrom(value: Value): Value {
    if (!this.canConvertFrom(value.type)) {
      invalidType(this, value.type)
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
  return value.type.toScalars(block.cache(value, true))
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
  const rret = ret.repr
  if (!(rret.type == "vec" && rret.count == 1)) {
    bug(`A broadcasting function must return a single scalar.`)
  }
  const of = rret.of

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

export function createBinaryBroadcastingFn(
  props: EmitProps,
  id: GlobalId,
  arg1: { name: string; type: GlslScalar },
  arg2: { name: string; type: GlslScalar },
  ret: Scalar,
  fns: {
    glsl1(a: string, b: string): string
    glslVec(a: string, b: string): string
    js1(a: string, b: string): string
    const(a: ConstValue, b: ConstValue): ConstValue
  },
) {
  const rret = ret.repr
  if (!(rret.type == "vec" && rret.count == 1)) {
    bug(`A broadcasting function must return a single scalar.`)
  }
  const of = rret.of

  const { glsl1, glslVec, js1, const: constFn } = fns

  return new Fn(
    id,
    [
      { name: arg1.name, type: new AnyVector(arg1.type) },
      { name: arg2.name, type: new AnyVector(arg2.type) },
    ],
    new AnyVector(of),
    ([a, b], block): Value => {
      a = a!
      b = b!
      const ra = a.type.repr as ReprVec
      const rb = b.type.repr as ReprVec

      if (a.const() && b.const()) {
        if (rb.count > 1 && ra.count == 1) {
          const [av] = a.type.toScalars(a)
          return fromScalars(
            b.type,
            b.type
              .toScalars(b)
              .map(
                (b) =>
                  new Value(
                    constFn(av!.value as ConstValue, b.value as ConstValue),
                    ret,
                  ),
              ),
          )
        }

        if (ra.count > 1 && rb.count == 1) {
          const [bv] = b.type.toScalars(b)
          return fromScalars(
            a.type,
            a.type
              .toScalars(a)
              .map(
                (a) =>
                  new Value(
                    constFn(a.value as ConstValue, bv!.value as ConstValue),
                    ret,
                  ),
              ),
          )
        }

        if (ra.count == rb.count) {
          const as = a.type.toScalars(a)
          const bs = b.type.toScalars(b)
          return fromScalars(
            a.type,
            as.map(
              (a, i) =>
                new Value(
                  constFn(a.value as ConstValue, bs[i]!.value as ConstValue),
                  ret,
                ),
            ),
          )
        }
      } else if (props.lang == "glsl") {
        if (
          (ra.count > 1 && rb.count == 1) ||
          (ra.count == 1 && rb.count > 1) ||
          (ra.count == rb.count && ra.count > 1)
        ) {
          return new Value(
            glslVec(a.toString(), b.toString()),
            ra.count == 1 ? b.type : a.type,
          )
        }

        if (ra.count == 1 && rb.count == 1) {
          return new Value(glsl1(a.toString(), b.toString()), a.type)
        }
      } else {
        if (rb.count > 1 && ra.count == 1) {
          const [av] = toScalars(a, block)
          return fromScalars(
            b.type,
            toScalars(b, block).map(
              (b) => new Value(js1(av!.toString(), b.toString()), ret),
            ),
          )
        }

        if (ra.count > 1 && rb.count == 1) {
          const [bv] = toScalars(b, block)
          return fromScalars(
            a.type,
            toScalars(a, block).map(
              (a) => new Value(js1(a.toString(), bv!.toString()), ret),
            ),
          )
        }

        if (ra.count == rb.count) {
          const as = toScalars(a, block)
          const bs = toScalars(b, block)
          return fromScalars(
            a.type,
            as.map(
              (a, i) => new Value(js1(a.toString(), bs[i]!.toString()), ret),
            ),
          )
        }
      }

      issue(
        `Function '${id}' can only broadcast over two vectors of equal length or one vector and one scalar.`,
      )
    },
  )
}
