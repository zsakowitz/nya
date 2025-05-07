import { fieldIdent, Id } from "./id"
import type { EmitProps } from "./props"
import { emitGlslVec, type GlslScalar, type Repr } from "./repr"
import { Value, type ConstValue } from "./value"

export class Fn {
  constructor(
    readonly id: Id,
    readonly args: { name: string; type: Type }[],
    readonly ret: Type,
    readonly run: (args: Value[]) => Value,
  ) {}
}

export class Scalar {
  constructor(
    readonly name: string,
    readonly emit: string,
    readonly repr: Repr,
    readonly toRuntime: (value: ConstValue) => string,
  ) {}

  toString() {
    return this.name
  }
}

export class Struct {
  static of(
    props: EmitProps,
    name: string,
    fields: { name: string; type: Type }[],
  ) {
    const nvFields = fields.filter((x) => x.type.repr.type != "void")

    const nvIndices = fields
      .map((x, i) => ({ x, i }))
      .filter((x) => x.x.type.repr.type != "void")
      .map((x) => x.i)

    if (nvFields.length == 0) {
      return new Struct(name, "void", { type: "void" }, true, nvIndices)
    }

    if (nvFields.length == 1) {
      return new Struct(
        name,
        nvFields[0]!.type.emit,
        nvFields[0]!.type.repr,
        false,
        nvIndices,
      )
    }

    const rs = nvFields.map((x) => x.type.repr)

    let repr: Repr | undefined
    vec: {
      let count = 0
      let kind: GlslScalar | undefined
      for (const r of rs) {
        if (r.type != "vec") break vec
        if (kind == null) {
          kind = r.of
        } else if (kind != r.of) {
          break vec
        }
        count += r.count
      }
      if (kind == null || !(count == 2 || count == 3 || count == 4)) {
        // size==1 cannot exist, since there are at least two nonvoid fields
        break vec
      }

      repr = { type: "vec", of: kind, count }

      if (props.lang == "glsl") {
        return new Struct(name, emitGlslVec(repr), repr, false, nvIndices)
      }
    }

    const id = new Id(name)
    const brandId = new Id(name)
    repr ??= { type: "struct", id }
    const struct = new Struct(
      name,
      id.ident(),
      repr,
      false,
      nvIndices,
      nvFields.map((x) => x.type),
    )
    const fn = new Fn(id, fields, struct, (args) => {
      const vals = nvIndices.map((i) => args[i]!)
      return new Value(
        vals.every((x) => x.const()) ?
          vals.map((x) => x.value)
        : `${id.ident()}(${vals.join(",")})`,
        struct,
      )
    })
    const decl =
      props.lang == "glsl" ?
        `struct ${id.ident()} {${nvFields.map(({ type }, i) => `${type.emit} ${fieldIdent(i)};`).join("")}}`
      : `function ${id.ident()}(${nvFields.map((_, i) => `${fieldIdent(i)}`).join(",")}) {return {${nvFields.map((_, i) => `${fieldIdent(i)}`).join(",")}}}`
    const declTyOnly =
      props.lang != "glsl" &&
      `declare const ${brandId.ident()}: unique symbol
interface ${id.ident()} {[${brandId.ident()}]: "__brand";${nvFields.map(({ type }, i) => `${fieldIdent(i)}: ${type.emit};`).join("")}}`
    return { struct, fn, decl, declTyOnly }
  }

  readonly #nvIndices
  readonly #nvFields

  private constructor(
    readonly name: string,
    readonly emit: string,
    readonly repr: Repr,
    _isVoid: boolean,
    nvIndices: number[],
    nvFields: Type[] = [],
  ) {
    this.#nvIndices = nvIndices
    this.#nvFields = nvFields
  }

  with(args: Value[]): Value {
    if (this.#nvIndices.length == 0) {
      return new Value(0, this)
    }

    if (this.#nvIndices.length == 1) {
      return new Value(args[this.#nvIndices[0]!]!.value, this)
    }

    const vals = this.#nvIndices.map((i) => args[i]!)
    return new Value(
      vals.every((x) => x.const()) ?
        vals.map((x) => x.value)
      : `${this.emit}(${vals.join(",")})`,
      this,
    )
  }

  toRuntime(fields: ConstValue): string | null
  toRuntime(fields: ConstValue[]): string | null {
    if (this.#nvIndices.length == 0) {
      return null
    }

    if (this.#nvIndices.length == 1) {
      return this.#nvFields[0]!.toRuntime(fields[0]!)
    }

    return `${this.emit}(${this.#nvFields.map((type, i) => type.toRuntime(fields[i]!))})`
  }
}

export type Type = Scalar | Struct
