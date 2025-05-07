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

const idMap: Record<string, Id> = Object.create(null)

export function globalIdent(label: string) {
  return (idMap[label] ??= new Id(label))
}

export function fieldIdent(index: number) {
  return (
    "xyzwABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv"[index] ??
    `_` + index.toString(36)
  )
}
