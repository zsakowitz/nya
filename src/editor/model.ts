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
export class Block {
  /** The block before this one. */
  // readonly [L]: Block | null

  /** The block after this one. */
  // readonly [R]: Block | null = null

  /** The ends of the {@link Command `Command`}s contained in this block. */
  readonly ends: Ends = { [L]: null, [R]: null }

  readonly el = h(
    "inline-block after:content-['c'] after:font-['Times'] after:[line-height:.9] after:italic after:text-transparent after:hidden",
  )

  constructor(
    /** The command containing this block. */
    readonly parent: Command | null,
  ) {
    if (parent) {
      parent.blocks.push(this)
    } else {
    }
    this.checkIfEmpty()
  }

  /**
   * Unwraps a single layer of parentheses, if they are the only thing this
   * `Block` contains. This is useful, as a user will often use them to group
   * additions or subtractions, and doesn't actually want them to stick around.
   *
   * More generally, this unwraps any `Command` with a single `Block` where the
   * `Command` returns `true` from its `isTransparentWrapper` method.
   */
  unwrap() {
    if (
      this.ends[L] == this.ends[R] &&
      this.ends[L]?.blocks.length == 1 &&
      this.ends[L].isTransparentWrapper()
    ) {
      return this.ends[L].blocks[0]!
    } else {
      return this
    }
  }

  /** Returns whether this `Block` is empty. */
  isEmpty() {
    return this.ends[L] == null
  }

  /** Updates the element's empty styles. */
  checkIfEmpty() {
    this.el.classList.toggle("after:hidden", !this.isEmpty())
    this.el.classList.toggle("bg-[#fff3]", this.isEmpty())
  }

  /**
   * Inserts a block between two {@link Command `Command`}s. The `Command`s must
   * be adjacent children of this `Block`, or the edit tree will become
   * malformed.
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
  }

  /**
   * Attaches a block onto a side of a {@link Command `Command`} owned by this
   * one.
   */
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

  /** Creates a {@link Cursor `Cursor`} pointing to the given end of this `Block`. */
  cursor(end: Dir) {
    return new Cursor(this, end == R ? null : this.ends[L])
  }

  /** Finds the {@link Command `Command`} closest to the given `clientX`. */
  commandAt(clientX: number): Command | null {
    // We use binary search b/c it seems fun
    // This is still technically O(n) in the number of child nodes
    let el = this.ends[L]
    if (!el) return null
    if (clientX < el.el.getBoundingClientRect().left) {
      return null
    }
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

  toString() {
    return this.latex()
  }
}

/** An interface used for type-safe changes to {@link Cursor `Cursor`}s. */
interface CursorMut extends Cursor {
  [R]: Command | null
  parent: Block | null
}

function pickSide(
  el: { getBoundingClientRect(): DOMRect },
  clientX: number,
): Dir {
  const box = el.getBoundingClientRect()
  if (clientX < box.x + box.width / 2) {
    return L
  } else {
    return R
  }
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

  /** Inserts a {@link Block `Block`} on the given side of this `Cursor`. */
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
      const into = this[R]?.vertFromSide(dir, x)
      if (into) {
        this.moveIn(into, L)
        return true
      }
    }

