import { tokensToAst, type Node } from "../eval/ast/token"
import type { CmdFrac } from "./cmd/math/frac"
import type { FieldInert } from "./field-inert"
import { h } from "./jsx"
import type { Options } from "./options"

const dummy = document.createElement("span")
document.body.appendChild(dummy)

export function getBoundingClientRect(el: Element) {
  return el.getBoundingClientRect()
}

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

/** Pointers to the {@linkcode Command}s on either side of a {@linkcode Block}. */
export interface Ends {
  /** The leftmost {@linkcode Command}. */
  readonly [L]: Command | null

  /** The rightmost {@linkcode Command}. */
  readonly [R]: Command | null
}

/** An interface used for type-safe changes to {@linkcode Ends}. */
interface EndsMut extends Ends {
  [L]: Command | null
  [R]: Command | null
}

/** An interface used for type-safe changes to {@linkcode Block}. */
interface BlockMut extends Block {
  parent: Command | null
  ends: EndsMut
}

/** An expression. Contains zero or more {@linkcode Command}s. */
export class Block {
  /** The ends of the {@linkcode Command}s contained in this block. */
  readonly ends: Ends = { [L]: null, [R]: null }

  readonly el = h(
    "inline-block after:content-['c'] after:font-['Times_New_Roman'] after:[line-height:.9] after:italic after:text-transparent after:hidden",
  )

  constructor(
    /** The command containing this block. */
    readonly parent: Command | null,
  ) {
    if (parent) {
      parent.blocks.push(this)
    }
    this.checkIfEmpty()
  }

  /** Clears this {@linkcode Block}. */
  clear() {
    new Span(this, null, null).remove()
  }

  /** Splices the contents of this {@linkcode Block} from it and returns them. */
  splice() {
    return new Span(this, null, null).splice()
  }

  /** Tokenizes this {@linkcode Block}'s contents as LaTeX. */
  ir(): Node[] {
    const tokens: Node[] = []
    let el = this.ends[L]
    while (el) {
      if (el.ir(tokens)) break
      el = el[R]
    }
    return tokens
  }

  /** Tokenizes this {@linkcode Block}'s contents into an AST. */
  ast(): Node {
    return tokensToAst(this.ir())
  }

  /** Creates a cursor focused at the given position in this {@linkcode Block}. */
  focus(x: number, y: number): Cursor {
    if (this.isEmpty()) {
      return new Cursor(this, null)
    }

    let el = this.ends[L]
    while (el) {
      if (x < el.bounds()[1]) {
        return el.focus(x, y)
      }
      el = el[R]
    }

    return this.ends[R]!.focus(x, y)
  }

  /**
   * Unwraps a transparent `Block`, or returns the current one if that's not
   * possible.
   *
   * A tangible example: if this `Block` only contains a single parenthesized
   * expression, it will return the expression inside. Otherwise, `this` is
   * returned.
   *
   * It is recommended that you call this when creating new `Command`s which
   * take content from an existing `Block`, as a user may use parentheses solely
   * for grouping (e.g. typing `(2+3)/5` when they really just want `2+3` over
   * `5`).
   *
   * More generally, this unwraps any `Command` with a single `Block` where the
   * `Command` returns `true` from its `isTransparentWrapper` method, and where
   * no child command returns `true` from its `invalidatesTransparentWrapper`
   * method.
   */
  unwrap() {
    const el = this.ends[L]
    if (
      el &&
      el == this.ends[R] &&
      el.blocks.length == 1 &&
      el.isTransparentWrapper()
    ) {
      const block = el.blocks[0]!
      if (
        !block.isEmpty() &&
        !block.some((cmd) => cmd.invalidatesTransparentWrapper(el, block))
      ) {
        return block
      }
    }

    return this
  }

  /** Returns whether this `Block` is empty. */
  isEmpty() {
    return this.ends[L] == null
  }

  /** Updates the element's empty styles. */
  checkIfEmpty() {
    this.el.classList.toggle("after:hidden", !this.isEmpty())
    this.el.classList.toggle("bg-nya-empty", this.isEmpty())
    this.el.classList.toggle("nya-empty", this.isEmpty())
    this.el.parentElement?.classList.toggle("nya-has-empty", this.isEmpty())
  }

  /**
   * Inserts a block between two {@linkcode Command}s. The `Command`s must be
   * adjacent children of this `Block`, or the edit tree will become malformed.
   */
  insert(block: Block, lhs: Command | null, rhs: Command | null) {
    // If the other block is empty, do nothing
    if (block.isEmpty()) {
      return
    }

    // Update our sibling and ends pointers
    if (lhs) {
      ;(lhs as CommandMut)[R] = block.ends[L]
    } else {
      ;(this.ends as EndsMut)[L] = block.ends[L]
    }
    if (rhs) {
      ;(rhs as CommandMut)[L] = block.ends[R]
    } else {
      ;(this.ends as EndsMut)[R] = block.ends[R]
    }

    // Insert children into the DOM
    {
      const before = rhs ? rhs.el : null
      let el: Command | null = block.ends[L]
      while (el) {
        this.el.insertBefore(el.el, before)
        ;(el as CommandMut).parent = this
        el = el[R]
      }
    }

    // Update `block`'s sibling pointers
    ;(block.ends[L] as CommandMut)[L] = lhs
    ;(block.ends[R] as CommandMut)[R] = rhs

    this.checkIfEmpty()
    block.checkIfEmpty()

    lhs?.onSiblingChange?.(R)
    block.ends[L]?.onSiblingChange?.(L)
    block.ends[R]?.onSiblingChange?.(R)
    rhs?.onSiblingChange?.(L)
  }

