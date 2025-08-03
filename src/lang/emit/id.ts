let nextId = 1

export class Id {
  readonly value = nextId++

  constructor(readonly label: string) {}

  ident() {
    return "_" + this.value.toString(36)
  }

  toString() {
    return this.label
  }
}

export class IdGlobal extends Id {
  ident(): string {
    throw new Error("Global IDs should not be used as identifiers.")
  }
}

const idMap: Record<string, IdGlobal> = Object.create(null)

declare const brand: unique symbol

export interface IdGlobal {
  [brand]: "__global_id"
}

export function ident(label: string) {
  return (idMap[label] ??= new IdGlobal(label))
}

export function fieldIdent(index: number) {
  return (
    "xyzwABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv"[index] ??
    `_` + index.toString(36)
  )
}