    // Else, if a sub- or superscript is available on the LHS, take it
    {
      const into = this[L]?.vertFromSide(dir, x)
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
      if (ret == true) {
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

  /** Deletes in the given direction from this cursor's position. */
  delete(dir: Dir) {
    if (this[dir]) {
      this[dir].delete(this, dir == R ? L : R)
      return
    }

    if (!this.parent?.parent) return

    this.parent.parent.deleteBlock(this, dir, this.parent)
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

    this.parent.checkIfEmpty()
    block.checkIfEmpty()

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

      this.parent.checkIfEmpty()
    }

    return new Cursor(this.parent, this[R])
  }
}

/** A {@link Span `Span`} with focus and anchor nodes. */
export class Selection extends Span {
  constructor(
    parent: Block | null,
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

  /** Selects the given {@link Command `Command`}. */
  select(command: Command, dir: Dir) {
    this.parent = command.parent
    this[L] = command[L]
    this[R] = command[R]
    this.focused = dir
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

/** A single item inside a {@link Block `Block`}. */
export abstract class Command<
  T extends Block[] = Block[],
  C extends string = string,
> {
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
      block[L] = blocks[i - 1] || null
      block[R] = blocks[i + 1] || null
    }
  }

  /** Reads this node in a screen-accessible format. */
  abstract reader(): string

  /** Writes this node in ASCII-style math. */
  abstract ascii(): string

  /** Writes this node in LaTeX. */
  abstract latex(): string

  protected setEl(el: HTMLSpanElement) {
    this.el.replaceWith(el)
    ;(this as any).el = el
  }

  /** May invalidate {@link Cursor `Cursor`}s. */
  replaceWith(command: Command) {
    this.el.replaceWith(command.el)
    if (this[L]) {
      ;(this[L] as CommandMut)[R] = command
    } else if (this.parent) {
      ;(this.parent.ends as EndsMut)[L] = command
    }
    if (this[R]) {
      ;(this[R] as CommandMut)[L] = command
    } else if (this.parent) {
      ;(this.parent.ends as EndsMut)[R] = command
    }
    ;(command as CommandMut)[L] = this[L]
    ;(command as CommandMut)[R] = this[R]
  }

  /** Moves the cursor into the given {@link Command `Command`}. */
  abstract moveInto(cursor: Cursor, towards: Dir): void

  /** Moves the cursor out of the passed {@link Block `Block`}. */
  abstract moveOutOf(cursor: Cursor, towards: Dir, block: Block): void

  /**
   * Whether this command is a simple transparent wrapper around its contents
   * which does nothing except aid grouping. The only built-in `Command` for
   * which this returns `true` is a `CmdBrack` where both ends are parentheses.
   *
   * Note that this `Command` must have exactly one child block for unwrapping
   * to work.
   *
   * This is used in the {@link Block#unwrap `Block.unwrap`} method.
   */
  isTransparentWrapper(): boolean {
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
   * Inserts the given {@link Block `Block`} to some side of this `Command`. Does
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
   * Inserts the `Command` to some side of a {@link Cursor `Cursor`}. Assumes the
   * {@link Command `Command`} does not already have a parent block.
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
  }

  /**
   * Gets the {@link Block `Block`} that should be moved into when a vertical
   * arrow key is pressed from above or below this `Command` and the cursor
   * attempts to move into it.
   *
   * The returned {@link Block `Block`} must be owned by this `Command`.
   */
  abstract vertInto(dir: VDir, clientX: number): Block | undefined

  /**
   * Gets the {@link Block `Block`} that should be moved into when a vertical
   * arrow key is pressed and the cursor is on one side of this `Command`.
   *
   * The returned {@link Block `Block`} must be owned by this `Command`.
   */
  abstract vertFromSide(dir: VDir, clientX: number): Block | undefined

  /**
   * Moves out of a {@link Block `Block`} owned by this `Command`.
   *
   * If a {@link Block `Block`} is returned, it must be owned by this `Command`,
   * and the {@link Cursor `Cursor`} will be placed into it. If `true` is
   * returned, `cursor` must be updated to a new position.
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
   * Removes this `Command` from its containing {@link Block `Block`}.
   * Invalidates {@link Cursor `Cursor`}s using this `Command` as an anchor.
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
  }

  /**
   * Deletes this `Command` from the given direction. Called when the cursor is
   * to one side of this `Command` and the user pressed "Backspace" or
   * "Delete".
   */
  abstract delete(cursor: Cursor, from: Dir): void

  /**
   * Deletes the provided {@link Block `Block`} from the given direction in this
   * `Command`. Called when the cursor is at the edge of a {@link Block `Block`}
   * and the user presses "Backspace" or "Delete".
   */
  abstract deleteBlock(cursor: Cursor, at: Dir, block: Block): void

  toString() {
    return this.latex()
  }
}

/** The updated cursor or selection created by {@link Init `Init`}. */
export type InitRet = Cursor | Selection | undefined | void

/**
 * Something which can be initialized to the left side of a cursor or (possibly)
 * on top of a selection.
 */
export interface Init<E = KeyboardEvent | undefined> {
  init(cursor: Cursor, input: string, event: E): InitRet
  initOn?(selection: Selection, input: string, event: E): InitRet
}
