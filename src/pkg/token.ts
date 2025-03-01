import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning"
import type { Package } from "."
import type { Node } from "../eval/ast/token"
import { Leaf } from "../field/cmd/leaf"
import { CmdUnknown } from "../field/cmd/leaf/unknown"
import { fa } from "../field/fa"
import { type LatexParser } from "../field/latex"
import {
  L,
  R,
  Span,
  type Command,
  type Cursor,
  type InitProps,
  type InitRet,
} from "../field/model"
import type { Options } from "../field/options"
import { h } from "../jsx"

let nextId = 0

function error() {
  return h(
    "",
    h(
      "text-orange-500 size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
      h("opacity-25 block bg-current absolute inset-0"),
      fa(
        faWarning,
        "fill-current absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px]",
      ),
    ),
  )
}

class CmdToken extends Leaf {
  static init(cursor: Cursor, props: InitProps): InitRet {
    this.new(props.options).insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, parser: LatexParser): Command {
    const arg = parser.text()
    const id = parseInt(arg, 10)

    if (isFinite(id)) {
      return new CmdToken(id, parser.options)
    }

    return new CmdUnknown(`‹token›`)
  }

  static new(options: Options) {
    return new this(nextId++, options)
  }

  constructor(
    readonly id: number,
    readonly options: Options,
  ) {
    if (id >= nextId) {
      nextId = id + 1
    }
    super("\\token", h("", error()))
  }

  reader(): string {
    return ` Token #${this.id} `
  }

  ir(tokens: Node[]): true | void {
    tokens.push({
      type: "var",
      kind: "var",
      span: new Span(this.parent, this[L], this[R]),
      value: "$" + this.id,
    })
  }

  ascii(): string {
    return `token(${this.id})`
  }

  latex(): string {
    return `\\token{${this.id}}`
  }
}

export const PKG_TOKEN: Package = {
  id: "nya:token",
  name: "tokens",
  label: "icon variables",
  field: {
    inits: {
      "@": CmdToken,
    },
    latex: {
      "\\token": CmdToken,
    },
  },
}