  /** Attaches a block onto a side of a {@linkcode Command} owned by this one. */
  attach(block: Block, command: Command | null, dir: Dir) {
    if (block.isEmpty()) {
      return
    }

    const lhs =
      dir == L ?
        command ? command[L]
        : this.ends[R]
      : command ? command
      : null

    const rhs =
      dir == R ?
        command ? command[R]
        : this.ends[L]
      : command ? command
      : null

    this.insert(block, lhs, rhs)
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

  /** Creates a {@linkcode Cursor} pointing to the given end of this `Block`. */
  cursor(end: Dir) {
    return new Cursor(this, end == R ? null : this.ends[L])
  }

  /** Finds the `clientX` values of the edges of this {@linkcode Block}. */
  bounds(): [left: number, right: number, top: number, bottom: number] {
    const box = getBoundingClientRect(this.el)
    return [box.left, box.left + box.width, box.top, box.top + box.height]
  }

  /**
   * If this {@linkcode Block} contains the given `clientX`, returns `0`.
   * Otherwise, returns the distance from the closest block bound to the
   * `clientX` value.
   */
  distanceTo(clientX: number): number {
    const [lhs, rhs] = this.bounds()

    if (clientX < lhs) {
      return lhs - clientX
    } else if (rhs < clientX) {
      return clientX - rhs
    } else {
      return 0
    }
  }

  /** Returns whether this {@linkcode Block} contains the given point. */
  contains(x: number, y: number): boolean {
    const [lhs, rhs, ts, bs] = this.bounds()
    return lhs <= x && x <= rhs && ts <= y && y <= bs
  }

  /**
   * If this {@linkcode Block} contains the given `y`, returns `0`. Otherwise,
   * returns the distance from the closest block bound to the `y` value.
   */
  distanceToY(y: number): number {
    const [, , top, bottom] = this.bounds()

    if (y < top) {
      return top - y
    } else if (bottom < y) {
      return y - bottom
    } else {
      return 0
    }
  }

  /** Finds the {@linkcode Command} closest to the given `clientX`. */
  commandAt(clientX: number): Command | null {
    // We use binary search b/c it seems fun
    // This is still technically O(n) in the number of child nodes
    let el = this.ends[L]
    if (!el) return null
    if (clientX < getBoundingClientRect(el.el).left) {
      return null
    }
    while (el) {
      const box = getBoundingClientRect(el.el)
      const rhs = box.left + box.width
      if (clientX < rhs) {
        return el
      }
      el = el[R]
    }
    return null
  }

  toString() {
    return this.latex()
  }

  some(fn: (command: Command) => unknown): boolean {
    let el = this.ends[L]
    while (el) {
      if (fn(el)) {
        return true
      }
      el = el[R]
    }
    return false
  }
}

/** An interface used for type-safe changes to {@linkcode Cursor}s. */
interface CursorMut extends Cursor {
  [R]: Command | null
  parent: Block | null
}

function pickSide(el: Element, clientX: number): Dir {
  const box = getBoundingClientRect(el)
  if (clientX < box.x + box.width / 2) {
    return L
  } else {
    return R
  }
}

/** A `Cursor` provides a reference point for insertions and deletions. */
export class Cursor {
  /**
   * Returns the direction needed to get from `a` to `b`, or `0` if they are the
   * same `Cursor`, or `null` if they do not share a common parent
   * {@linkcode Block}.
   */
  static dir(a: Cursor, b: Cursor): Dir | 0 | null {
    if (a.parent != b.parent) {
      return null
    }

    if (a[R] == b[R]) {
      return 0
    }

    let el = a[R]
    while (el) {
      el = el[R]
      if (el == b[R]) {
        return R
      }
    }
    return L
  }

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

  /** Inserts a {@linkcode Block} on the given side of this `Cursor`. */
  insert(block: Block, dir: Dir) {
    if (!this.parent) return
    if (block.isEmpty()) return

    this.parent.insert(block, this[L], this[R])
    if (dir == R) {
      ;(this as CursorMut)[R] = block.ends[L]
    }
  }

  /** Moves this cursor to another cursor's position. */
  setTo(other: Cursor) {
    ;(this as CursorMut).parent = other.parent
    ;(this as CursorMut)[R] = other[R]
  }

  /**
   * Moves this cursor in the given direction, returning whether any movement
   * happened.
   */
  move(dir: Dir): boolean {
    if (this[dir]) {
      this[dir].moveInto(this, dir)
      return true
    } else if (this.parent?.parent) {
      this.parent.parent.moveOutOf(this, dir, this.parent)
      return true
    }
    return false
  }

