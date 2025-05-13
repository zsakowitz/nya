import type { Block } from "./decl"
import { bug, issue, todo } from "./error"
import { fieldIdent, Id, ident } from "./id"
import { encodeIdentForTS } from "./ident"
import type { EmitProps } from "./props"
import {
  emitGlslMat,
  emitGlslVec,
  type GlslScalar,
  type Repr,
  type ReprVec,
} from "./repr"
import { Value, type ConstValue } from "./value"

export interface TypeBase {
  repr: Repr
  emit: string
  toScalars(value: Value): Value[]
  fromScalars(values: Value[]): Value
  canConvertFrom(type: Type): boolean
  convertFrom(value: Value): Value
  toRuntime(value: ConstValue): string | null
  toString(): string
}

export interface FnType {
  canConvertFrom(type: Type): boolean
  convertFrom(value: Value): Value
  toString(): string
}

export class Fn {
  constructor(
    readonly id: Id,
    readonly args: { name: string; type: FnType }[],
    readonly ret: FnType,
    readonly run: (args: Value[], block: Block) => Value,
  ) {}

  toString() {
    return `${this.id.label}(${this.args
      .map((x) => x.name + ": " + x.type)
      .join(", ")}) -> ${this.ret}`
  }
}

export function invalidType(
  expected: { toString(): string },
  actual: { toString(): string },
): never {
  issue(`Incompatible types: '${expected}' expected, but '${actual}' found.`)
}

export class Scalar implements TypeBase {
  constructor(
    readonly name: string,
    readonly emit: string,
    readonly repr: Repr,
    readonly toRuntime: (value: ConstValue) => string | null,
    readonly toScalars: (value: Value) => Value[],
    /** Should pop values from the end as needed. */
    readonly fromScalars: (value: Value[]) => Value,
  ) {}

  toString() {
    return this.name
  }

  canConvertFrom(type: Type): boolean {
    return type == this
  }

  convertFrom(value: Value): Value {
    if (value.type == this) {
      return value
    } else {
      invalidType(this, value.type)
    }
  }
}

