import type { Node, PuncCmp } from "@/eval/ast/token"
import { L, R, type Dir } from "@/field/dir"
import type { LatexParser } from "../../latex"
import type { Command, Cursor, InitProps } from "../../model"
import { OpMinus, opp } from "./op"
import { Op } from "./op-core"

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
abstract class OpCmp extends OpCeq {
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

type Data = readonly [
  latex: string,
  reader: string,
  html: string,
  ascii: string,
  kind: PuncCmp,
]

function ceq(eq: Data, ne: Data, endsImplicitGroup = true) {
  return class extends OpCeq {
    static init(cursor: Cursor, props: InitProps) {
      this.exitSupSub(cursor, props)
      new this(false).insertAt(cursor, L)
    }

    static fromLatex(cmd: string, _parser: LatexParser): Command {
      if (cmd == ne[0] || cmd + " " == ne[0]) {
        return new this(true)
      } else {
        return new this(false)
      }
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

    ir(tokens: Node[]): void {
      const op = this.neg ? ne : eq
      tokens.push({
        type: "punc",
        kind: "cmp",
        value: op[4],
      })
    }
  }
}

function cmp(
  normal: Data,
  normalNeg: Data,
  orEq: Data,
  negOrEq: Data,
  endsImplicitGroup = true,
) {
  Object.freeze(normal)
  Object.freeze(normalNeg)
  Object.freeze(orEq)
  Object.freeze(negOrEq)

  function getOp(neg: boolean, eq: boolean) {
    return (
      neg ?
        eq ? negOrEq
        : normalNeg
      : eq ? orEq
      : normal
    )
  }

  return class extends OpCmp {
    static init(cursor: Cursor, props: InitProps) {
      this.exitSupSub(cursor, props)
      new this(false, false).insertAt(cursor, L)
    }

    static fromLatex(cmd: string, _parser: LatexParser): Command {
      if (cmd == orEq[0] || cmd + " " == orEq[0]) {
        return new this(false, true)
      } else if (cmd == negOrEq[0] || cmd + " " == negOrEq[0]) {
        return new this(true, true)
      } else if (cmd == normalNeg[0] || cmd + " " == normalNeg[0]) {
        return new this(true, false)
      } else {
        return new this(false, false)
      }
    }

    constructor(neg: boolean, eq: boolean) {
      const op = getOp(neg, eq)
      super(neg, eq, op[0], op[2])
    }

    private get op() {
      return getOp(this.neg, this.eq)
    }

    endsImplicitGroup(): boolean {
      return endsImplicitGroup
    }

    html(): string {
      return this.op[2]
    }

    latex(): string {
      return this.op[0]
    }

    reader(): string {
      return this.op[1]
    }

    ascii(): string {
      return this.op[3]
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

    ir(tokens: Node[]): void {
      tokens.push({
        type: "punc",
        kind: "cmp",
        value: this.op[4],
      })
    }
  }
}

export class OpEq extends ceq(
  ["=", " is equal to ", "=", "=", "cmp-eq"],
  ["\\neq ", " is not equals to ", "≠", "≠", "cmp-neq"],
) {
  static init(cursor: Cursor, props: InitProps) {
    if (props.input == "=") {
      if (cursor[L] instanceof OpCmp && !cursor[L].eq) {
        cursor[L].setEq(true)
        return
      }
    }

    return super.init(cursor, props)
  }
}

export class OpTilde extends ceq(
  ["~", " tilde ", "~", "~", "cmp-tilde"],
  ["\\not\\sim ", " not-tilde ", "≁", "≁", "cmp-ntilde"],
) {
  static init(cursor: Cursor, props: InitProps): void {
    if (cursor[L] instanceof OpTilde && !cursor[L].neg) {
      cursor[L].remove()
      new OpApprox(false).insertAt(cursor, L)
    } else {
      super.init(cursor, props)
    }
  }
}

export class OpApprox extends ceq(
  ["≈", " approximately equal to ", "≈", "≈", "cmp-approx"],
  ["\\not\\approx ", " not approximately equal to ", "≉", "≉", "cmp-napprox"],
) {
  delete(cursor: Cursor, from: Dir): void {
    if (!this.neg && from == R) {
      const tilde = new OpTilde(false)
      tilde.insertAt(this.cursor(L), L)
      this.remove()
      if (cursor[R] == this) {
        cursor.moveTo(tilde, L)
      }
    } else {
      super.delete(cursor, from)
    }
  }
}

export const OpLt = cmp(
  ["<", " is less than ", "<", "<", "cmp-lt"],
  ["\\nless ", " is not less than ", "≮", "≮", "cmp-nlt"],
  ["\\leq ", " is less than or equal to ", "≤", "<=", "cmp-lte"],
  ["\\nleq ", " is not less than or equal to ", "≰", "≰", "cmp-nlte"],
)

export class OpGt extends cmp(
  [">", " is greater than ", ">", ">", "cmp-gt"],
  ["\\ngtr ", " is not greater than ", "≯", "≯", "cmp-ngt"],
  ["\\geq ", " is greater than or equal to ", "≥", ">=", "cmp-gte"],
  ["\\ngeq ", " is not greater than or equal to ", "≱", "≱", "cmp-ngte"],
) {
  static init(cursor: Cursor, props: InitProps) {
    if (props.input == ">") {
      if (cursor[L] instanceof OpEq && !cursor[L].neg) {
        cursor[L].remove()
        new OpDoubleRightArrow().insertAt(cursor, L)
        return
      }

      if (cursor[L] instanceof OpMinus) {
        cursor[L].remove()
        new OpRightArrow().insertAt(cursor, L)
        return
      }
    }

    return super.init(cursor, props)
  }
}

export class OpDoubleRightArrow extends opp(
  "\\Rightarrow ",
  " maps to ",
  "⇒",
  "=>",
  true,
) {
  delete(cursor: Cursor, from: Dir): void {
    if (from == R) {
      const minus = new OpEq(false)
      this.replaceWith(minus.lone())
      if (cursor[R] == this) {
        cursor.moveTo(minus, L)
      }
      return
    }

    super.delete(cursor, from)
  }
}

export class OpRightArrow extends opp("\\to ", " becomes ", "→", "->", true) {
  delete(cursor: Cursor, from: Dir): void {
    if (from == R) {
      const minus = new OpMinus()
      this.replaceWith(minus.lone())
      if (cursor[R] == this) {
        cursor.moveTo(minus, L)
      }
      return
    }

    super.delete(cursor, from)
  }
}
