import { U_ZERO_WIDTH_SPACE, h, t } from "./jsx"

// Many properties are declared as `readonly` to prevent changes to them in
// user-level code. However, these may change, in the same vein as DOM getters
// such as `.nextElementSibling`.

/** Used across the system to represent the left side, or leftwards. */
export const L = -1

/** Used across the system to represent the right side, or rightwards. */
export const R = 1

/** A direction or side. */
export type Dir = -1 | 1

/**
 * Something in the edit tree. In a math expression, this is either a
 * {@link Block `Block`} or a {@link Command `Command`}.
 */
export abstract class Node {
  /** The parent of this node. */
  abstract readonly parent: Node | null

  /** The sibling towards the left. */
  abstract readonly [L]: Node | null

  /** The sibling towards the right. */
  abstract readonly [R]: Node | null

  /** The HTML element rendered by this node. */
  abstract readonly el: HTMLSpanElement

  /** Reads this node in a screen-accessible format. */
  abstract intoScreenReadable(): string

  /** Writes this node in ASCII-style math. */
  abstract intoAsciiMath(): string

  /** Writes this node in LaTeX. */
  abstract intoLatex(): string
}

/**
 * Something with optional siblings. Also used to represent the ends of a
 * {@link Block `Block`}.
 */
export interface Ends<T> {
  /** The sibling towards the left. */
  readonly [L]: T | null

  /** The sibling towards the right. */
  readonly [R]: T | null
}

/** An interface used for type-safe changes to {@link Ends `Ends`}. */
interface EndsMut<T> extends Ends<T> {
  [L]: T | null
  [R]: T | null
}

/** An interface used for type-safe changes to {@link Block `Block`}. */
interface BlockMut extends Block {
  [L]: Block | null
  [R]: Block | null
  parent: Command | null
  ends: EndsMut<Command>
}

/** An expression. Contains zero or more {@link Command `Command`}s. */
export class Block extends Node {
  /** The block before this one. */
  readonly [L]: Block | null

  /** The block after this one. */
  readonly [R]: Block | null = null

  /** The ends of the {@link Command `Command`}s contained in this block. */
  readonly ends: Ends<Command> = { [L]: null, [R]: null }

  readonly el = h(
    "span",
    "inline-block",
    // h(
    //   "span",
    //   "inline-block before:content-['c'] before:font-['Times'] before:[line-height:.9] before:italic",
    // ),
  )

  constructor(
    /** The command containing this block. */
    readonly parent: Command | null,
  ) {
    super()

    if (parent) {
      this[L] = parent.blocks[parent.blocks.length - 1] || null
      parent.blocks.push(this)
    } else {
      this[L] = null
    }
  }

  intoAsciiMath(): string {
    let ret = ""
    let el = this.ends[L]
    while (el) {
      ret += el.intoAsciiMath()
      el = el[R]
    }
    return ret
  }

  intoLatex(): string {
    let ret = ""
    let el = this.ends[L]
    while (el) {
      ret += el.intoLatex()
      el = el[R]
    }
    return ret
  }

  intoScreenReadable(): string {
    let ret = ""
    let el = this.ends[L]
    while (el) {
      ret += el.intoScreenReadable()
      el = el[R]
    }
    return ret
  }
}

/** An interface used for type-safe changes to {@link Cursor `Cursor`}s. */
interface CursorMut extends Cursor {
  [R]: Command | null
  parent: Block | null
}

/** A cursor belongs inside some block. */
export class Cursor {
  /** The command on the left side of this cursor. */
  get [L](): Command | null {
    if (this[R]) {
      return this[R][L]
    } else {
      return this.parent?.ends[R] || null
    }
  }

  /** The command on the right side of this cursor. Used as an anchor point. */
  readonly [R]: Command | null

  /** The HTML element rendered by this cursor. */
  readonly el = h(
    "span",
    "z-[1] border-l -ml-px relative inline-block border-current",
    t(U_ZERO_WIDTH_SPACE),
  )

  constructor(
    /** The block containing this cursor. */
    readonly parent: Block | null,
    before: Command | null,
  ) {
    this[R] = before
  }

  /** Removes this cursor from the DOM. */
  unrender() {
    this.el.remove()
  }

  /** Renders this cursor in an appropriate location in the DOM. */
  render() {
    this.parent?.el.insertBefore(this.el, this[R]?.el || null)
  }

  /** Moves this cursor to some side of a {@link Command `Command`}. */
  moveTo(el: Command, side: Dir) {
    ;(this as CursorMut).parent = el.parent
    ;(this as CursorMut)[R] = side == L ? el : el[R]
    return this
  }

  /** Moves this cursor to some side of a {@link Block `Block`}. */
  moveInside(el: Block, side: Dir) {
    ;(this as CursorMut).parent = el
    ;(this as CursorMut)[R] = (side == L && el.ends[L]) || null
    return this
  }

