import { h } from "./jsx"

// Many properties are declared as `readonly` to prevent changes to them in
// user-level code. However, these may change, in the same vein as DOM getters
// such as `.nextElementSibling`.

/** Used across the system to represent the left side, or leftwards. */
export const L = -1

/** Used across the system to represent the right side, or rightwards. */
export const R = 1

/** Used across the system to represent the top side, or upwards. */
export const U = -2

/** Used across the system to represent the bottom side, or downwards. */
export const D = 2

/** A direction or side. */
export type Dir = -1 | 1

/** A vertical direction or side. */
export type VDir = -2 | 2

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
  abstract reader(): string

  /** Writes this node in ASCII-style math. */
  abstract ascii(): string

  /** Writes this node in LaTeX. */
  abstract latex(): string
}

/**
 * Pointers to the {@link Command `Command`}s on either side of a
 * {@link Block `Block`}.
 */
export interface Ends {
  /** The leftmost {@link Command `Command`}. */
  readonly [L]: Command | null

  /** The rightmost {@link Command `Command`}. */
  readonly [R]: Command | null
}

/** An interface used for type-safe changes to {@link Ends `Ends`}. */
interface EndsMut extends Ends {
  [L]: Command | null
  [R]: Command | null
}

/** An interface used for type-safe changes to {@link Block `Block`}. */
interface BlockMut extends Block {
  [L]: Block | null
  [R]: Block | null
  parent: Command | null
  ends: EndsMut
}

/** An expression. Contains zero or more {@link Command `Command`}s. */
export class Block extends Node {
  /** The block before this one. */
  readonly [L]: Block | null

  /** The block after this one. */
  readonly [R]: Block | null = null

  /** The ends of the {@link Command `Command`}s contained in this block. */
  readonly ends: Ends = { [L]: null, [R]: null }

  readonly el = h(
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

  /** Returns whether this `Block` is empty. */
  isEmpty() {
    return this.ends[L] == null
  }

  /** Attaches another block onto a side of this one. */
  attach(other: Block, command: Command | null, dir: Dir) {
    if (!other.ends[L]) {
      return
    }

    const lhs =
      dir == L
        ? command
          ? command[L]
          : this.ends[R]
        : command
          ? command
          : null

    if (lhs) {
      ;(lhs as CommandMut)[R] = other.ends[L]
    }

    const rhs =
      dir == R
        ? command
          ? command[R]
          : this.ends[L]
        : command
          ? command
          : null

    if (rhs) {
      ;(rhs as CommandMut)[L] = other.ends[R]
    }

    ;(other.ends[L] as CommandMut)[L] = lhs
    ;(other.ends[R] as CommandMut)[R] = rhs

    const domAnchor = rhs ? rhs.el : null
    let el: Command | null = other.ends[L]
    while (el) {
      ;(el as CommandMut).parent = this
      this.el.insertBefore(el.el, domAnchor)
      el = el[R]
    }
  }

  ascii(): string {
    let ret = ""
    let el = this.ends[L]
    while (el) {
      ret += el.ascii()
      el = el[R]
    }
    return ret
  }

  latex(): string {
    let ret = ""
    let el = this.ends[L]
    while (el) {
      ret += el.latex()
      el = el[R]
    }
    return ret
  }

  reader(): string {
    let ret = ""
    let el = this.ends[L]
    while (el) {
      ret += el.reader()
      el = el[R]
    }
    return ret
  }

  /** Creates a {@link Cursor `Cursor`} pointing to the given end of this `Block`. */
  cursor(end: Dir) {
    return new Cursor(this, end == R ? null : this.ends[L])
  }

  /** Finds the {@link Command `Command`} closest to the given `clientX`. */
  nodeAt(clientX: number): Command | null {
    // We use binary search b/c it seems fun
    // This is still technically O(n) in the number of child nodes
    let el = this.ends[L]
    while (el) {
      const box = el.el.getBoundingClientRect()
      const rhs = box.left + box.width
      if (clientX < rhs) {
        return el
      }
      el = el[R]
    }
    return null
  }
}

/** An interface used for type-safe changes to {@link Cursor `Cursor`}s. */
interface CursorMut extends Cursor {
  [R]: Command | null
  parent: Block | null
}

/** A `Cursor` provides a reference point for insertions and deletions. */
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

  constructor(
    /** The block containing this cursor. */
    readonly parent: Block | null,
    before: Command | null,
  ) {
    this[R] = before
  }

  /** Moves this cursor to another cursor's position. */
  setTo(other: Cursor) {
    ;(this as CursorMut).parent = other.parent
    ;(this as CursorMut)[R] = other[R]
  }

  /** Moves this cursor in the given direction. */
  move(dir: Dir) {
    if (this[dir]) {
      this[dir].moveInto(this, dir)
    } else if (this.parent?.parent) {
      this.parent.parent.moveOutOf(this, dir, this.parent)
    }
  }