  /**
   * Gets a list of ancestors of this `Cursor`, starting with
   * `this.parent?.parent?.parent`.
   */
  parents(): [block: Block, child: Command | Cursor][] {
    const ret: [block: Block, child: Command | Cursor][] = []
    let el: Command | Cursor | null | undefined = this
    while (el && el.parent) {
      ret.push([el.parent, el])
      el = el.parent?.parent
    }
    return ret
  }

  /**
   * Moves this cursor in the given direction by a contextual "word", returning
   * whether any moving happened.
   */
  moveByWord(dir: Dir): boolean {
    if (this[dir]) {
      this[dir].moveAcrossWord(this, dir)
      return true
    } else if (this.parent?.parent) {
      this.moveTo(this.parent.parent, dir)
      return true
    }

    return false
  }

  /**
   * Moves this `Cursor` in the given vertical direction. Returns `true` if the
   * cursor moved.
   */
  moveVert(dir: VDir): boolean {
    // Get the cursor's X position; we want to be as close to it as possible
    const x = this.x()

    // The cursor doesn't have an X position iff it is not in the DOM, and thus
    // we may safely ignore the movement operation.
    if (x == null) return false

    // If a sub- or superscript is available on the RHS, take it
    {
      const into = this[R]?.vertFromSide(dir, L)
      if (into) {
        this.moveIn(into, L)
        return true
      }
    }

    // Else, if a sub- or superscript is available on the LHS, take it
    {
      const into = this[L]?.vertFromSide(dir, R)
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

      const ret = block.parent.vertOutOf(dir, block, this)
      if (ret === true) {
        return true
      } else if (ret) {
        node = ret
        break
      }

      block = block.parent.parent
    }

    if (!node) {
      return false
    }

    // Move into that node
    while (true) {
      const cmd: Command | null = node.commandAt(x)

      // If the block is empty or the cursor is too far to one side
      if (!cmd) {
        const side = pickSide(node.el, x)
        this.moveIn(node, side)
        return true
      }

      // Get the sub-block in it (e.g. one side of a fraction)
      const subBlock: Block | undefined = cmd.vertInto(dir == U ? D : U, x)
      if (subBlock) {
        // If there is a sub-block, start the process from it
        node = subBlock
        continue
      }

      // If there is no block, move to the appropriate side of the block
      const side = pickSide(cmd.el, x)
      this.moveTo(cmd, side)
      return true
    }
  }

  /**
   * Gets the X-coordinate of this `Cursor` onscreen. Returns `null` if the
   * `Cursor` is not attached to any element.
   */
  x() {
    if (this[R]) {
      return getBoundingClientRect(this[R].el).left
    } else if (this.parent) {
      return getBoundingClientRect(this.parent.el).right
    } else {
      return null
    }
  }

  /** Moves this cursor to some side of a {@linkcode Command}. */
  moveTo(el: Command, side: Dir) {
    ;(this as CursorMut).parent = el.parent
    ;(this as CursorMut)[R] = side == L ? el : el[R]
    return this
  }

  /** Moves this cursor to some side of a {@linkcode Block}. */
  moveIn(el: Block, side: Dir) {
    ;(this as CursorMut).parent = el
    ;(this as CursorMut)[R] = (side == L && el.ends[L]) || null
    return this
  }

  /** Prints a debug representation of this cursor. */
  debug() {
    return (
      (this[L]?.[L]?.latex() ?? "") +
      (this[L]?.latex() ?? "") +
      " <|> " +
      (this[R]?.latex() ?? "") +
      (this[R]?.[R]?.latex() ?? "")
    )
  }

  /** Creates a copy of this cursor in the same place. */
  clone() {
    return new Cursor(this.parent, this[R])
  }

  /** Creates a {@linkcode Span} where this cursor is. */
  span() {
    return new Span(this.parent, this[L], this[R])
  }

  /** Creates a {@linkcode Selection} where this cursor is. */
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

  /**
   * Deletes in the given direction from this cursor's position, returning
   * whether any deletion happened.
   */
  delete(dir: Dir): boolean {
    if (this[dir]) {
      this[dir].delete(this, dir == R ? L : R)
      return true
    }

    if (!this.parent?.parent) {
      return false
    }

    this.parent.parent.deleteBlock(this, dir, this.parent)
    return true
  }
}

/**
 * A range within a {@linkcode Block}.
 *
 * A `Span`'s two sides must be properly ordered, with `this[L]` strictly before
 * `this[R]`, with both contained within `this.parent`.
 */
export class Span {
  /**
   * The {@linkcode Command} to the left of this `Span`. Not included in the
   * `Span` itself.
   *
   * In regular nodes, `[L]` is readonly. However, a `Span` is merely a view
   * over the tree, and has no invariants it maintains over other nodes. As
   * such, its sides are mutable.
   */
  [L]: Command | null;

  /**
   * The {@linkcode Command} to the right of this `Span`. Not included in the
   * `Span` itself.
   *
   * In regular nodes, `[R]` is readonly. However, a `Span` is merely a view
   * over the tree, and has no invariants it maintains over other nodes. As
   * such, its sides are mutable.
   */
  [R]: Command | null

