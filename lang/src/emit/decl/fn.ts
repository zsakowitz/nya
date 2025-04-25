import type { Type } from "../type"

export class FnDeclaration {
  constructor(
    readonly argCount: number,
    readonly args: Type[],
  ) {}
}
