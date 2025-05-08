import type { Declarations } from "./decl"
import { bug, issue, todo } from "./error"
import { fieldIdent, Id, ident } from "./id"
import { encodeIdentForTS } from "./ident"
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

  tyDecl(props: EmitProps) {
    return props.lang == "glsl" ?
        null
      : `function ${this.id.ident()}(${this.args
          .map((x) => encodeIdentForTS(x.name) + ":" + x.type.emit)
          .join(",")}): ${this.ret.emit};`
  }

  toString() {
    return `${this.id.label}(${this.args
      .map((x) => x.name + ": " + x.type)
      .join(", ")}) -> ${this.ret}`
  }
}

export class Scalar {
  constructor(
    readonly name: string,
    readonly emit: string,
    readonly repr: Repr,
    readonly toRuntime: (value: ConstValue) => string | null,
  ) {}

  toString() {
    return this.name
  }
}

export class Struct {
  static #of(
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
      return new Struct(name, "void", { type: "void" }, true, [], [], fields)
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
        )
      }
    }

    // TODO: matrix optimization

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
      fields,
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
      props.lang == "glsl" ?
        undefined
      : `declare const ${brandId.ident()}: unique symbol
interface ${id.ident()} {[${brandId.ident()}]: "__brand";${nvFields.map(({ type }, i) => `${fieldIdent(i)}: ${type.emit};`).join("")}}
${fn.tyDecl(props)}`
    return { struct, fn, decl, declTyOnly }
  }

  static of(
    props: EmitProps,
    name: string,
    fields: { name: string; type: Type }[],
  ): {
    struct: Struct
    fn?: Fn
    decl?: string
    declTyOnly?: string
  } {
    const ret = Struct.#of(props, name, fields)
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

  private constructor(
    readonly name: string,
    readonly emit: string,
    readonly repr: Repr,
    _isVoid: boolean,
    nvIndices: number[],
    nvFields: Type[],
    fields: { name: string; type: Type }[],
  ) {
    this.#nvIndices = nvIndices
    this.#nvFields = nvFields
    this.#fields = fields
    this.#fieldNames = fields.map((x) => x.name)
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

    return this.#fieldNames.map((fieldName) => {
      const v = fields.get(fieldName)
      if (!v) {
        issue(
          `Missing field '${fieldName}' when constructing struct '${this.name}'.`,
        )
      }

      return v
    })
  }

  generateFieldAccessors(decl: Declarations): Fn[] {
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
              () => new Value(0, decl.void)
            : ([a]) => new Value(a!.value, this),
          ),
      )
    }

    const lang = decl.props.lang

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
}

export type Type = Scalar | Struct
