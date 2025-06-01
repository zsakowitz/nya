import type { Package } from "#/types"
import type { FnSignature } from "@/docs/signature"
import type { Node } from "@/eval/ast/token"
import { NO_DRAG, NO_SYM } from "@/eval/ast/tx"
import { FnDist } from "@/eval/ops/dist"
import { FnDistManual, type FnOverload } from "@/eval/ops/dist-manual"
import { ALL_DOCS } from "@/eval/ops/docs"
import { each, type JsValue, type Ty } from "@/eval/ty"
import { Display } from "@/eval/ty/display"
import { Leaf } from "@/field/cmd/leaf"
import { L, R, type Dir } from "@/field/dir"
import type { FieldInert } from "@/field/field-inert"
import { LatexParser, toText } from "@/field/latex"
import {
  Block,
  type Command,
  type Cursor,
  type InitProps,
  type IRBuilder,
} from "@/field/model"
import { h, hx, t } from "@/jsx"
import { int } from "@/lib/real"
import { defineExt, Store } from "@/sheet/ext"
import { circle } from "@/sheet/ui/expr/circle"

declare module "@/eval/ty" {
  interface Tys {
    text: TextSegment[]
  }
}

declare module "@/eval/ast/token" {
  interface Nodes {
    text: { value: TextSegment[] }
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
    if (/^\$(?!\s).*\S\$$/.test(this.value)) {
      tokens.push({
        type: "text",
        value: [{ type: "latex", value: this.value.slice(1, -1) }],
      })
    } else {
      tokens.push({
        type: "text",
        value: [{ type: "plain", value: this.value }],
      })
    }
  }

  ir2(ret: IRBuilder): void {
    // TODO: allow latex
    ret.leaf({ type: "text", data: this.value })
  }
}

class CmdText extends Leaf {
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
    const input = hx("input", {
      class:
        "relative focus:outline-none font-['Times_New_Roman'] bg-transparent -mx-[.5ch] px-[.5ch] [box-sizing:content-box] ![field-sizing:content]",
      autocomplete: "off",
    })
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
    new IntersectionObserver(checkSize).observe(input)
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
    if (/^\$(?!\s).*\S\$$/.test(this.input.value)) {
      tokens.push({
        type: "text",
        value: [{ type: "latex", value: this.input.value.slice(1, -1) }],
      })
    } else {
      tokens.push({
        type: "text",
        value: [{ type: "plain", value: this.input.value }],
      })
    }
  }

  ir2(ret: IRBuilder): void {
    ret.leaf({
      type: "text",
      data: this.input.value,
    })
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

// TODO: automatically convert all values
const OP_TO_TEXT = new FnDist<"text">("text", "converts a value into text")
  .add(
    ["bool"],
    "text",
    (a) => [{ type: "latex", value: a.value + "" }],
    err,
    "\\nyaop{text}(true)=\\textinert{true}",
  )
  .add(
    ["r32"],
    "text",
    (a) => {
      const b = new Block(null)
      new Display(b.cursor(R), int(10)).value(a.value.num())
      return [{ type: "latex", value: b.latex() }]
    },
    err,
    "\\nyaop{text}(2.5)=\\textinert{2.5}",
  )
  .add(
    ["c32"],
    "text",
    (a) => {
      const b = new Block(null)
      new Display(b.cursor(R), int(10)).nums([
        [a.value.x, ""],
        [a.value.y, "i"],
      ])
      return [{ type: "latex", value: b.latex() }]
    },
    err,
    "\\nyaop{text}(2+3i)=\\textinert{2+3i}",
  )
  .add(
    ["text"],
    "text",
    (a) => a.value,
    err,
    "\\nyaop{text}(\\textinert{hello world})=\\textinert{hello world}",
  )

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
        return args.flatMap((x) => OP_TO_TEXT.js1(this, x).value)
      },
      glsl() {
        throw new Error("Text cannot be created in shaders.")
      },
      docOrder: null,
      usage: [],
    }
  }

  docs(): FnSignature[] {
    const ps = OP_TO_TEXT.o
      .map((x) => (x.params && x.params.length == 1 ? x.params[0]! : null))
      .filter((x) => x != null)
    return [
      ...ps.map(
        // TODO: how should concat usage examples be displayed
        (a): FnSignature => ({
          params: [{ type: a, list: false }],
          dots: false,
          ret: { type: "text", list: false },
          usage: [],
        }),
      ),
      ...ps.flatMap((a) =>
        ps.map(
          // TODO: how should concat usage examples be displayed
          (b): FnSignature => ({
            params: [
              { type: a, list: false },
              { type: b, list: false },
            ],
            dots: false,
            ret: { type: "text", list: false },
            usage: [],
          }),
        ),
      ),
    ]
  }
})()

