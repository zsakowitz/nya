import { L } from "@/field/dir"
import type { FieldInert } from "@/field/field-inert"
import { Block, Command } from "@/field/model"
import { fa, h, hx } from "@/jsx"
import { faKeyboard } from "@fortawesome/free-regular-svg-icons"
import { faCaretUp } from "@fortawesome/free-solid-svg-icons/faCaretUp"
import {
  CANCEL_CHANGES,
  keyFrom,
  type ActionKey,
  type Key,
  type KeyAction,
} from "./key"
import {
  CONTROLS,
  KEYS_ABC,
  KEYS_ABC_SHIFT,
  KEYS_CURSOR,
  KEYS_SYMBOL,
  KEYS_SYMBOL_SHIFT,
  NUM,
  NUM_SHIFT,
  type Layout,
} from "./layout"

function handle(key: Key, ev: () => void) {
  const el = keyFrom(key)
  el.addEventListener("click", ev)
  return el
}

const enum Mode {
  Num,
  Alpha,
  Sym,
  Cursor,
}

/**
 * Terminology:
 *
 * - "exclusive" means "no key besides the modifier has been pressed"
 */
const enum LockState {
  Disabled,

  HeldExclusive,
  ReleasedExclusive,
  HeldTwiceExclusive,

  Held,
  Released,
  HeldTwice,

  ReleasedTwice, // necessarily not exclusive; the key would be released otherwise
  WaitingForRelease, // another key is still held but the modifier was released
}

const DOUBLE_CLICK_RANGE = 300

class Lock {
  state: LockState = LockState.Disabled
  preserveModifier = false
  private releaseTs: number | null = null
  private isOtherHeld = false

  pressSelf() {
    if (this.state == LockState.WaitingForRelease) {
      return
    }

    switch (this.state) {
      case LockState.Disabled:
        this.state = LockState.HeldExclusive
        break
      case LockState.ReleasedTwice:
        if (this.isOtherHeld) {
          this.state = LockState.WaitingForRelease
        } else {
          this.state = LockState.Disabled
        }
        break
      case LockState.ReleasedExclusive:
      case LockState.Released:
        if (
          !this.preserveModifier &&
          this.releaseTs != null &&
          Date.now() < this.releaseTs + DOUBLE_CLICK_RANGE
        ) {
          this.state =
            this.state == LockState.ReleasedExclusive ?
              LockState.HeldTwiceExclusive
            : LockState.HeldTwice
        } else if (this.isOtherHeld) {
          this.state = LockState.WaitingForRelease
        } else {
          this.state = LockState.Disabled
        }
    }

    this.releaseTs = null
  }

  releaseSelf() {
    switch (this.state) {
      case LockState.HeldExclusive:
        this.state = LockState.ReleasedExclusive
        this.releaseTs = Date.now()
        return
      case LockState.HeldTwiceExclusive:
        this.state =
          this.preserveModifier ?
            LockState.ReleasedExclusive
          : LockState.ReleasedTwice
        break
      case LockState.Held:
      case LockState.HeldTwice:
        this.state =
          this.isOtherHeld ? LockState.WaitingForRelease : LockState.Disabled
    }

    this.releaseTs = null
  }

  pressOther() {
    this.isOtherHeld = true

    switch (this.state) {
      case LockState.HeldExclusive:
        this.state = LockState.Held
        break
      case LockState.ReleasedExclusive:
        this.state = LockState.Released
        break
      case LockState.HeldTwiceExclusive:
        this.state =
          this.preserveModifier ? LockState.Held : LockState.HeldTwice
    }
  }

  releaseOther(preserveModifier = this.preserveModifier) {
    this.isOtherHeld = false

    switch (this.state) {
      case LockState.WaitingForRelease:
        this.state = LockState.Disabled
        break
      case LockState.Released:
        if (!preserveModifier) {
          this.state = LockState.Disabled
        }
        break
    }
  }

  isActive() {
    return this.state != LockState.Disabled
  }

  isHeld() {
    const s = this.state

    return (
      s == LockState.Held ||
      s == LockState.HeldExclusive ||
      s == LockState.HeldTwice ||
      s == LockState.HeldTwiceExclusive ||
      this.isOtherHeld
    )
  }

  isLocked() {
    const s = this.state

    return (
      s == LockState.HeldTwice ||
      s == LockState.HeldTwiceExclusive ||
      s == LockState.ReleasedTwice
    )
  }
}

function getLayout(mode: Mode, shift: boolean): Layout {
  switch (mode) {
    case Mode.Num:
      return shift ? NUM_SHIFT : NUM
    case Mode.Alpha:
      return shift ? KEYS_ABC_SHIFT : KEYS_ABC
    case Mode.Sym:
      return shift ? KEYS_SYMBOL_SHIFT : KEYS_SYMBOL
    case Mode.Cursor:
      return KEYS_CURSOR
  }
}

export class KeyboardController {
  field: FieldInert | null = null
  readonly el

  private readonly hi
  private readonly lo
  private readonly elGrid

  private readonly kShift
  private readonly kAbc
  private readonly kSym
  private readonly kCursor

  /** The current layout. */
  private mode: Mode = Mode.Num
  private lock = new Lock()
  private shift = new Lock()

  /** What the keyboard is currently displaying. */
  private displaying: Layout | null = null

