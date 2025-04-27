import type { VTypeRaw } from "../type"

export class FnDeclaration {
  constructor(
    readonly argCount: number,
    readonly args: VTypeRaw[],
  ) {}
}
