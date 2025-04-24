let lastId = 0
const ids = new Map<string, number>()

declare const BRAND: unique symbol
export type Id = number & { [BRAND]: "id" }

export function id(source: string): Id {
  const existing = ids.get(source)
  if (existing !== undefined) return existing as Id

  const id = ++lastId
  ids.set(source, id)
  return id as Id
}