export const store = new Store((expr) => {
  const el = h(
    "flex flex-col px-2 pb-1 -mt-2 w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] overflow-x-auto [&::-webkit-scrollbar]:hidden font-sans [.nya-expr:has(&):not(:focus-within)_.nya-display]:sr-only [.nya-expr:has(&):not(:focus-within)_&]:px-4 [.nya-expr:has(&):not(:focus-within)_&]:py-3 [.nya-expr:has(&):not(:focus-within)_&]:mt-0 [white-space:preserve_wrap] [line-height:1.5] gap-2 max-h-[400px] select-text nya-not-expr-focus-target",
  )
  let moved = false
  el.addEventListener("pointerdown", () => {
    moved = false
  })
  el.addEventListener("mousemove", () => {
    moved = true
  })
  el.addEventListener("click", () => {
    if (!moved) {
      expr.field.el.focus()
    }
  })
  return el
})

const EXT_TEXT = defineExt({
  data(expr) {
    if (expr.js?.value.type != "text") {
      return
    }

    const value = expr.js.value as JsValue<"text">

    const parent = store.get(expr)
    while (parent.firstChild) {
      parent.firstChild.remove()
    }

    for (const text of each(value)) {
      const el = h("")
      parent.appendChild(el)
      for (const segment of text) {
        if (segment.type == "plain") {
          el.append(t(segment.value))
        } else {
          try {
            const block = new LatexParser(
              expr.field.options,
              expr.field.scope,
              segment.value,
              null,
            ).parse()
            block.el.classList.add("font-['Symbola']", "text-[110%]")
            el.append(block.el)
          } catch {}
        }
      }
    }

    return parent
  },
  aside() {
    return circle("text")
  },
  el(data) {
    return data
  },
})

export type TextSegment = { type: "plain" | "latex"; value: string }

function err(): never {
  throw new Error("Text is not supported in shaders.")
}

export default {
  name: "text",
  label: "writing and outputting text",
  category: "miscellaneous",
  deps: ["num/real", "num/complex", "bool"],
  field: {
    inits: {
      '"': CmdText,
      "“": CmdText,
    },
    latex: {
      "\\text": CmdText,
      "\\textinert": CmdTextInert,
    },
  },
  ty: {
    info: {
      text: {
        name: "text",
        namePlural: "texts",
        get glsl(): never {
          return err()
        },
        toGlsl() {
          err()
        },
        garbage: {
          js: [],
          get glsl(): never {
            return err()
          },
        },
        coerce: {},
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            new CmdTextInert(value.map((x) => x.value).join("")).insertAt(
              props.cursor,
              L,
            )
          },
        },
        order: null,
        point: false,
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
        token: null,
        glide: null,
        preview: null,
        extras: null,
      },
    },
  },
  eval: {
    tx: {
      ast: {
        text: {
          label: "evaluates a text string",
          sym: NO_SYM,
          deps() {},
          drag: NO_DRAG,
          js(node) {
            return { type: "text", value: node.value, list: false }
          },
          glsl() {
            err()
          },
        },
      },
    },
    fn: {
      concat: FN_CONCAT,
    },
  },
  sheet: {
    exts: {
      1: [EXT_TEXT],
    },
  },
} satisfies Package
