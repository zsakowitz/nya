import type { ExprLit } from "../ast/node/expr"
import type { Id } from "./id"
import type { EmitProps } from "./props"
import type { Fn, Scalar, Type } from "./type"
import type { Value } from "./value"

export class IdMap<T> {
  constructor(private readonly parent: IdMap<T> | null) {}

  private readonly map: Record<number, T> = Object.create(null)

  get(id: Id): T | undefined {
    return this.map[id.value] ?? this.parent?.get(id)
  }

  has(id: Id): boolean {
    return id.value in this.map || (this.parent != null && this.parent?.has(id))
  }

  /** Inverse of `.has`, but doesn't check parent scopes. */
  canDefine(id: Id) {
    return !(id.value in this.map)
  }

  /** Returns a value if it's already been initialized. */
  init(id: Id, value: T): T {
    if (this.has(id)) {
      return this.get(id)!
    }
    return (this.map[id.value] = value)
  }

  set(id: Id, value: T) {
    this.map[id.value] = value
  }
}

export class IdMapMany<T> {
  private readonly rec: Record<number, T[]> = Object.create(null)

  get(id: Id) {
    return this.rec[id.value]
  }

  push(id: Id, value: T) {
    ;(this.rec[id.value] ??= []).push(value)
  }

  map<U>(f: (items: T[], index: number, array: T[][]) => U): U[] {
    return Object.values(this.rec).map(f)
  }

  mapEach<U>(f: (items: T, index: number, array: T[]) => U): U[] {
    return Object.values(this.rec).flat().map(f)
  }
}

export class Declarations {
  readonly types: IdMap<Type>
  readonly fns: IdMapMany<Fn>
  readonly void: Scalar

  private readonly source = new Set<string>()

  constructor(
    readonly props: EmitProps,
    parent: Declarations | null,
    void_: Scalar,
    readonly createLiteral: (literal: ExprLit) => Value,
    readonly arraySize: (value: Value) => number | null,
  ) {
    this.void = void_
    this.types = new IdMap(parent?.types ?? null)
    this.fns = parent?.fns ?? new IdMapMany()
  }

  global(text: string) {
    this.source.add(text)
  }

  globals() {
    return Array.from(this.source).join("\n")
  }
}

export class Block {
  source = ""

  readonly lang
  readonly props

  constructor(
    readonly decl: Declarations,
    readonly locals: IdMap<Value> = new IdMap(null),
  ) {
    this.lang = (this.props = decl.props).lang
  }

  child() {
    return new Block(this.decl, new IdMap(this.locals))
  }
}
