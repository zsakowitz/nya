import type { Block } from "./decl"
import type { IdGlobal } from "./id"
import type { Value } from "./value"

export class Tag {
  constructor(
    readonly id: IdGlobal,
    readonly create: (text: string[], interps: Value[], block: Block) => Value,
  ) {}
}