  constructor(
    /** The {@linkcode Block} containing this `Span`. */
    public parent: Block | null,
    lhs: Command | null,
    rhs: Command | null,
  ) {
    this[L] = lhs
    this[R] = rhs
  }

  /** Tokenizes this {@linkcode Span}'s contents into AST tokens. */
  ir(): Node[] {
    const tokens: Node[] = []
    let el = this.at(L)
    while (el && el != this[R]) {
      if (el.ir(tokens)) break
      el = el[R]
    }
    return tokens
  }

  /** Parses this {@linkcode Span}'s contents as a full AST. */
  ast(): Node {
    return tokensToAst(this.ir())
  }

  /** Returns `true` if this `Span` is a single point. */
  isCursor() {
    return this.at(L) == this[R]
  }

  /**
   * Gets the {@linkcode Command} at one side of this `Span`. The returned
   * `Command` will be inside the `Span`, unless the `Span` is a
   */
  at(side: Dir): Command | null {
    return this[side] ?
        this[side]![side == R ? L : R]
      : this.parent?.ends[side] || null
  }

  /**
   * Calls a function for each element in the `Span`, travelling from
   * left-to-right.
   */
  each(fn: (el: Command) => void) {
    let el = this.at(L)

    while (el && el != this[R]) {
      fn(el)
      el = el[R]
    }
  }

  /** Collects all elements in the `Span`, travelling from left-to-right. */
  contents(): Command[] {
    const ret: Command[] = []
    this.each((el) => ret.push(el))
    return ret
  }

  /** Creates a {@linkcode Cursor} at one side of this `Span`. */
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
    }

    if (this[side]) {
      this[side] = this[side]![towards]
    } else {
      // If we get here, side != towards
      this[side] = this.parent.ends[side]
    }
  }

  /**
   * Moves one side of this `Span` in a direction across a contextual "word".
   * Returns `true` if the nodes' directions switched unexpectedly, where
   * "unexpectedly" means "in a way that needs to be detected by
   * {@linkcode Selection.moveFocusByWord}".
   */
  moveByWord(side: Dir, towards: Dir): boolean {
    // If there is no parent, we cannot move anyway
    if (!this.parent) return false

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
      if (!command) return false

      this.parent = command.parent
      this[L] = command[L]
      this[R] = command[R]
      return false
    }

    const cursor = this.cursor(side)
    cursor.moveByWord(towards)
    this[side] = cursor[side]
    if (Cursor.dir(this.cursor(L), this.cursor(R)) == L) {
      const l = this[L]
      const r = this[R]
      this[L] = r ? r[L] : this.parent.ends[R]
      this[R] = l ? l[R] : this.parent.ends[L]
      return true
    }

    return false
  }

  /** Extends this `Span` to one end. */
  extendToEnd(dir: Dir) {
    this[dir] = null
    return this
  }

  /**
   * Removes the {@linkcode Command}s contained by this `Span` from their
   * surrounding block and moves them into a new {@linkcode Block}. The `Span`
   * will be a single point after the removal.
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

    this.parent.checkIfEmpty()
    block.checkIfEmpty()

    block.ends[L]?.onSiblingChange?.(L)
    this[L]?.onSiblingChange?.(R)
    block.ends[R]?.onSiblingChange?.(R)
    this[R]?.onSiblingChange?.(L)

    return block
  }

  /**
   * Removes the {@linkcode Command}s contained by this `Span` from their
   * surrounding block. The `Span` will be a single point after the removal.
   *
   * Returns a {@linkcode Cursor} at the location of the `Span`.
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

      this.parent.checkIfEmpty()
    }

    return new Cursor(this.parent, this[R])
  }
}

/** A {@linkcode Span} with focus and anchor nodes. */
export class Selection extends Span {
  static of(anchor: Cursor, focus: Cursor): Selection {
    if (!(anchor.parent && focus.parent)) {
      throw new Error("'Selection.of' must be passed in-tree cursors.")
    }

    const ag = anchor.parents().reverse()
    const fg = focus.parents().reverse()

    const lastSharedParentIndex = Array.from(
      { length: Math.min(ag.length, fg.length) },
      (_, i) => {
        const anchor = ag[i]!
        const focus = fg[i]!
        return anchor[0] == focus[0]
      },
    ).lastIndexOf(true)

    if (lastSharedParentIndex == -1) {
      throw new Error("The two cursors do not share an ancestor.")
    }

    const [parent, a] = ag[lastSharedParentIndex]!
    const [, f] = fg[lastSharedParentIndex]!

    let ac: Cursor, fc: Cursor

    if (a instanceof Cursor) {
      if (f instanceof Cursor) {
        ac = a
        fc = f
      } else {
        const toA = f.dirTo(a)!
        ac = a
        if (toA == L) {
          fc = f.cursor(R)
        } else {
          fc = f.cursor(L)
        }
      }
    } else {
      if (f instanceof Cursor) {
        const toA = a.dirTo(f)!
        fc = f
        if (toA == L) {
          ac = a.cursor(R)
        } else {
          ac = a.cursor(L)
        }
      } else {
        if (Command.dir(a, f) == L) {
          ac = a.cursor(R)
          fc = f.cursor(L)
        } else {
          ac = a.cursor(L)
          fc = f.cursor(R)
        }
      }
    }

    let dir: Dir = R
    if (Cursor.dir(ac, fc) != R) {
      ;[ac, fc] = [fc, ac]
      dir = L
    }

    return new Selection(parent, ac[L], fc[R], dir, anchor)
  }

