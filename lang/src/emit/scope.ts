export class ScopeProgram {
  declare private __brand_scope_program

  constructor(readonly emitTests: boolean) {}

  file(source: string) {
    return new ScopeFile(this, source)
  }
}

export class ScopeFile {
  declare private __brand_scope_file

  constructor(
    readonly program: ScopeProgram,
    readonly source: string,
  ) {}

  block() {
    return new ScopeBlock(this, null)
  }
}

export class ScopeBlock {
  declare private __brand_scope_block

  constructor(
    readonly script: ScopeFile,
    readonly parent: ScopeBlock | null,
  ) {}
}
