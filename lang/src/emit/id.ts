let nextId = 1

export class Id {
  readonly value = nextId++

  constructor(readonly label: string) {}

  toString() {
    return this.label
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
