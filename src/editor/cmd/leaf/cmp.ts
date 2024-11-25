import { L, type Cursor, type Dir } from "../../model"
import { Op } from "./op"

/** An `Op` which can be negated. */
export abstract class OpCeq extends Op {
  constructor(
    readonly neg: boolean,
    ctrlSeq: string,
    html: string,
  ) {
    super(ctrlSeq, html)
  }

  setNeg(neg: boolean) {
    ;(this as any).neg = neg
    this.setHtml(this.html())
  }

  abstract html(): string
}

/** An `Op` which can take an optional equals sign and which can be negated. */
export abstract class OpCmp extends OpCeq {
  constructor(
    neg: boolean,
    readonly eq: boolean,
    ctrlSeq: string,
    html: string,
  ) {
    super(neg, ctrlSeq, html)
  }

  setEq(eq: boolean) {
    ;(this as any).eq = eq
    this.setHtml(this.html())
  }
}

function ceq(
  eq: [latex: string, reader: string, html: string, ascii: string],
  ne: [latex: string, reader: string, html: string, ascii: string],
  endsImplicitGroup = true,
) {
  return class extends OpCeq {
    static init(cursor: Cursor, input: string) {
      new this(false).insertAt(cursor, L)
    }

    constructor(neg: boolean) {
      const op = neg ? ne : eq
      super(neg, op[0], op[2])
    }

    endsImplicitGroup(): boolean {
      return endsImplicitGroup
    }

    html(): string {
      const op = this.neg ? ne : eq
      return op[2]
    }

    latex(): string {
      const op = this.neg ? ne : eq
      return op[0]
    }

    reader(): string {
      const op = this.neg ? ne : eq
      return op[1]
    }

    ascii(): string {
      const op = this.neg ? ne : eq
      return op[3]
    }

    delete(cursor: Cursor, from: Dir): void {
      if (this.neg) {
        this.setNeg(false)
        return
      }
      super.delete(cursor, from)
    }
  }
}

function cmp(
  normal: [latex: string, reader: string, html: string, ascii: string],
  normalNeg: [latex: string, reader: string, html: string, ascii: string],
  orEq: [latex: string, reader: string, html: string, ascii: string],
  negOrEq: [latex: string, reader: string, html: string, ascii: string],
  endsImplicitGroup = true,
) {
  return class extends OpCmp {
    static init(cursor: Cursor, input: string) {
      new this(false, false).insertAt(cursor, L)
    }

    constructor(neg: boolean, eq: boolean) {
      const op =
        neg ?
          eq ? negOrEq
          : normalNeg
        : eq ? orEq
        : normal
      super(neg, eq, op[0], op[2])
    }

    endsImplicitGroup(): boolean {
      return endsImplicitGroup
    }

    html(): string {
      const op =
        this.neg ?
          this.eq ?
            negOrEq
          : normalNeg
        : this.eq ? orEq
        : normal
      return op[2]
    }

    latex(): string {
      const op =
        this.neg ?
          this.eq ?
            negOrEq
          : normalNeg
        : this.eq ? orEq
        : normal
      return op[0]
    }

    reader(): string {
      const op =
        this.neg ?
          this.eq ?
            negOrEq
          : normalNeg
        : this.eq ? orEq
        : normal
      return op[1]
    }

    ascii(): string {
      const op =
        this.neg ?
          this.eq ?
            negOrEq
          : normalNeg
        : this.eq ? orEq
        : normal
      return op[3]
    }

    delete(cursor: Cursor, from: Dir): void {
      if (this.neg) {
        this.setNeg(false)
        return
      }
      if (this.eq) {
        this.setEq(false)
        return
      }
      super.delete(cursor, from)
    }
  }
}

export class OpEq extends ceq(
  ["=", " is equal to ", "=", "="],
  ["≠", " is not equals to ", "≠", "≠"],
) {
  static init(cursor: Cursor, input: string) {
    if (input == "=") {
      if (cursor[L] instanceof OpCmp && !cursor[L].eq && !cursor[L].neg) {
        cursor[L].setEq(true)
        return
      }
    }

    return super.init(cursor, input)
  }
}

export const OpLt = cmp(
  ["<", " is less than ", "<", "<"],
  ["≮", " is not less than ", "≮", "≮"],
  ["≤", " is less than or equal to ", "≤", "<="],
  ["≮_", " is not less than or equal to ", "≮_", "≮_"],
)

export const OpGt = cmp(
  [">", " is greater than ", ">", ">"],
  ["≯", " is not greater than ", "≯", "≯"],
  ["≥", " is greater than or equal to ", "≥", ">="],
  ["≯_", " is not greater than or equal to ", "≯_", "≯_"],
)
