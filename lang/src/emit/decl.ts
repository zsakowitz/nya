import type { Id } from "./id"
import type { EmitProps } from "./props"
import { Type } from "./type"

export class Struct {
  constructor(
    readonly id: Id,
    readonly fields: { id: Id; type: Type }[],
    private readonly cons = `s${id}`,
  ) {}

  of(args: string[]) {
    return `${this.cons}(${args.join(",")})`
  }
}

export class Fn {
  constructor(
    readonly id: Id,
    readonly args: { id: Id; type: Type }[],
    readonly ret: Type,
    readonly of: (props: EmitProps, args: string[]) => string,
  ) {}
}

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
}

export class IdMapMany<T> {
  private readonly map: Record<number, T[]> = Object.create(null)

  get(id: Id) {
    return this.map[id.value]
  }

  push(id: Id, value: T) {
    ;(this.map[id.value] ??= []).push(value)
  }
}

export class Declarations {
  readonly types: IdMap<Type | Struct>
  readonly fns: IdMapMany<Fn>

  constructor(parent: Declarations | null) {
    this.types = new IdMap(parent?.types ?? null)
    this.fns = parent?.fns ?? new IdMapMany()
  }
}
