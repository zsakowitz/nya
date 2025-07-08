import type { Pos } from "../ast/issue"
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

export interface Type {
  repr: Repr
  emit: string
  toScalars(value: Value): Value[]
  fromScalars(values: Value[]): Value
  canConvertFrom(type: Type): boolean
  convertFrom(value: Value, pos: Pos): Value
  toRuntime(value: ConstValue): string | null
  toString(): string
}

export interface FnType {
  canConvertFrom(type: Type): boolean
  convertFrom(value: Value, pos: Pos): Value
  toString(): string
}

export type FnParam = { name: string; type: FnType }
export type FnExec = (
  args: Value[],
  block: Block,
  namePos: Pos,
  fullPos: Pos,
) => Value

export function fn(id: Id, args: FnParam[], ret: FnType, run: FnExec) {
  return new Fn(id, args, ret, run)
}

export class Fn {
  constructor(
    readonly id: Id,
    readonly args: FnParam[],
    readonly ret: FnType,
    readonly run: FnExec,
  ) {}

  toString() {
    return `${this.id.label}(${this.args
      .map((x) => x.name + ": " + x.type)
      .join(", ")}) -> ${this.ret}`
  }

  declaration() {
    return `fn ${this.id.label}(${this.args.map((x) => `${x.name}: ${x.type}`).join(", ")}) -> ${this.ret};`
  }
}

export function invalidType(
  expected: { toString(): string },
  actual: { toString(): string },
  pos: Pos,
): never {
  issue(
    `Incompatible types: '${expected}' expected, but '${actual}' found.`,
    pos,
  )
}

export class Scalar implements Type {
  constructor(
    readonly name: string,
    readonly emit: string,
    readonly repr: Repr,
    public toRuntime: (value: ConstValue) => string | null,
    public toScalars: (value: Value) => Value[],
    /** Should pop values from the end as needed. */
    public fromScalars: (value: Value[]) => Value,
  ) {}

  toString() {
    return this.name
  }

  canConvertFrom(type: Type): boolean {
    return type == this
  }

  convertFrom(value: Value, pos: Pos): Value {
    if (value.type == this) {
      return value
    } else {
      invalidType(this, value.type, pos)
    }
  }

  declaration() {
    return `type ${this.name};`
  }
}

