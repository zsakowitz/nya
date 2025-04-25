import type { VType } from "../type"

export class FnDeclaration {
  constructor(
    readonly argCount: number,
    readonly args: VType[],
  ) {}
}