export class Struct implements TypeBase {
  static #of(
    props: EmitProps,
    name: string,
    fields: { name: string; type: Type }[],
    matrix: boolean,
  ) {
    const nvFields = fields.filter((x) => x.type.repr.type != "void")

    const nvIndices = fields
      .map((x, i) => ({ x, i }))
      .filter((x) => x.x.type.repr.type != "void")
      .map((x) => x.i)

    if (nvFields.length == 0) {
      return new Struct(
        name,
        "void",
        { type: "void" },
        true,
        [],
        [],
        fields,
        props,
      )
    }

    if (nvFields.length == 1) {
      return new Struct(
        name,
        nvFields[0]!.type.emit,
        nvFields[0]!.type.repr,
        false,
        nvIndices,
        nvFields.map((x) => x.type),
        fields,
        props,
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
        return new Struct(
          name,
          emitGlslVec(repr),
          repr,
          false,
          nvIndices,
          nvFields.map((x) => x.type),
          fields,
          props,
        )
      }
    }

    mat: if (
      !repr &&
      nvFields.every(
        (x): x is typeof x & { type: { repr: ReprVec } } =>
          x.type.repr.type == "vec",
      )
    ) {
      if (!nvFields.every((x) => x.type.repr.of == "float")) {
        break mat
      }

      const rows = nvFields[0]!.type.repr.count
      if (rows == 1) {
        break mat
      }
      if (!nvFields.every((x) => x.type.repr.count == rows)) {
        break mat
      }
      const cols = nvFields.length
      if (!(cols == 2 || cols == 3 || cols == 4)) {
        break mat
      }

      repr = { type: "mat", cols, rows, op: matrix }
      if (props.lang == "glsl") {
        return new Struct(
          name,
          emitGlslMat(repr),
          repr,
          false,
          nvIndices,
          nvFields.map((x) => x.type),
          fields,
          props,
        )
      }
    }

    const lid = new Id(name)
    const lident = lid.ident()
    const brandId = new Id(name)
    repr ??= { type: "struct", id: lid }
    const struct = new Struct(
      name,
      lident,
      repr,
      false,
      nvIndices,
      nvFields.map((x) => x.type),
      fields,
      props,
    )
    const fn = new Fn(lid, fields, struct, (args) => {
      const vals = nvIndices.map((i) => args[i]!)
      return new Value(
        vals.every((x) => x.const()) ?
          vals.map((x) => x.value)
        : `${lident}(${vals.join(",")})`,
        struct,
      )
    })
    const decl =
      props.lang == "glsl" ?
        `struct ${lident} {${nvFields.map(({ type }, i) => `${type.emit} ${fieldIdent(i)};`).join("")}}`
      : `function ${lident}(${nvFields.map((_, i) => `${fieldIdent(i)}`).join(",")}) {return {${nvFields.map((_, i) => `${fieldIdent(i)}`).join(",")}}}`
    const declTyOnly =
      props.lang == "glsl" ?
        undefined
      : `declare const ${brandId.ident()}: unique symbol
interface ${lident} {[${brandId.ident()}]: "__brand";${nvFields.map(({ type }, i) => `${fieldIdent(i)}: ${type.emit};`).join("")}}
function ${lident}(${nvFields
          .map((x) => `${encodeIdentForTS(x.name)}: ${x.type.emit}`)
          .join(",")}): ${struct.emit};`
    return { struct, fn, decl, declTyOnly }
  }

  static of(
    props: EmitProps,
    name: string,
    fields: { name: string; type: Type }[],
    matrix: boolean,
  ): {
    struct: Struct
    fn?: Fn
    decl?: string
    declTyOnly?: string
  } {
    const ret = Struct.#of(props, name, fields, matrix)
    if (ret instanceof Struct) {
      return { struct: ret }
    } else {
      return ret
    }
  }

  readonly #nvIndices
  readonly #nvFields
  readonly #fields
  readonly #fieldNames
  readonly #accessors

  private constructor(
    readonly name: string,
    readonly emit: string,
    readonly repr: Repr,
    _isVoid: boolean,
    nvIndices: readonly number[],
    nvFields: readonly Type[],
    fields: readonly { name: string; type: Type }[],
    props: EmitProps,
  ) {
    this.#nvIndices = nvIndices
    this.#nvFields = nvFields
    this.#fields = fields
    this.#fieldNames = fields.map((x) => x.name)
    this.#accessors = this.generateFieldAccessors(props)
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

  verifyAndOrderFields(fields: Map<string, Value>): Value[] {
    const self = this.#fieldNames
    const name = this.name
    if (fields.size != self.length) {
      issue(`Invalid number of fields passed to struct '${name}'.`)
    }

    return this.#fields.map(({ name: fieldName, type }) => {
      const v = fields.get(fieldName)
      if (!v) {
        issue(
          `Missing field '${fieldName}' when constructing struct '${this.name}'.`,
        )
      }

      return type.convertFrom(v)
    })
  }

  generateFieldAccessors(props: EmitProps): readonly Fn[] {
    const arg = [{ name: "target", type: this }]

    // Void optimization
    if (this.#nvFields.length == 0) {
      return this.#fields.map(
        ({ name, type }) =>
          new Fn(ident(name), arg, type, () => new Value(0, type)),
      )
    }

    // Single-field optimization
    if (this.#nvFields.length == 1) {
      return this.#fields.map(
        ({ name, type }) =>
          new Fn(
            ident(name),
            arg,
            type,
            type.repr.type == "void" ?
              () => new Value(0, type)
            : ([a]) => new Value(a!.value, type),
          ),
      )
    }

    const lang = props.lang

    // GLSL vector optimization
    if (lang == "glsl" && this.repr.type == "vec") {
      const MASK = "xyzw"
      let index = 0
      let constIndex = 0
      return this.#fields.map(({ name, type }) => {
        const mask =
          type.repr.type == "void" ? null
          : type.repr.type == "vec" ?
            "." + MASK.slice(index, (index += type.repr.count))
          : bug(
              "Structs with a vector representation can only contain void items and other vectors.",
            )

        const idx = constIndex
        if (type.repr.type == "vec") {
          constIndex++
        }

        return new Fn(
          ident(name),
          arg,
          type,
          mask == null ?
            () => new Value(0, type)
          : ([a]): Value => {
              if (a!.const()) {
                return new Value((a.value as ConstValue[])[idx]!, type)
              } else {
                return new Value(a!.toString() + mask!, type)
              }
            },
        )
      })
    }

    // GLSL matrix optimization
    if (lang == "glsl" && this.repr.type == "mat") {
      todo("Matrix-repr'd structs are not allowed yet.")
    }

    // Plain struct representation
    let index = 0
    return this.#fields.map(({ name, type }) => {
      const id = ident(name)
      if (type.repr.type == "void") {
        return new Fn(id, arg, type, () => new Value(0, type))
      }

      const idx = index++
      const idnt = fieldIdent(idx)
      return new Fn(id, arg, type, ([a]): Value => {
        if (a!.const()) {
          return new Value((a.value as ConstValue[])[idx]!, type)
        } else {
          return new Value(a!.toString() + "." + idnt, type)
        }
      })
    })
  }

  toString() {
    return this.name
  }

  canConvertFrom(type: Type): boolean {
    return type == this
  }

  convertFrom(value: Value): Value {
    if (value.type == this) {
      return value
    } else {
      invalidType(this, value.type)
    }
  }

  toScalars(value: Value): Value[] {
    return this.#accessors.flatMap((f, i) =>
      // @ts-expect-error `Fn` created by #accessors never require a block argument
      this.#fields[i]!.type.toScalars(f.run([value], null)),
    )
  }

  fromScalars(value: Value[]): Value {
    return this.with(this.#fields.map(({ type }) => type.fromScalars(value)))
  }
}

