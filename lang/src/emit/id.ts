let nextId = 1

export class Id {
  readonly value = nextId++

  constructor(readonly label: string) {}

  ident() {
    return `f` + this.value.toString(36)
  }

  toString() {
    return this.label + "#" + this.value.toString(36)
  }
}

export class IdSet {
  private readonly map: Record<string, Id> = Object.create(null)

  of(label: string) {
    return (this.map[label] ??= new Id(label))
  }
}

export const names = new IdSet()

export function name(label: TemplateStringsArray) {
  return names.of(label[0]!)
}

export function getNextId() {
  return nextId++
}
