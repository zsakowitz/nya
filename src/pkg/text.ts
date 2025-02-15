import type { Package } from "."
import type { Node } from "../eval/ast/token"
import { NO_DRAG } from "../eval/ast/tx"
import { safe } from "../eval/lib/util"
import { doc, FnDist } from "../eval/ops/dist"
import { FnDistManual, type FnOverload } from "../eval/ops/dist-manual"
import { ALL_DOCS } from "../eval/ops/docs"
import { OP_JUXTAPOSE } from "../eval/ops/op/juxtapose"
import { OP_CDOT } from "../eval/ops/op/mul"
import type { JsValue, Ty } from "../eval/ty"
import { frac, num } from "../eval/ty/create"
import { Display } from "../eval/ty/display"
import { Leaf } from "../field/cmd/leaf"
import type { FieldInert } from "../field/field-inert"
import { LatexParser, toText } from "../field/latex"
import {
  Block,
  L,
  R,
  type Command,
  type Cursor,
  type Dir,
  type InitProps,
} from "../field/model"
import { h, hx, t } from "../jsx"
import { defineExt, Store } from "../sheet/ext"
import { circle } from "../sheet/ui/expr/circle"

declare module "../eval/ty/index.js" {
  interface Tys {
    text: TextSegment[]
  }

  interface TyComponents {
    text: never
  }
}

declare module "../eval/ast/token.js" {
  interface Nodes {
    text: { value: string }
  }
}

export class CmdTextInert extends Leaf {
  static fromLatex(_cmd: string, parser: LatexParser): Command {
    return new this(parser.text())
  }

  constructor(readonly value: string) {
    super("\\text", h("", "“", h("font-['Times_New_Roman']", value), "”"))
  }

  reader(): string {
    return " Text " + this.value + " EndText "
  }

  ascii(): string {
    return "text(" + this.value + ")"
  }

  latex(): string {
    return "\\text{" + toText(this.value) + "}"
  }

  ir(tokens: Node[]): void {
    tokens.push({ type: "text", value: this.value })
  }
}

export class CmdText extends Leaf {
  static init(cursor: Cursor, props: InitProps) {
    const text = new CmdText("", props.field)
    text.insertAt(cursor, L)
    text.input.focus()
  }

  static fromLatex(_cmd: string, parser: LatexParser): Command {
    const text = parser.text()
    if (parser.field) {
      return new this(text, parser.field)
    } else {
      return new CmdTextInert(text)
    }
  }

  input
  ql
  qr
  constructor(
    value = "",
    readonly field?: FieldInert,
  ) {
    const input = hx(
      "input",
      "relative focus:outline-none font-['Times_New_Roman'] bg-transparent -mx-[0.5ch] px-[0.5ch] [box-sizing:content-box]",
    )
    input.spellcheck = false
    input.value = value
    if (field) {
      input.addEventListener("keydown", (ev) => {
        ev.stopImmediatePropagation()

        if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey) {
          return
        }

        if (
          (ev.key == "ArrowLeft" &&
            input.selectionStart == 0 &&
            input.selectionEnd == 0) ||
          (ev.key == "ArrowRight" &&
            input.selectionStart == input.value.length &&
            input.selectionEnd == input.value.length)
        ) {
          const dir = ev.key == "ArrowLeft" ? L : R
          ev.preventDefault()
          field.onBeforeChange?.()
          field.sel = this.cursor(dir).selection()
          field.onAfterChange?.(true)
          field.el.focus()
        } else {
          field.onBeforeChange?.()
        }
      })
      input.addEventListener("input", () => {
        checkSize()
        field.onAfterChange?.(false)
      })
    } else {
      input.disabled = true
    }
    function checkSize() {
      input.style.width = "0px"
      input.style.width =
        Math.max(1, input.scrollWidth - input.offsetWidth) + "px"
    }
    setTimeout(checkSize)
    const ql = h("", "“")
    const qr = h("", "”")
    super("\\text", h("inline-block relative", ql, input, qr))
    this.ql = ql
    this.qr = qr
    this.input = input
  }

  reader(): string {
    return " Text " + this.input.value + " EndText "
  }

  ascii(): string {
    return "text(" + this.input.value + ")"
  }

  latex(): string {
    return "\\text{" + toText(this.input.value) + "}"
  }

  ir(tokens: Node[]): void {
    tokens.push({ type: "text", value: this.input.value })
  }

  moveInto(cursor: Cursor, towards: Dir): void {
    cursor.moveTo(this, towards == R ? L : R)
    if (towards == R) {
      this.input.setSelectionRange(0, 0)
    } else {
      this.input.setSelectionRange(
        this.input.value.length,
        this.input.value.length,
      )
    }
    this.input.focus()
  }
}