export const ArrayEmpty: TypeBase = {
  repr: { type: "void" },
  emit: "void",
  toScalars() {
    return []
  },
  fromScalars() {
    return new Value(0, ArrayEmpty)
  },
  canConvertFrom(type) {
    return type == ArrayEmpty
  },
  convertFrom(value) {
    if (value.type != ArrayEmpty) {
      invalidType(this, value.type)
    }

    return new Value(0, ArrayEmpty)
  },
  toRuntime() {
    return null
  },
  toString() {
    return "[unknown; 0]"
  },
}

export class Array implements TypeBase {
  readonly repr: Repr
  readonly emit: string

  constructor(
    private readonly props: EmitProps,
    readonly item: Type,
    readonly count: number,
  ) {
    if (item.repr.type == "void" || count == 0) {
      this.repr = { type: "void" }
      this.emit = "void"
      return
    }

    if (item.repr.type == "array") {
      todo(
        `An array cannot yet contain arrays unless the inner array is a void type.`,
      )
    }

    this.repr = { type: "array", of: item.repr, count }
    this.emit =
      props.lang == "glsl" ? item.emit + `[${count}]` : item.emit + "[]"
  }

  canConvertFrom(type: Type): boolean {
    return (
      (type == ArrayEmpty && this.count == 0) ||
      (type instanceof Array &&
        type.item == this.item &&
        type.count == this.count)
    )
  }

  convertFrom(value: Value): Value {
    if (value.type == ArrayEmpty && this.count == 0) {
      return new Value(0, this)
    }

    if (!this.canConvertFrom(value.type)) {
      invalidType(this, value.type)
    }

    return value
  }

  fromScalars(_values: Value[]): Value {
    todo(`Broadcasting over arrays is not supported yet.`)
  }

  toScalars(_value: Value): Value[] {
    todo(`Broadcasting over arrays is not supported yet.`)
  }

  toRuntime(value: ConstValue): string | null {
    if (this.repr.type == "void") {
      return null
    }

    if (this.props.lang == "glsl") {
      return `${this.emit}(${(value as ConstValue[]).map((x) => this.item.toRuntime(x))})`
    }

    return `[${(value as ConstValue[]).map((x) => this.item.toRuntime(x))}]`
  }

  toString(): string {
    return `[${this.item}; ${this.count}]`
  }
}

export type Type = Scalar | Struct | Array | typeof ArrayEmpty