  /**
   * Moves this `Cursor` in the given vertical direction. Returns `true` if the
   * cursor moved.
   */
  moveVert(dir: VDir): boolean {
    // Get the cursor's X position; we want to be as close to it as possible
    const x = this.clientX()
    // The cursor doesn't have an X position iff it is not in the DOM, and thus
    // we may safely ignore the movement operation.
    if (x == null) return false

    // If a sub- or superscript is available on the RHS, take it
    {
      const into = this[R]?.vertInto(dir, x)
      if (into) {
        this.moveIn(into, L)
        return true
      }
    }

    // Else, if a sub- or superscript is available on the LHS, take it
    {
      const into = this[L]?.vertInto(dir, x)
      if (into) {
        this.moveIn(into, R)
        return true
      }
    }

    // Complex fun algorithm time

    // Find the closest ancestor which defines a block we can move into
    let block: Block | null | undefined = this.parent
    let node: Block | undefined
    while (block) {
      if (!block.parent) {
        return false
      }

      node = block.parent.vertOutOf(dir, block)
      if (node) {
        break
      }

      block = block.parent.parent
    }

    console.log({ block, node })
    return true // TODO:
  }

  /**
   * Gets the X-coordinate of this `Cursor` onscreen. Returns `null` if the
   * `Cursor` is not attached to any element.
   */
  clientX() {
    if (this[R]) {
      return this[R].el.getBoundingClientRect().left
    } else if (this.parent) {
      return this.parent.el.getBoundingClientRect().right
    } else {
      return null
    }
  }

  /** Moves this cursor to some side of a {@link Command `Command`}. */
  moveTo(el: Command, side: Dir) {
    ;(this as CursorMut).parent = el.parent
    ;(this as CursorMut)[R] = side == L ? el : el[R]
    return this
  }

  /** Moves this cursor to some side of a {@link Block `Block`}. */
  moveIn(el: Block, side: Dir) {
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

  /** Renders a DOM node at the cursor's position. */
  render(el: HTMLElement) {
    if (this.parent) {
      this.parent.el.insertBefore(el, this[R] ? this[R].el : null)
    } else {
      el.remove()
    }
  }
}

/**
 * A range within a {@link Block `Block`}.
 *
 * A `Span`'s two sides must be properly ordered, with `this[L]` strictly before
 * `this[R]`, with both contained within `this.parent`.
 */
export class Span {
  /**
   * The {@link Command `Command`} to the left of this `Span`. Not included in
   * the `Span` itself.
   *
   * In regular nodes, `[L]` is readonly. However, a `Span` is merely a view
   * over the tree, and has no invariants it maintains over other nodes. As
   * such, its sides are mutable.
   */
  [L]: Command | null;

  /**
   * The {@link Command `Command`} to the right of this `Span`. Not included in
   * the `Span` itself.
   *
   * In regular nodes, `[R]` is readonly. However, a `Span` is merely a view
   * over the tree, and has no invariants it maintains over other nodes. As
   * such, its sides are mutable.
   */
  [R]: Command | null

  constructor(
    /** The {@link Block `Block`} containing this `Span`. */
    public parent: Block | null,
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

  /** Creates a {@link Cursor `Cursor`} at one side of this `Span`. */
  cursor(side: Dir) {
    return new Cursor(this.parent, side == R ? this[R] : this.at(L))
  }

  /** Moves one side of this `Span` in a direction. */
  move(side: Dir, towards: Dir) {
    // If there is no parent, we cannot move anyway
    if (!this.parent) return

    const isCursor = this.isCursor()

    // If we are a cursor, and we move the R node left, we will be in an invalid
    // state. Thus, we must swap which node is moved.
    if (isCursor && side != towards) {
      side = side == L ? R : L
    }

    const willEscape =
      side == towards ? this[side] == null : isCursor && this[towards] == null

    // If we're going to escape, select the parent
    if (willEscape) {
      const command = this.parent.parent
      if (!command) return

      this.parent = command.parent
      this[L] = command[L]
      this[R] = command[R]
      return
    } else if (this[side]) {
      this[side] = this[side]![towards]
    } else {
      // If we get here, side != towards
      this[side] = this.parent.ends[side]
    }
  }

  /** Extends this `Span` to one end. */
  extendToEnd(dir: Dir) {
    this[dir] = null
    return this
  }

  /**
   * Removes the {@link Command `Command`}s contained by this `Span` from their
   * surrounding block and moves them into a new {@link Block `Block`}. The
   * `Span` will be a single point after the removal.
   *
   * Note that calling this when a cursor is attached to the leftmost element in
   * the `Span` will likely cause errors. The caller must ensure any cursors in
   * scope are properly updated.
   */
  splice() {
    if (!this.parent || this.isCursor()) {
      return new Block(null)
    }

    const block = new Block(null)
    ;(block.ends as EndsMut)[L] = this.at(L)
    ;(block.ends as EndsMut)[R] = this.at(R)
    if (block.ends[L]) {
      ;(block.ends[L] as CommandMut)[L] = null
    }
    if (block.ends[R]) {
      ;(block.ends[R] as CommandMut)[R] = null
    }
    this.each((el) => {
      ;(el as CommandMut).parent = block
      block.el.appendChild(el.el)
    })

    if (this[L]) {
      ;(this[L] as CommandMut)[R] = this[R]
    } else {
      ;(this.parent.ends as EndsMut)[L] = this[R]
    }
    if (this[R]) {
      ;(this[R] as CommandMut)[L] = this[L]
    } else {
      ;(this.parent.ends as EndsMut)[R] = this[L]
    }

    return block
  }

  /**
   * Removes the {@link Command `Command`}s contained by this `Span` from their
   * surrounding block. The `Span` will be a single point after the removal.
   *
   * Returns a {@link Cursor `Cursor`} at the location of the `Span`.
   */
  remove(): Cursor {
    if (this.parent && !this.isCursor()) {
      this.each((el) => el.el.remove())

      if (this[L]) {
        ;(this[L] as CommandMut)[R] = this[R]
      } else {
        ;(this.parent.ends as EndsMut)[L] = this[R]
      }
      if (this[R]) {
        ;(this[R] as CommandMut)[L] = this[L]
      } else {
        ;(this.parent.ends as EndsMut)[R] = this[L]
      }
    }

    return new Cursor(this.parent, this[R])
  }
}

/** A {@link Span `Span`} with focus and anchor nodes. */
export class Selection extends Span {
  constructor(
    /** The {@link Block `Block`} containing this `Selection`. */
    readonly parent: Block | null,
    lhs: Command | null,
    rhs: Command | null,
    /** Which side of this `Selection` is the focus node. */
    public focused: Dir,
  ) {
    super(parent, lhs, rhs)
  }

