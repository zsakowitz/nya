import type { Pos } from "../ast/issue"

export class ScopeProgram {
  constructor(readonly emitTests: boolean) {}

  file(source: string) {
    return new ScopeFile(this, source)
  }
}

export class ScopeFile {
  constructor(
    readonly program: ScopeProgram,
    readonly source: string,
  ) {}

  block() {
    return new ScopeBlock(this, null)
  }

  at(pos: Pos) {
    return this.source.slice(pos.start, pos.end)
  }
}

export class ScopeBlock {
  constructor(
    readonly file: ScopeFile,
    readonly parent: ScopeBlock | null,
  ) {}
}
