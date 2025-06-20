import type { ExprLit } from "../ast/node/expr"
import { bug } from "./error"
import { Id, ident, type IdGlobal } from "./id"
import type { EmitProps } from "./props"
import type { Tag } from "./tag"
import type { Fn, Scalar, Type } from "./type"
import { Value } from "./value"

export class IdMap<T> {
  constructor(private readonly parent: IdMap<T> | null) {}

  private readonly map: Record<number, T> = Object.create(null)

  all() {
    return Object.entries(this.map)
  }

  get(id: IdGlobal): T | undefined {
    return this.map[id.value] ?? this.parent?.get(id)
  }

  has(id: IdGlobal): boolean {
    return id.value in this.map || (this.parent != null && this.parent?.has(id))
  }

  /** Inverse of `.has`, but doesn't check parent scopes. */
  canDefine(id: IdGlobal) {
    return !(id.value in this.map)
  }

  /** Returns a value if it's already been initialized. */
  init(id: IdGlobal, value: T): T {
    if (this.has(id)) {
      return this.get(id)!
    }
    return (this.map[id.value] = value)
  }

  setOrThrow(
    id: IdGlobal,
    value: T,
    message = `'${id.label}' is already defined.`,
  ) {
    if (!this.canDefine(id)) {
      bug(message)
    }
    this.map[id.value] = value
  }

  set(id: IdGlobal, value: T) {
    this.map[id.value] = value
  }
}

export class IdMapMany<T> {
  private readonly rec: Record<number, T[]> = Object.create(null)

  all() {
    return Object.values(this.rec)
  }

  get(id: IdGlobal) {
    return this.rec[id.value]
  }

  push(id: IdGlobal, value: T) {
    ;(this.rec[id.value] ??= []).push(value)
  }

  map<U>(f: (items: T[], index: number, array: T[][]) => U): U[] {
    return Object.values(this.rec).map(f)
  }

  mapEach<U>(f: (items: T, index: number, array: T[]) => U): U[] {
    return Object.values(this.rec).flat().map(f)
  }
}

export class Globals {
  constructor(readonly props: EmitProps) {}

  private readonly source = new Set<string>()

  global(text: string) {
    this.source.add(text)
  }
}

export class Declarations {
  readonly types: IdMap<Type>
  readonly fns: IdMapMany<Fn>
  readonly tags: IdMap<Tag>

  _tyVoid: Scalar | undefined
  get tyVoid() {
    return (this._tyVoid ??= this.types.get(ident("void")) as Scalar)
  }
  _tyBool: Scalar | undefined
  get tyBool() {
    return (this._tyBool ??= this.types.get(ident("bool")) as Scalar)
  }
  _tyNum: Scalar | undefined
  get tyNum() {
    return (this._tyNum ??= this.types.get(ident("num")) as Scalar)
  }
  _tyLatex: Scalar | undefined
  get tyLatex() {
    return (this._tyLatex ??= this.types.get(ident("latex")) as Scalar)
  }

  private readonly source = new Set<string>()

  void() {
    return new Value(0, this.tyVoid)
  }

  constructor(
    readonly props: EmitProps,
    parent: Declarations | null,
    readonly createLiteral: (literal: ExprLit) => Value,
    readonly toArraySize: (value: Value) => number | null,
  ) {
    this.types = new IdMap(parent?.types ?? null)
    this.fns = parent?.fns ?? new IdMapMany()
    this.tags = new IdMap(parent?.tags ?? null)
  }

  global(text: string) {
    this.source.add(text)
  }

  globals() {
    return Array.from(this.source).join("\n")
  }
}

export class Exits {
  constructor(readonly returnType: Type | null) {}
}

export class Block {
  source = ""

  readonly lang
  readonly props

  constructor(
    readonly decl: Declarations,
    readonly exits: Exits,
    readonly locals: IdMap<Value> = new IdMap(null),
  ) {
    this.lang = (this.props = decl.props).lang
  }

  cache(value: Value, assumeReadonly: boolean): Value {
    if (value.const()) {
      return value
    } else if (value.type.repr.type == "void") {
      return new Value(0, value.type)
    } else if (assumeReadonly) {
      const v = value.toString()
      if (PRECACHED.test(v)) {
        return value
      }
    }

    const ident = new Id("cached value").ident()
    this.source += `${this.props.lang == "glsl" ? value.type.emit : "var"} ${ident}=${value};`
    return new Value(ident, value.type)
  }

  child(exits: Exits) {
    return new Block(this.decl, exits, new IdMap(this.locals))
  }
}

export const PRECACHED =
  /^(?:[+-]?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[$A-Za-z_]\w*)$/
