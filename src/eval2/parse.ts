export interface IRPrfx<T> {
  data: T

  /**
   * Binding power of the left side. If less than `.pr`, the operator will not
   * be able to contain itself when separated by an infix operator. This is how
   * `sin 2 * sin 3` and `sum 2 * sum 3` are distinguished.
   */
  pl: number

  /** Binding power of the right side. */
  pr: number
}

export interface IRSufx<T> {
  data: T

  /** Binding power of the left side. */
  prec: number
}

export interface IRInfx<T> {
  data: T

  /**
   * If `pl < pr`, this operator is left-associative.\
   * If `pr > pl`, this operator is right-associative.
   */
  pl: number

  /**
   * If `pl < pr`, this operator is left-associative.\
   * If `pr > pl`, this operator is right-associative.
   */
  pr: number

  /**
   * A special precedence to use for the right-hand-side when parsing at root
   * level. Should be equal to `.pr` in almost all cases; it's used exclusively
   * for the comma operator right now.
   */
  pr0: number
}

export class IR<T> {
  constructor(
    readonly leaf: Node<T> | null,
    readonly prfx: IRPrfx<T> | null,
    readonly sufx: IRSufx<T> | null,
    readonly infx: IRInfx<T> | null,
  ) {}
}

/** A parsed node. Leaf nodes are represented by having no arguments. */
export class Node<T> {
  constructor(
    readonly data: T,
    readonly args: readonly Node<T>[] | null,
  ) {}
}

export class Parser<T> {
  private index = 0
  private readonly j: IR<T> | null

  constructor(
    private readonly ir: IR<T>[],

    /**
     * The token automatically inserted between two values if not separated by
     * an infix operator. May be used to implement implicit multiplication.
     */
    juxtaposeToken: IR<T> | null,
  ) {
    this.j = juxtaposeToken
  }

  private raiseAt(message: string, index: number): never {
    throw new Error(`${message} (at ${index})`)
  }

  private raisePrev(message: string): never {
    this.raiseAt(message, this.index - 1)
  }

  private raiseNext(message: string): never {
    this.raiseAt(message, this.index)
  }

  private peek() {
    return this.ir[this.index]
  }

  private next() {
    const ir = this.ir[this.index]
    if (ir != null) this.index++
    return ir
  }

  private leaf(): Node<T> {
    const next = this.next()

    if (next == null) {
      this.raiseNext(`Unexpected end of expression.`)
    }

    if (next.leaf != null) {
      return next.leaf
    }

    if (next.prfx) {
      return new Node(next.prfx.data, [this.expr(next.prfx.pr)])
    }

    this.raisePrev(`Expected expression.`)
  }

  private isNextOpLowerThan(min: number, skip: 0 | 1): boolean {
    for (let i = this.index + skip; i < this.ir.length; i++) {
      const el = this.ir[i]!
      if (el.prfx && el.prfx.pl < min) {
        return true
      }
      if (el.leaf || el.infx) {
        return false
      }
    }
    return false
  }

  private expr(min: number): Node<T> {
    let lhs = this.leaf()

    while (true) {
      const next = this.peek()

      if (next == null) {
        return lhs
      }

      if (next.sufx) {
        if (next.sufx.prec > min) {
          this.next()
          lhs = new Node(next.sufx.data, [lhs])
          continue
        } else break
      }

      let skip: 0 | 1 = 1
      const infx = next.infx ?? ((skip = 0), this.j?.infx)
      if (!infx || infx.pl < min || this.isNextOpLowerThan(min, skip)) {
        break
      }
      if (skip) {
        this.next()
      }
      lhs = new Node(infx.data, [
        lhs,
        this.expr(min === 0 ? infx.pr0 : infx.pr),
      ])
      continue
    }

    return lhs
  }

  parse(): Node<T> {
    const item = this.expr(0)
    if (this.index < this.ir.length) {
      this.raiseNext("Unable to parse expression.")
    }
    return item
  }
}

/** Creates a leaf node. */
export function leaf<T>(data: T) {
  return new IR(new Node(data, null), null, null, null)
}

/**
 * Creates a prefix operator. Use the two-argument form with `pl < pr` to create
 * an operator where `op 2 * op 3 == (op 2) * (op 3)`; use the one-argument form
 * if `op 2 * op 3 == op (2 * op 3)`.
 */
export function prfx<T>(data: T, pl: number, pr = pl) {
  return new IR(null, { data, pl, pr }, null, null)
}

/** Creates a suffix operator. */
export function sufx<T>(data: T, prec: number) {
  return new IR(null, null, { data, prec }, null)
}

/**
 * Creates an infix operator. Use the two-argument form in almost all cases,
 * with the three-argument form being used if you need a different precedence on
 * the right-hand-side if parsed at the root level of an expression (e.g. for
 * commas).
 */
export function infx<T>(data: T, pl: number, pr: number, pr0 = pr) {
  return new IR(null, null, null, { data, pl, pr, pr0 })
}

/** Creates a prefix+infix operator, like the plus and minus signs. */
export function pifx<T>(data: T, pl: number, pr: number, prec: number) {
  return new IR(null, { data, pl: prec, pr: prec }, null, {
    data,
    pl,
    pr,
    pr0: pr,
  })
}