  /**
   * Moves the focus node of this `Selection` within its containing
   * {@link Block `Block`}.
   */
  moveFocusWithin(dir: Dir) {
    if (dir == R) {
      throw new Error("cannot move R")
    }

    if (this.isCursor()) {
      this.focused = dir
      if (this[dir]) {
        this[dir] = this[dir]![dir]
      }
      return
    }

    if (this.focused == dir) {
      this[dir] = this[dir]?.[dir] || null
    } else {
      this[this.focused] = this.at(this.focused)
    }
  }

  /** Moves the focus node in a given direction. */
  moveFocus(dir: Dir) {
    if (this.isCursor()) {
      this.focused = dir
    }
    this.move(this.focused, dir)
  }

  /**
   * Flips which {@link Command `Command`} is the focus and which `Command` is
   * the anchor.
   */
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
export abstract class Command<T extends Block[] = Block[]> extends Node {
  /** Returns the direction needed to travel from `anchor` to `focus`. */
  static dir(anchor: Command, focus: Command): Dir {
    if (!focus) {
      return R
    }

    let a: Command | null = anchor

    while (a) {
      if (anchor == focus) return R
      a = anchor[R]
    }

    return L
  }

  readonly [L]: Command | null = null
  readonly [R]: Command | null = null
  readonly parent: Block | null = null

  constructor(
    readonly ctrlSeq: string,
    readonly el: HTMLSpanElement,
    readonly blocks: T,
  ) {
    super()
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]! as BlockMut
      block.parent = this
      block[L] = blocks[i - 1] || null
      block[R] = blocks[i + 1] || null
    }
  }

  /** Moves the cursor into the given {@link Command `Command`}. */
  abstract moveInto(cursor: Cursor, towards: Dir): void

  /** Moves the cursor out of the passed {@link Block `Block`}. */
  abstract moveOutOf(cursor: Cursor, towards: Dir, block: Block): void

  /**
   * Whether this `Command` ends an implicit multiplication group. Used when the
   * user types `/` for a fraction or `\choose`.
   */
  endsImplicitGroup(): boolean {
    return false
  }

  /** Inserts the `Command` to some side of a {@link Cursor `Cursor`}. */
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
      ;(cursor.parent.ends as EndsMut)[L] = this
    }
    if (r) {
      ;(r as CommandMut)[L] = this
    } else {
      ;(cursor.parent.ends as EndsMut)[R] = this
    }
  }

  /**
   * Gets the {@link Block `Block`} that should be moved into when a vertical
   * arrow key is pressed and the cursor attempts to move into this `Command`.
   *
   * The returned {@link Block `Block`} must be owned by this `Command`.
   *
   * This is used in two circumstances:
   *
   * 1. The cursor is to one side of this `Command`, and attempts to move up or
   *    down.
   * 2. The cursor is, say, in the denominator of `(3/4)/5`, next to the `5`, and
   *    the user presses up.
   */
  vertInto(dir: VDir, clientX: number): Block | undefined {
    return
  }

  /**
   * Gets the {@link Block `Block`} that should be moved into when a vertical
   * arrow key is pressed and the cursor is inside a `Block` owned by this
   * `Command`.
   *
   * The returned {@link Block `Block`} must be owned by this `Command`.
   *
   * This is used, for instance, when the cursor is to the right of `3` in `⅜`
   * and the user presses "Down".
   */
  vertOutOf(dir: VDir, block: Block): Block | undefined {
    return
  }
}

type InitRet = Cursor | Selection | undefined | void

/**
 * Something which can be initialized to the left side of a cursor or (possibly)
 * on top of a selection.
 */
export type Init = {
  init(cursor: Cursor, input: string): InitRet
  initOn?(selection: Selection, input: string): InitRet
}