export const OP_TO_TEXT = new FnDist<"text">(
  "to text",
  "converts a value into text",
)
  .add(
    ["r32"],
    "text",
    (a) => {
      const b = new Block(null)
      new Display(b.cursor(R), frac(10, 1)).value(num(a.value))
      return [{ type: "latex", value: b.latex() }]
    },
    err,
  )
  .add(
    ["c32"],
    "text",
    (a) => {
      const b = new Block(null)
      new Display(b.cursor(R), frac(10, 1)).nums([
        [a.value.x, ""],
        [a.value.y, "i"],
      ])
      return [{ type: "latex", value: b.latex() }]
    },
    err,
  )
  .add(["text"], "text", (a) => a.value, err)

const FN_CONCAT = new (class extends FnDistManual<"text"> {
  constructor() {
    super("concat", "concatenates one or more string-like values into a string")
    ALL_DOCS.push(this)
  }

  signature(args: Ty[]): FnOverload<"text"> {
    return {
      params: args.map((x) => x.type),
      type: "text",
      js(...args) {
        return args.flatMap((x) => OP_TO_TEXT.js1(x).value)
      },
      glsl() {
        throw new Error("Text cannot be created in shaders.")
      },
    }
  }

  docs() {
    const ps = OP_TO_TEXT.o
      .map((x) => (x.params.length == 1 ? x.params[0]! : null))
      .filter((x) => x != null)
    return [
      ...ps.map((a) => doc([a], "text")),
      ...ps.flatMap((a) => ps.map((b) => doc([a, b], "text"))),
    ]
  }
})()

const store = new Store((expr) => {
  const el = h(
    "block px-2 pb-1 -mt-2 w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] overflow-x-auto [&::-webkit-scrollbar]:hidden font-sans [.nya-expr:has(&):not(:focus-within)_.nya-display]:sr-only [.nya-expr:has(&):not(:focus-within)_&]:px-4 [.nya-expr:has(&):not(:focus-within)_&]:py-3 [.nya-expr:has(&):not(:focus-within)_&]:mt-0 [white-space:preserve_wrap]",
  )
  el.addEventListener("click", () => expr.field.el.focus())
  return el
})

const EXT_TEXT = defineExt({
  data(expr) {
    if (expr.js?.value.type != "text" || expr.js.value.list !== false) {
      return
    }

    const value = expr.js.value as JsValue<"text", false>

    const el = store.get(expr)
    while (el.firstChild) {
      el.firstChild.remove()
    }

    if (value.list === false) {
      for (const segment of value.value) {
        if (segment.type == "plain") {
          el.append(t(segment.value))
        } else {
          try {
            const block = new LatexParser(
              expr.field.options,
              segment.value,
              null,
            ).parse()
            block.el.classList.add("font-['Symbola']", "text-[110%]")
            el.append(block.el)
          } catch {}
        }
      }
    }
    return el
  },
  aside() {
    return circle("text")
  },
  el(data) {
    return data
  },
})

export const PKG_TEXT: Package = {
  id: "nya:text",
  name: "text",
  label: "adds support for writing and outputting text",
  field: {
    inits: {
      '"': CmdText,
      "“": CmdText,
    },
    latex: {
      "\\text": CmdText,
    },
  },
  ty: {
    info: {
      text: {
        name: "text",
        namePlural: "texts",
        coerce: {},
        garbage: {
          js: [],
          get glsl(): never {
            return err()
          },
        },
        get glsl(): never {
          return err()
        },
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            new CmdTextInert(
              value
                .map((x) => (x.type == "latex" ? "$" + x.value + "$" : x.value))
                .join(""),
            ).insertAt(props.cursor, L)
          },
        },
        icon() {
          return h(
            "",
            h(
              "text-[oklch(0.518_0.253_323.949)] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Symbola'] text-[100%] whitespace-pre",
                "“ ”",
              ),
            ),
          )
        },
      },
    },
  },
  eval: {
    txrs: {
      text: {
        deps() {},
        drag: NO_DRAG,
        js(node) {
          return {
            type: "text",
            value: [{ type: "plain", value: node.value }],
            list: false,
          }
        },
        glsl() {
          err()
        },
      },
    },
    fns: {
      concat: FN_CONCAT,
    },
  },
  sheet: {
    exts: {
      1: [EXT_TEXT],
    },
  },
}

export type TextSegment = { type: "plain" | "latex"; value: string }

OP_JUXTAPOSE.add(
  ["text", "text"],
  "text",
  (a, b) => [...a.value, ...b.value],
  () => {
    throw new Error("Text cannot be created in shaders.")
  },
)

OP_CDOT.add(
  ["r32", "text"],
  "text",
  (a, b) => {
    const av = Math.floor(num(a.value))
    if (safe(av) && 0 <= av && av <= 10000) {
      const ret = []
      for (let i = 0; i < av; i++) {
        ret.push(...b.value)
      }
      return ret
    } else {
      return []
    }
  },
  err,
)

OP_CDOT.add(
  ["text", "r32"],
  "text",
  (a, b) => {
    const bv = Math.floor(num(b.value))
    if (safe(bv) && 0 <= bv && bv <= 10000) {
      const ret = []
      for (let i = 0; i < bv; i++) {
        ret.push(...a.value)
      }
      return ret
    } else {
      return []
    }
  },
  err,
)

function err(): never {
  throw new Error("Text is not supported in shaders.")
}