export class Struct implements Type {
  static #of(
    props: EmitProps,
    name: string,
    fields: { name: string; type: Type }[],
    matrix: boolean,
    group: Id,
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
        group,
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
        group,
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
          group,
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
          group,
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
      group,
    )
    const fn = new Fn(lid, fields, struct, (args) => {
      const vals = nvIndices.map((i) => args[i]!)
      if (vals.every((x) => x.const())) {
        return new Value(
          vals.map((x) => x.value),
          struct,
          true,
        )
      } else {
        return new Value(`${lident}(${vals.join(",")})`, struct, false)
      }
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
    group: Id,
  ): {
    struct: Struct
    fn?: Fn
    decl?: string
    declTyOnly?: string
  } {
    const ret = Struct.#of(props, name, fields, matrix, group)
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
  #accessors!: readonly Fn[]

  private constructor(
    public name: string,
    readonly emit: string,
    readonly repr: Repr,
    _isVoid: boolean,
    nvIndices: readonly number[],
    nvFields: readonly Type[],
    fields: readonly { name: string; type: Type }[],
    readonly group: Id,
  ) {
    this.#nvIndices = nvIndices
    this.#nvFields = nvFields
    this.#fields = fields
    this.#fieldNames = fields.map((x) => x.name)
  }

  createAccessors(props: EmitProps, argumentType: FnType) {
    return (this.#accessors = this.#generateFieldAccessors(props, argumentType))
  }

  with(args: Value[]): Value {
    if (this.#nvIndices.length == 0) {
      return new Value(0, this, true)
    }

    if (this.#nvIndices.length == 1) {
      return args[this.#nvIndices[0]!]!.unsafeWithType(this)
    }

    const vals = this.#nvIndices.map((i) => args[i]!)
    const isConst = vals.every((x) => x.const())
    if (isConst) {
      return new Value(
        vals.map((x) => x.value),
        this,
        true,
      )
    } else {
      return new Value(`${this.emit}(${vals.join(",")})`, this, false)
    }
  }

  toRuntime(fields: ConstValue): string | null {
    if (this.#nvIndices.length == 0) {
      return null
    }

    if (this.#nvIndices.length == 1) {
      return this.#nvFields[0]!.toRuntime(fields)
    }

    return `${this.emit}(${this.#nvFields.map((type, i) => type.toRuntime((fields as ConstValue[])[i]!))})`
  }

  verifyAndOrderFields(
    fields: Map<string, Value>,
    pos: Map<string, Pos>,
  ): Value[] {
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

      return type.convertFrom(v, pos.get(fieldName)!)
    })
  }

  #generateFieldAccessors(
    props: EmitProps,
    argumentType: FnType,
  ): readonly Fn[] {
    const arg = [{ name: "target", type: argumentType }]

    // Void optimization
    if (this.#nvFields.length == 0) {
      return this.#fields.map(
        ({ name, type }) =>
          new Fn(ident(name), arg, type, () => new Value(0, type, true)),
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
              () => new Value(0, type, true)
            : ([a]) => a!.unsafeWithType(type),
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
            () => new Value(0, type, true)
          : ([a]): Value => {
              if (a!.const()) {
                return new Value((a.value as ConstValue[])[idx]!, type, true)
              } else {
                return new Value(a!.toString() + mask!, type, false)
              }
            },
        )
      })
    }

    // GLSL matrix optimization
    if (lang == "glsl" && this.repr.type == "mat") {
      let index = 0
      return this.#fields.map(({ name, type }) => {
        const idx =
          type.repr.type == "vec" ? index++
          : type.repr.type == "void" ? null
          : bug(
              "Structs with a matrix representation can only contain void items and vectors.",
            )

        return new Fn(
          ident(name),
          arg,
          type,
          idx == null ?
            () => new Value(0, type, true)
          : ([a]): Value => {
              if (a!.const()) {
                return new Value((a.value as ConstValue[])[idx]!, type, true)
              } else {
                return new Value(a!.toString() + `[${idx}]`, type, false)
              }
            },
        )
      })
    }

    // Plain struct representation
    let index = 0
    return this.#fields.map(({ name, type }) => {
      const id = ident(name)
      if (type.repr.type == "void") {
        return new Fn(id, arg, type, () => new Value(0, type, true))
      }

      const idx = index++
      const idnt = fieldIdent(idx)
      return new Fn(id, arg, type, ([a]): Value => {
        if (a!.const()) {
          return new Value((a.value as ConstValue[])[idx]!, type, true)
        } else {
          return new Value(a!.toString() + "." + idnt, type, false)
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

  convertFrom(value: Value, pos: Pos): Value {
    if (value.type == this) {
      return value
    } else {
      invalidType(this, value.type, pos)
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

  declaration(nl = false) {
    if (this.#fields.length == 0) {
      return `struct ${this.name} {}`
    }
    if (nl) {
      return `struct ${this.name} {${this.#fields.map((x) => `\n  ${x.name}: ${x.type},`).join("")}\n}`
    }
    return `struct ${this.name} { ${this.#fields.map((x) => `${x.name}: ${x.type}`).join(", ")} }`
  }
}

export const ArrayEmpty: Type = {
  repr: { type: "void" },
  emit: "void",
  toScalars() {
    return []
  },
  fromScalars() {
    return new Value(0, ArrayEmpty, true)
  },
  canConvertFrom(type) {
    return type == ArrayEmpty
  },
  convertFrom(value, pos) {
    if (value.type != ArrayEmpty) {
      invalidType(this, value.type, pos)
    }

    return new Value(0, ArrayEmpty, true)
  },
  toRuntime() {
    return "[]" // FIXME: there are probably horrible things broken by type=void and this but whatever
  },
  toString() {
    return "[unknown; 0]"
  },
}

export class Array implements Type {
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

  convertFrom(value: Value, pos: Pos): Value {
    if (value.type == ArrayEmpty && this.count == 0) {
      return new Value(0, this, true)
    }

    if (!this.canConvertFrom(value.type)) {
      invalidType(this, value.type, pos)
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
      return "[]" // FIXME: there are probably horrible things broken by type=void and this but whatever
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

export class AnyArray implements FnType {
  constructor(readonly item: Type) {
    if (item.repr.type == "array") {
      todo(
        `An array cannot yet contain arrays unless the inner array is a void type.`,
      )
    }
  }

  canConvertFrom(type: Type): boolean {
    return (
      type == ArrayEmpty || (type instanceof Array && type.item == this.item)
    )
  }

  convertFrom(value: Value, pos: Pos): Value {
    if (value.type == ArrayEmpty) {
      return new Value([], ArrayEmpty, true)
    }

    if (!this.canConvertFrom(value.type)) {
      invalidType(this, value.type, pos)
    }

    return value
  }

  toString(): string {
    return `[${this.item}; ...]`
  }
}

function isSubset(expectedSuper: Type[], expectedSub: Type[]) {
  for (const el of expectedSub) {
    if (!expectedSuper.includes(el)) {
      return false
    }
  }

  return true
}

export class Alt implements Type {
  readonly a: Struct

  constructor(readonly alts: Struct[]) {
    if (alts.length < 2) {
      bug(`An Alt must have at least two types.`)
    }

    const a = (this.a = alts[0]!)
    if (!alts.every((x) => x.group == a.group)) {
      issue(
        `A type with alternatives may only be composed of structs created in a single declaration.`,
      )
    }
    this.repr = a.repr
    this.emit = a.emit
  }

  readonly repr: Repr
  readonly emit: string

  toScalars(value: Value): Value[] {
    return this.a.toScalars(value)
  }

  fromScalars(values: Value[]): Value {
    return this.a.fromScalars(values).unsafeWithType(this)
  }

  canConvertFrom(type: Type): boolean {
    if (type instanceof Alt) {
      return isSubset(this.alts, type.alts)
    }

    return this.alts.includes(type as any)
  }

  convertFrom(value: Value, pos: Pos): Value {
    if (value.type instanceof Alt) {
      if (isSubset(this.alts, value.type.alts)) {
        return value
      }
    }

    for (const alt of this.alts) {
      if (alt == value.type) {
        return value
      }
    }

    invalidType(this, value.type, pos)
  }

  toRuntime(value: ConstValue): string | null {
    return this.a.toRuntime(value)
  }

  toString(): string {
    return this.alts.join(" | ")
  }
}

export const Any: FnType = {
  canConvertFrom() {
    return true
  },
  convertFrom(value) {
    return value
  },
  toString() {
    return "any"
  },
}