  get anchor() {
    return this.cursor(this.focused == L ? R : L)
  }

  get focus() {
    return this.cursor(this.focused)
  }

  constructor(
    parent: Block | null,
    lhs: Command | null,
    rhs: Command | null,
    /** Which side of this `Selection` is the focus node. */
    public focused: Dir,
    /** The true anchor of the `Selection`, which may be in an inner block. */
    public cachedAnchor = new Cursor(
      parent,
      focused == L ? lhs?.[R] || null : rhs,
    ),
  ) {
    super(parent, lhs, rhs)
  }

  /** Creates a clone of `this`. */
  clone() {
    return new Selection(
      this.parent,
      this[L],
      this[R],
      this.focused,
      this.cachedAnchor,
    )
  }

  /**
   * Moves the focus node of this `Selection` within its containing
   * {@linkcode Block}.
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
    if (!this.parent) return

    // Special case for moving if the cached anchor is inside the selection
    inner: if (!this.isCursor() && this.focused != dir) {
      const parents = this.cachedAnchor.parents()
      const contents = this.contents()
      let inner
      parent: {
        for (const parent of parents) {
          if (contents.indexOf(parent[0].parent!) != -1) {
            inner = parent
            break parent
          }
        }
        break inner
      }

      const next = Selection.of(
        this.cachedAnchor,
        inner[0].cursor(this.focused),
      )
      this.parent = next.parent
      this[L] = next[L]
      this[R] = next[R]
      this.focused = next.focused
      this.cachedAnchor = next.cachedAnchor
      return
    }

    if (this.isCursor()) {
      this.focused = dir
    }

    this.move(this.focused, dir)
  }

  /** Moves the focus node in a given direction by a contextual "word". */
  moveFocusByWord(dir: Dir) {
    if (this.isCursor()) {
      this.focused = dir
    }
    if (this.moveByWord(this.focused, dir)) {
      this.focused = this.focused == R ? L : R
    }
  }

  /** Moves the focus node to one end of the containing {@linkcode Block}. */
  moveFocusToEnd(dir: Dir) {
    if (!this.parent) return

    if (this.focused == dir) {
      this[this.focused] = null
    } else {
      const inv = dir == L ? R : L
      this[inv] = this[dir] ? this[dir][inv] : this.parent.ends[dir]
      this[dir] = null
      this.focused = dir
    }
  }

  /**
   * Moves the focus node in a given direction quickly. Typically used when the
   * user hits the up or down arrow keys.
   */
  moveFocusFast(dir: Dir) {
    if (!this.parent) return

    /**
     * Case analysis (assuming dir == R)
     *
     * - Cursor at R edge................select containing command
     * - Cursor not at R edge............extend to R edge
     * - Focused==L; this.at(L)==null....not possible; would be cursor
     * - Focused==L; this.at(L)!=null....\
     *   This[L]=this[this.focused] and this[R]=null and this.focused=R
     * - Focused==R; this[R]!=null.......extend to R edge
     * - Focused==R; this[R]==null.......select containing command
     */

    if (this.isCursor()) {
      this.focused = dir
      if (this[dir]) {
        this[dir] = null
        return
      } else {
        // Fallthrough to select containing command
      }
    } else if (this.focused == dir) {
      if (this[dir]) {
        this[dir] = null
        return
      } else {
        // Fallthrough to select containing command
      }
    } else {
      const inv = this.focused
      this[inv] = this[this.focused]
      this[dir] = null
      this.focused = dir
      return
    }

    if (this.parent.parent) {
      this.select(this.parent.parent, dir)
    } else {
      this[L] = null
      this[R] = null
    }
  }

  /** Selects the given {@linkcode Command}. */
  select(command: Command, dir: Dir) {
    this.parent = command.parent
    this[L] = command[L]
    this[R] = command[R]
    this.focused = dir
  }

