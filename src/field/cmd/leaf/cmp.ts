import type { Node, PuncCmp } from "../../../eval/ast/token"
import type { LatexParser } from "../../latex"
import {
  L,
  R,
  type Command,
  type Cursor,
  type Dir,
  type InitProps,
} from "../../model"
import { Op, OpDoubleRightArrow, OpMinus, OpRightArrow } from "./op"

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

type Data = readonly [
  latex: string,
  reader: string,
  html: string,
  ascii: string,
]

function ceq(
  kind: Extract<PuncCmp, { dir: string; neg: boolean; eq?: undefined }>["dir"],
  eq: Data,
  ne: Data,
  endsImplicitGroup = true,
) {
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
      tokens.push({
        type: "punc",
        kind: "cmp",
        value: { dir: kind, neg: this.neg },
      })
    }
  }
}

function cmp(
  kind: Extract<PuncCmp, { dir: string; neg: boolean; eq: boolean }>["dir"],
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
        value: { dir: kind, eq: this.eq, neg: this.neg },
      })
    }
  }
}

export class OpEq extends ceq(
  "=",
  ["=", " is equal to ", "=", "="],
  ["\\neq ", " is not equals to ", "≠", "≠"],
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
  "~",
  ["~", " tilde ", "~", "~"],
  ["\\not\\sim ", " not-tilde ", "≁", "≁"],
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
  "≈",
  ["≈", " approximately equal to ", "≈", "≈"],
  ["\\not\\approx ", " not approximately equal to ", "≉", "≉"],
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
  "<",
  ["<", " is less than ", "<", "<"],
  ["\\nless ", " is not less than ", "≮", "≮"],
  ["\\leq ", " is less than or equal to ", "≤", "<="],
  ["\\nleq ", " is not less than or equal to ", "≰", "≰"],
)

export class OpGt extends cmp(
  ">",
  [">", " is greater than ", ">", ">"],
  ["\\ngtr ", " is not greater than ", "≯", "≯"],
  ["\\geq ", " is greater than or equal to ", "≥", ">="],
  ["\\ngeq ", " is not greater than or equal to ", "≱", "≱"],
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