  /** Creates a copy of this cursor in the same place. */
  clone() {
    return new Cursor(this.parent, this[R])
  }

  /** Creates a {@link Span `Span`} where this cursor is. */
  span() {
    return new Span(this.parent, this[L], this[R])
  }

  /** Creates a {@link Selection `Selection`} where this cursor is. */
  selection() {
    return new Selection(this.parent, this[L], this[R], R)
  }
}

/** An interface used for type-safe mutable changes to {@link Span `Span`}. */
interface SpanMut extends Span {
  [L]: Command | null
  [R]: Command | null
}

/** A span is a range in some block. */
export class Span {
  /**
   * The {@link Command `Command`} to the left of this `Span`. Not included in
   * the `Span` itself.
   */

  readonly [L]: Command | null
  /**
   * The {@link Command `Command`} to the right of this `Span`. Not included in
   * the `Span` itself.
   */
  readonly [R]: Command | null

  constructor(
    /** The {@link Block `Block`} containing this `Span`. */
    readonly parent: Block | null,
    lhs: Command | null,
    rhs: Command | null,
  ) {
    this[L] = lhs
    this[R] = rhs
  }

  /** Returns `true` if this `Span` is a single point. */
  isCursor() {
    return this.at(L) == this[R]
  }

  /**
   * Gets the {@link Command `Command`} at one side of this `Span`. The returned
   * `Command` will be inside the `Span`, unless the `Span` is a
   */
  at(side: Dir): Command | null {
    return this[side]
      ? this[side]![side == R ? L : R]
      : this.parent?.ends[side] || null
  }

  /**
   * Calls a function for each element in the `Span`, travelling towards the
   * `dir` direction. Defaults to left-to-right order.
   */
  each(fn: (el: Command) => void, dir: Dir = R) {
    let el = this.at(dir == L ? R : L)
    let end = this[dir]

    while (el && el != end) {
      fn(el)
      el = el[dir]
    }
  }

  unrender() {
    this.each(({ el }) => el.classList.remove("bg-blue-200"))
  }

  render() {
    this.each(({ el }) => el.classList.add("bg-blue-200"))
  }

  /** Creates a {@link Cursor `Cursor`} at one side of this `Span`. */
  cursor(side: Dir) {
    return new Cursor(this.parent, side == R ? this[R] : this.at(L))
  }
}

/** A {@link Span `Span`} with focus and anchor nodes. */
export class Selection extends Span {
  constructor(
    readonly parent: Block | null,
    lhs: Command | null,
    rhs: Command | null,
    public focused: Dir,
  ) {
    super(parent, lhs, rhs)
  }

  extendWithin(dir: Dir) {
    console.log("extending")

    const isCursor = this[L] ? this[L][R] == this[R] : !this[R]

    if (isCursor) {
      console.log("is cursor")
      this.focused = dir
      if (this[dir]) {
        // It is a cursor anywhere else
        ;(this as SpanMut)[dir] = this[dir]![dir]
        return
      } else {
        // It is a cursor at the end
        return
      }
    }

    if (this.focused == dir) {
      ;(this as SpanMut)[this.focused] = this[dir]?.[dir] || null
    } else {
      ;(this as SpanMut)[this.focused] = this.at(this.focused)
      console.log("doing nothing")
    }
  }

  flip() {
    this.focused = this.focused == L ? R : L
  }
}

interface CommandMut extends Command {
  [L]: Command | null
  [R]: Command | null
  parent: Block | null
}

/** A command is a single item inside a block. */
export abstract class Command extends Node {
  readonly [L]: Command | null = null
  readonly [R]: Command | null = null
  readonly parent: Block | null = null

  constructor(
    readonly ctrlSeq: string,
    readonly el: HTMLSpanElement,
    readonly blocks: Block[],
  ) {
    super()
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]! as BlockMut
      block.parent = this
      block[L] = blocks[i - 1] || null
      block[R] = blocks[i + 1] || null
    }
  }

  insertAt(cursor: Cursor, dir: Dir) {
    if (!cursor.parent) {
      this.el.remove()
      return
    }

    const l = cursor[L]
    const r = cursor[R]

    cursor.parent.el.insertBefore(this.el, cursor[R]?.el || null)
    ;(this as CommandMut)[L] = l
    ;(this as CommandMut)[R] = r
    ;(this as CommandMut).parent = cursor.parent
    if (dir == R) (cursor as CursorMut)[R] = this
    if (l) {
      ;(l as CommandMut)[R] = this
    } else {
      ;(cursor.parent.ends as EndsMut<Command>)[L] = this
    }
    if (r) {
      ;(r as CommandMut)[L] = this
    } else {
      ;(cursor.parent.ends as EndsMut<Command>)[R] = this
    }
  }
}