  /**
   * Flips which {@linkcode Command} is the focus and which `Command` is the
   * anchor.
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

/**
 * A single item inside a {@linkcode Block}.
 *
 * Commands are required to implement many methods. Methods marked with `?` are
 * optional. Methods marked with `!` have default implementations.
 *
 * The abstract methods used for initialization are:
 *
 * - `static init?` to insert left of the cursor
 * - `static initOn?` to insert on top of a selection
 *
 * The abstract methods used for output are:
 *
 * - `latex` to output LaTeX math
 * - `ascii` to output ASCII math
 * - `reader` to output screen-readable math
 *
 * The abstract methods used for movement are:
 *
 * - `moveAcrossWord!` for moving left or right across a contextual "word"
 * - `moveInto` for moving left or right into `this`
 * - `moveOutOf` for moving left or right out of a nested block
 * - `tabInto!` for moving left or right into the first nested block
 * - `tabOutOf!` for moving left or right into the next nested block
 * - `vertFromSide` for moving up or down next to `this`
 * - `vertInto` for moving up or down into `this`
 * - `vertOutOf` for moving up or down out of a nested block
 * - `subSup?` for custom behavior when a subscript or superscript is inserted
 *
 * Note that the `move` methods are allowed to skip over certain nested blocks.
 * For example, the `move` methods for {@linkcode CmdFrac} only move through the
 * numerator by default. The `tab` methods, on the other hand, must move into
 * and out of every nested block. Other than the difference of scope, the `tab`
 * and `move` methods are practically identical.
 *
 * The abstract methods used for multi-line and multi-column support are:
 *
 * - `insCol?` for inserting a column (say, in a matrix)
 * - `insRow?` for inserting a row (say, in a matrix)
 * - `splitCol?` for splitting a column (say, in a \begin{align*} implementation)
 *
 * The abstract methods used for deletion are:
 *
 * - `delete` for pressing delete outside of `this`
 * - `deleteBlock!` for pressing delete at the edge of a nested block
 */
export abstract class Command<
  T extends Block[] = Block[],
  C extends string = string,
> {
  /**
   * Initializes this {@linkcode Command} to the left side of the provided
   * {@linkcode Cursor}.
   */
  static init?(cursor: Cursor, props: InitProps): InitRet

  /** Initializes this {@linkcode Command} over a given {@linkcode Selection}. */
  static initOn?(selection: Selection, props: InitProps): InitRet

  /** Returns the direction needed to travel from `anchor` to `focus`. */
  static dir(anchor: Command, focus: Command): Dir {
    if (!focus) {
      return R
    }

    let a: Command | null = anchor

    while (a) {
      if (a == focus) return R
      a = a[R]
    }

    return L
  }

  /** The sibling towards the left. */
  readonly [L]: Command | null = null

  /** The sibling towards the right. */
  readonly [R]: Command | null = null

  /** The parent of this node. */
  readonly parent: Block | null = null

  constructor(
    readonly ctrlSeq: C,
    /** The HTML element rendered by this node. */
    readonly el: HTMLSpanElement,
    readonly blocks: T,
  ) {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]! as BlockMut
      block.parent = this
    }
  }

  /**
   * Returns the number of pixels a given quantity of `em` represent at this
   * element's font size.
   */
  em(em: number) {
    const size = getComputedStyle(this.el).fontSize
    if (size.slice(-2) == "px") {
      return parseFloat(size.slice(0, -2)) * em
    } else {
      return 16 * em
    }
  }

  /**
   * Returns the direction needed to get from `this` to `cursor`, or `null` if
   * they do not share a common parent {@linkcode Block}.
   */
  dirTo(cursor: Cursor): Dir | null {
    const dir = Cursor.dir(this.cursor(L), cursor)
    if (dir == null) return null
    if (dir == 0) return L
    return dir
  }

  /** Called after the edit tree is stabilized if `this[dir]` changed. */
  onSiblingChange?(dir: Dir): void

  /** Reads this node in a screen-accessible format. */
  abstract reader(): string

  /** Writes this node in ASCII-style math. */
  abstract ascii(): string

  /** Writes this node in LaTeX. */
  abstract latex(): string

  /**
   * Moves the cursor across a "word". What this means can differ contextually,
   * but it should at a minimum not change the `.parent` property of the
   * `cursor` passed to it.
   *
   * This defaults to moving to the other end of this {@linkcode Command}.
   */
  moveAcrossWord(cursor: Cursor, dir: Dir): void {
    cursor.moveTo(this, dir)
  }

  /** Moves the cursor into the given {@linkcode Command}. */
  abstract moveInto(cursor: Cursor, towards: Dir): void

  /** Moves the cursor out of the passed {@linkcode Block}. */
  abstract moveOutOf(cursor: Cursor, towards: Dir, block: Block): void

  /**
   * Moves the cursor into the first {@linkcode Block} owned by this `Command`,
   * or to the other side.
   *
   * The default implementation moves to the first {@linkcode Block} in the
   * stored `.blocks` array, or moves to the other end if there is no `Block`
   * found.
   */
  tabInto(cursor: Cursor, towards: Dir): void {
    const block = this.blocks[towards == L ? this.blocks.length - 1 : 0]
    if (block) {
      cursor.moveIn(block, towards == L ? R : L)
    } else {
      cursor.moveTo(this, towards)
    }
  }

  /** Makes a {@linkcode Cursor} on the given side of this {@linkcode Command}. */
  cursor(side: Dir): Cursor {
    return new Cursor(this.parent, side == L ? this : this[R])
  }

  /**
   * Moves the cursor out of the passed {@linkcode Block}. This method must, upon
   * being called after an initial {@linkcode Command.tabInto}, reach every
   * {@linkcode Block} contained by this `Command`. This is different than
   * `tabOutOf`, which may not necessarily traverse every {@linkcode Block}.
   *
   * For instance, the `tabInto` and `tabOutOf` methods on {@linkcode CmdFrac}
   * traverse both parts, but `moveInto` only traverses the numerator normally.
   *
   * The default implementation moves to the next {@linkcode Block} in the stored
   * `.blocks` array, or moves to the other end if there is no `Block`s are
   * left.
   */
  tabOutOf(cursor: Cursor, towards: Dir, block: Block): void {
    const index = this.blocks.indexOf(block)
    if (index == 0 && towards == L) {
      cursor.moveTo(this, L)
    } else if (towards == R && index == this.blocks.length - 1) {
      cursor.moveTo(this, R)
    } else {
      cursor.moveIn(this.blocks[index + towards]!, towards == L ? R : L)
    }
  }

  /**
   * Gets the {@linkcode Block} that should be moved into when a vertical arrow
   * key is pressed and the cursor is on one side of this `Command`.
   *
   * The returned {@linkcode Block} must be owned by this `Command`.
   */
  abstract vertFromSide(dir: VDir, from: Dir): Block | undefined

  /**
   * Gets the {@linkcode Block} that should be moved into when a vertical arrow
   * key is pressed from above or below this `Command` and the cursor attempts
   * to move into it.
   *
   * The returned {@linkcode Block} must be owned by this `Command`.
   */
  abstract vertInto(dir: VDir, clientX: number): Block | undefined

  /**
   * Moves out of a {@linkcode Block} owned by this `Command`.
   *
   * If a {@linkcode Block} is returned, it must be owned by this `Command`, and
   * the {@linkcode Cursor} will be placed into it. If `true` is returned,
   * `cursor` must be updated to a new position.
   *
   * This is used, for instance, when the cursor is to the right of `3` in `⅜`
   * and the user presses "Down".
   */
  abstract vertOutOf(
    dir: VDir,
    block: Block,
    cursor: Cursor,
  ): Block | true | undefined

  /**
   * Deletes this `Command` from the given direction. Called when the cursor is
   * to one side of this `Command` and the user pressed "Backspace" or
   * "Delete".
   */
  abstract delete(cursor: Cursor, from: Dir): void

  /** Creates a {@linkcode Cursor} focused at the given location. */
  abstract focus(x: number, y: number): Cursor

  /**
   * Deletes the provided {@linkcode Block} from the given direction in this
   * `Command`. Called when the cursor is at the edge of a {@linkcode Block} and
   * the user presses "Backspace" or "Delete".
   *
   * The default implementation replaces this {@linkcode Command} with its inner
   * {@linkcode Block}s and maintains the cursor's location.
   */
  deleteBlock(cursor: Cursor, at: Dir, block: Block) {
    const index = this.blocks.indexOf(block)
    cursor.moveTo(this, R)
    this.remove()
    for (let i = 0; i < index; i++) {
      cursor.insert(this.blocks[i]!, L)
    }
    for (let i = this.blocks.length - 1; i > index; i--) {
      cursor.insert(this.blocks[i]!, R)
    }
    cursor.insert(block, at == L ? R : L)
    this[L]?.onSiblingChange?.(R)
    this[R]?.onSiblingChange?.(L)
    for (const block of this.blocks) {
      block.ends[L]?.onSiblingChange?.(L)
      block.ends[R]?.onSiblingChange?.(R)
    }
  }

  /**
   * Called if a {@linkcode CmdSupSub} is initialized to the right of another
   * {@linkcode Command}. If this returns `true`, a subscript or superscript will
   * not be created.
   *
   * This is used on the {@linkcode CmdBig} and {@linkcode CmdInt} commands, for
   * example, to move into their appropriate subscripts and superscripts.
   */
  supSub(_part: VDir, _side: Dir, _cursor: Cursor): boolean {
    return false
  }

  protected setEl(el: HTMLSpanElement) {
    this.el.replaceWith(el)
    ;(this as any).el = el
  }

  /** May invalidate {@linkcode Cursor}s. */
  replaceWith(block: Block) {
    this.remove()
    this.parent?.insert(block, this[L], this[R])
  }

  /** Creates a {@linkcode Block} containing only this {@linkcode Command}. */
  lone(): Block {
    if (this.parent) {
      this.remove()
    }
    const block = new Block(null)
    this.insertAt(block.cursor(R), L)
    return block
  }

  /**
   * Whether this command is a simple transparent wrapper around its contents
   * which may safely be omitted (assuming proper order of operations is
   * maintained). The only built-in `Command` for which this returns `true` is a
   * `CmdBrack` where both ends are parentheses.
   *
   * Note that this `Command` must have exactly one child block for unwrapping
   * to work.
   *
   * This is used in the {@linkcode Block.unwrap} method.
   */
  isTransparentWrapper(): boolean {
    return false
  }

  /**
   * Whether this command stops a containing transparent wrapper from being
   * transparent.
   *
   * The only built-in `Command` for which this returns `true` is a `CmdComma`,
   * as it converts containing transparent parentheses into a point
   * declaration.
   *
   * This is used in the {@linkcode Block.unwrap} method.
   */
  invalidatesTransparentWrapper(
    _wrapper: Command,
    _wrapperBlock: Block,
  ): boolean {
    return false
  }

  /**
   * Whether this `Command` ends an implicit multiplication group. Used when the
   * user types `/` for a fraction or `\choose`.
   */
  endsImplicitGroup(): boolean {
    return false
  }

  /**
   * Inserts the given {@linkcode Block} to some side of this `Command`. Does
   * nothing if this `Command` has no parent.
   */
  insert(block: Block, dir: Dir) {
    if (!this.parent) return

    if (dir == L) {
      this.parent.insert(block, this[L], this)
    } else {
      this.parent.insert(block, this, this[R])
    }
  }

  /**
   * Inserts the `Command` to some side of a {@linkcode Cursor}. Assumes the
   * {@linkcode Command} does not already have a parent block.
   */
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

    cursor.parent.checkIfEmpty()
    this[L]?.onSiblingChange?.(R)
    this[R]?.onSiblingChange?.(L)
    this?.onSiblingChange?.(L)
    this?.onSiblingChange?.(R)
  }

  /**
   * Removes this `Command` from its containing {@linkcode Block}. Invalidates
   * {@linkcode Cursor}s using this `Command` as an anchor.
   */
  remove() {
    this.el.remove()
    if (this[L]) {
      ;(this[L] as CommandMut)[R] = this[R]
    } else if (this.parent) {
      ;(this.parent.ends as EndsMut)[L] = this[R]
    }
    if (this[R]) {
      ;(this[R] as CommandMut)[L] = this[L]
    } else if (this.parent) {
      ;(this.parent.ends as EndsMut)[R] = this[L]
    }

    this.parent?.checkIfEmpty()
    this[L]?.onSiblingChange?.(R)
    this[R]?.onSiblingChange?.(L)
  }

  toString() {
    return this.latex()
  }

  /** Finds the `clientX` values of the edges of this {@linkcode Command}. */
  bounds(): [left: number, right: number] {
    const box = getBoundingClientRect(this.el)
    return [box.left, box.left + box.width]
  }

  /**
   * If the given `clientX` is outside this `Command`, returns `0`. Otherwise,
   * returns distance in pixels to the closest edge.
   */
  distanceToEdge(clientX: number): number {
    const [lhs, rhs] = this.bounds()

    if (clientX < lhs || rhs < clientX) {
      return 0
    } else {
      return Math.min(clientX - lhs, rhs - clientX)
    }
  }

  /** Returns whether the given `clientX` is outside this `Command`. */
  outside(clientX: number): boolean {
    const [lhs, rhs] = this.bounds()

    return clientX < lhs || rhs < clientX
  }

  /** Inserts a column to some side of a nested {@linkcode Block}. */
  insCol?(cursor: Cursor, block: Block, dir: Dir): void

  /** Splits a nested {@linkcode Block} in two. */
  splitCol?(cursor: Cursor, block: Block): void

  /**
   * Inserts a row to some side of a nested {@linkcode Block}.
   *
   * If `dir` is `null`, the {@linkcode Command} must decide the proper
   * direction.
   */
  insRow?(cursor: Cursor, block: Block, dir: VDir | null): void

  /** Tokenizes this {@linkcode Command}'s contents as LaTeX. */
  abstract ir(tokens: Node[]): true | void

  /**
   * Called when a comma is typed. Return `true` if action was taken to prevent
   * a comma from being inserted; otherwise, a comma is typed like normal.
   *
   * If the method is not implemented, a comma is typed as normal.
   */
  insComma?(cursor: Cursor, block: Block): true | undefined
}