  constructor() {
    let elToggle

    document.documentElement.style.setProperty("--nya-kbd-visible-height", "0")
    this.el = h(
      "fixed right-0 w-full p-2 bg-[--nya-kbd-bg] [line-height:1] whitespace-nowrap z-10 select-none text-lg [&.nya-kbd-open]:bottom-0 -bottom-[--nya-kbd-height] transition-[bottom]",
      (elToggle = hx(
        "button",
        {
          class:
            "absolute bottom-full left-0 flex items-center bg-[--nya-kbd-bg] pr-4 pl-4 pt-2 pb-2 rounded-tr gap-2 fill-[--nya-kbd-toggle-icon] [.nya-kbd-open_&]:pb-1 transition-[padding-bottom]",
          tabindex: "-1",
        },
        fa(faKeyboard, "size-6"),
        fa(faCaretUp, "size-4 [.nya-kbd-open_&]:rotate-180 transition"),
      )),
      (this.elGrid = h(
        "grid grid-cols-[repeat(40,1fr)] gap-1 md:max-w-xl mx-auto",
        (this.hi = h("contents")),
        (this.kShift = keyFrom(CONTROLS.shift)),
        keyFrom(1),
        (this.lo = h("contents")),
        keyFrom(1),
        handle(CONTROLS.backspace, () => this.execKey(CONTROLS.backspace)),

        (this.kAbc = keyFrom(CONTROLS.abc)),
        (this.kSym = keyFrom(CONTROLS.sym)),
        keyFrom(1),
        handle(CONTROLS.arrowL, () => this.execKey(CONTROLS.arrowL)),
        handle(CONTROLS.arrowR, () => this.execKey(CONTROLS.arrowR)),
        (this.kCursor = keyFrom(CONTROLS.cursor)),
        keyFrom(CONTROLS.opts),
        keyFrom(1),
        handle(CONTROLS.enter, () => this.execKey(CONTROLS.enter)),
      )),
    )

    elToggle.addEventListener("click", () => {
      this.setVisible(!this.el.classList.contains("nya-kbd-open"))
    })

    new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        "--nya-kbd-grid-height",
        entry!.contentRect.height + "px",
      )
    }).observe(this.elGrid)

    this.el.addEventListener("pointerdown", (e) => {
      e.preventDefault()
    })

    this.el.addEventListener("click", () => {
      this.field?.el.focus()
    })

    this.kShift.addEventListener("pointerdown", () => {
      this.shift.pressSelf()
      this.update()
    })

    this.kShift.addEventListener("pointerup", () => {
      this.shift.releaseSelf()
      this.update()
    })

    const modifier = (key: HTMLSpanElement, mode: Mode, preserve: boolean) => {
      key.addEventListener("pointerdown", () => {
        if (this.mode != mode && this.lock.isHeld()) {
          return
        }
        if (this.mode != mode) {
          this.lock.state = LockState.Disabled
          this.mode = mode
        }
        this.lock.preserveModifier = preserve
        this.lock.pressSelf()
        this.update()
      })

      key.addEventListener("pointerup", () => {
        if (this.mode != mode) {
          return
        }
        this.lock.releaseSelf()
        this.update()
      })
    }

    modifier(this.kAbc, Mode.Alpha, true)
    modifier(this.kSym, Mode.Sym, false)
    modifier(this.kCursor, Mode.Cursor, true)

    this.update()
  }

  setVisible(visible: boolean) {
    if (visible) {
      if (!this.field) {
        const el = document.querySelector(".nya-kbd-field")
        if (el && el.nyaField) {
          this.field = el.nyaField
        } else {
          return
        }
      }
      if (document.activeElement != this.field.el) {
        this.field.el.focus()
      }
    }
    this.el.classList.toggle("nya-kbd-open", visible)
    document.documentElement.classList.toggle("nya-kbd-any-open", visible)
    this.elGrid.inert = !visible
  }

  private update() {
    if (!this.lock.isActive()) {
      this.mode = Mode.Num
    }
    const next = getLayout(this.mode, this.shift.isActive())
    const prev = this.displaying
    if (next != prev) {
      this.setLayout(next)
      this.displaying = next
    }

    const mod = (key: HTMLSpanElement, mode: Mode) => {
      key.classList.toggle(
        "nya-kbd-active",
        this.mode == mode && this.lock.isActive(),
      )

      key.classList.toggle(
        "nya-kbd-locked",
        this.mode == mode && this.lock.isLocked(),
      )
    }

    this.kShift.classList.toggle("nya-kbd-active", this.shift.isActive())
    this.kShift.classList.toggle("nya-kbd-locked", this.shift.isLocked())

    mod(this.kAbc, Mode.Alpha)
    mod(this.kSym, Mode.Sym)
    mod(this.kCursor, Mode.Cursor)
  }

  private exec(action: KeyAction) {
    const f = this.field
    if (!f) return

    if (typeof action == "string") {
      f.type(action)
      return
    }

    f.onBeforeChange?.()

    let wasChangeCanceled = false

    try {
      const ret = action(f)

      if (ret == CANCEL_CHANGES) {
        wasChangeCanceled = true
      } else if (typeof ret == "string") {
        f.type(ret, { skipChangeHandlers: true })
      } else if (ret instanceof Block || ret instanceof Command) {
        ret.insertAt(f.sel.remove(), L)
      }
    } finally {
      f.onAfterChange?.(wasChangeCanceled)
    }
  }

  private execKey(key: ActionKey) {
    if (typeof key == "string") {
      this.exec(key)
    } else if (typeof key == "object" && key) {
      const action = key.action ?? key.latex
      if (action) this.exec(action)
    }

    this.shift.pressOther()
    this.shift.releaseOther()
    this.lock.pressOther()
    this.lock.releaseOther()
    this.update()
  }

  setLayout(layout: Layout) {
    this.hi.replaceChildren(
      ...layout.hi.map((key) => handle(key, () => this.execKey(key))),
    )

    this.lo.replaceChildren(
      ...layout.lo.map((key) => handle(key, () => this.execKey(key))),
    )
  }
}
