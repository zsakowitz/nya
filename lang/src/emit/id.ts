let lastId = 0n

declare const BRAND: unique symbol
export type Id = bigint & { [BRAND]: "id" }

export class IdSource {
  private readonly map = new Map<string, bigint>()

  get(source: string) {
    const existing = this.map.get(source)
    if (existing !== undefined) return existing as Id

    const id = nextId()
    this.map.set(source, id)
    return id as Id
  }
}

export function nextId(): Id {
  const id = ++lastId
  return id as Id
}