export interface Command {
  // Declared in an interface so it can be a getter or a property
  /** If present, allows this node to be replaced with `options.autoCmds`. */
  readonly autoCmd?: string
}

/** The updated cursor or selection created by {@linkcode Init}. */
export type InitRet = Cursor | Selection | "browser" | undefined | void

/** Proprties passed to an `.init()` call. */
export interface InitProps<E = KeyboardEvent | undefined> {
  input: string
  options: Options
  event: E
  field: FieldInert
}

/**
 * Something which can be initialized to the left side of a cursor or (possibly)
 * on top of a selection.
 */
export interface Init<E = KeyboardEvent | undefined> {
  init(cursor: Cursor, input: InitProps<E>): InitRet
  initOn?(selection: Selection, input: InitProps<E>): InitRet
}

/**
 * Calls `.initOn()` or `.init()` on a given {@linkcode Init}, passing the passed
 * {@linkcode Selection} as a {@linkcode Selection} or {@linkcode Cursor} as
 * appropriate. Returns a new, possibly modified selection.
 */
export function performInit<E>(
  init: Init<E>,
  selection: Selection,
  props: InitProps<E>,
): Selection | "browser" {
  let ret: Cursor | Selection | "browser"

  if (selection.isCursor()) {
    const cursor = selection.cursor(R)
    ret = init.init(cursor, props) || cursor
  } else if (init.initOn) {
    ret = init.initOn(selection, props) || selection
  } else {
    const cursor = selection.remove()
    ret = init.init(cursor, props) || cursor
  }

  if (ret instanceof Cursor) {
    return ret.selection()
  } else {
    return ret
  }
}
