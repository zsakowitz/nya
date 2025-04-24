import type { Code, Issues, Pos } from "../ast/issue"
import type { Lang } from "./lang"
import type { Value } from "./value"

/**
 * Declarations are put at the top-level scope in an emit. Contrast
 * {@linkcode EmitBlock}, which is used for an individual block of code.
 *
 * A single {@linkcode EmitDecl} instance is often shared between
 * {@linkcode EmitBlock}s.
 */
export class EmitDecl {
  source = ""

  constructor(
    /** The target language for this script. */
    readonly lang: Lang,

    /** A list of issues occurring during emit. */
    readonly issues: Issues,
  ) {}

  /** Marks an issue with the emit stage. */
  raise(code: Code, pos: Pos) {
    this.issues.raise(code, pos)
  }
}

/** Something which can be interpolated when emitted to a block. */
export type EmitInterp = string | Value

/**
 * Blocks are used for statements needed to execute individual chunks of code.
 * Contrast {@linkcode EmitDecl}, which are used for one-time top-level
 * declarations needed for the script to function.
 *
 * A single {@linkcode EmitDecl} instance is often shared between
 * {@linkcode EmitBlock}s.
 */
export class EmitBlock {
  private source = ""

  constructor(readonly decl: EmitDecl) {}

  /**
   * Declarations are put at the top-level scope in an emit. Contract
   * {@linkcode EmitBlock}, which is used for an individual block of code.
   *
   * A single {@linkcode EmitDecl} instance is often shared between
   * {@linkcode EmitBlock}s.
   */
  get lang() {
    return this.decl.lang
  }

  /** Marks an issue on the emit stage. */
  raise(code: Code, pos: Pos) {
    this.decl.issues.raise(code, pos)
  }

  /** Pushes a string to the block's statements. */
  push(text: string): void
  /** Pushes a string with interpolated values to the block's statements. */
  push(text: TemplateStringsArray, ...interps: EmitInterp[]): void
  push(text: string | TemplateStringsArray, ...interps: EmitInterp[]) {
    if (typeof text == "string") {
      this.source += text
      return
    }

    this.source += String.raw(
      { raw: text },
      ...interps.map((x): string => {
        if (typeof x == "string") {
          return x
        }
        return x.emit(this.lang, this)
      }),
    )
  }
}
