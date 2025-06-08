import type { NodeExpr } from "../ast/node/expr"
import type { Block } from "./decl"
import type { IdGlobal } from "./id"
import type { Value } from "./value"

export class Tag {
  constructor(
    readonly id: IdGlobal,
    readonly create: (
      text: string[],
      interpValues: Value[],
      interpPositions: NodeExpr[],
      block: Block,
    ) => Value,
  ) {}
}
