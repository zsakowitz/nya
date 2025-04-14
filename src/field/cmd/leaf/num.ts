import type { Node } from "@/eval/ast/token"
import { L, R, type Dir } from "@/field/dir"
import { h } from "@/jsx"
import { Leaf } from "."
import type { LatexParser } from "../../latex"
import { Block, Cursor, Span, type Command, type InitProps } from "../../model"
import { CmdSupSub } from "../math/supsub"
import { CmdVar } from "./var"

export class CmdNum extends Leaf {
  static init(cursor: Cursor, { input, options }: InitProps) {
    const num = new CmdNum(input)
    const left = cursor[L]

    if (
      left &&
      options.subscriptNumberAfter &&
      options.subscriptNumberAfter(left)
    ) {
      if (left instanceof CmdSupSub) {
        num.insertAt(left.create("sub").cursor(R), L)
      } else if (cursor[R] instanceof CmdSupSub) {
        num.insertAt(cursor[R].create("sub").cursor(L), L)
        cursor.moveTo(cursor[R], R)
      } else {
        const sub = new Block(null)
        num.insertAt(sub.cursor(R), L)
        new CmdSupSub(sub, null).insertAt(cursor, L)
      }
      return
    }

    num.insertAt(cursor, L)
  }

  static fromLatex(cmd: string, parser: LatexParser): Command {
    if (cmd == "\\digit") {
      return new this(parser.text())
    }
    return new this(cmd)
  }

  constructor(readonly text: string) {
    super(text, h("", text))
  }

  ascii(): string {
    return this.text
  }

  latex(): string {
    if ("0" <= this.text && this.text <= "9") {
      return this.text
    } else {
      return `\\digit{${this.text}}`
    }
  }

  reader(): string {
    return this.text
  }

  moveAcrossWord(cursor: Cursor, dir: Dir): void {
    cursor.moveTo(this, dir)
    while (
      cursor[dir] instanceof CmdNum ||
      (cursor[dir] instanceof CmdDot && !(cursor[dir][dir] instanceof CmdDot))
    ) {
      cursor.moveTo(cursor[dir], dir)
    }
  }

  ir(tokens: Node[]): void {
    const last = tokens[tokens.length - 1]
    if (last && last.type == "num") {
      tokens.pop()
      if (last.span) {
        last.span[R] = this[R]
      }
      tokens.push({
        type: "num",
        value: last.value + this.text,
        span: last.span,
      })
    } else {
      tokens.push({
        type: "num",
        value: this.text,
        span: new Span(this.parent, this[L], this[R]),
      })
    }
  }
}

export class CmdDot extends Leaf {
  static init(cursor: Cursor) {
    new CmdDot().insertAt(cursor, L)
  }

  static fromLatex(_cmd: string, _parser: LatexParser): Command {
    return new this()
  }

  constructor() {
    super(".", h("nya-cmd-dot", "."))
    this.render()
  }

  render() {
    const l = this[L] instanceof CmdDot
    const r = this[R] instanceof CmdDot
    const prop = !l && this[R] instanceof CmdVar

    this.setEl(
      h(
        "nya-cmd-dot" +
          (l && !r && this[R] ? " nya-cmd-dot-r" : "") +
          (r && !l && this[L] ? " nya-cmd-dot-l" : "") +
          (prop ? " nya-cmd-dot-prop" : ""),
        ".",
      ),
    )
  }

  onSiblingChange(): void {
    this.render()
  }

  reader(): string {
    return " dot "
  }

  ascii(): string {
    return "."
  }

  latex(): string {
    return "."
  }

  ir(tokens: Node[]): void {
    const last = tokens[tokens.length - 1]
    if (last?.type == "punc") {
      if (last.value == "." || last.value == "..") {
        tokens.pop()
        tokens.push({
          type: "punc",
          value: `${last.value}.`,
          kind: "infix",
        })

        const prev = tokens[tokens.length - 2]
        if (!prev) {
          tokens.splice(0, 0, { type: "void" })
        } else if (prev.type == "punc" && prev.value == ",") {
          tokens.splice(tokens.length - 1, 0, { type: "void" })
        }
        if (!this[R]) {
          tokens.push({ type: "void" })
        }

        return
      }
    }
    tokens.push({
      type: "punc",
      value: ".",
      kind: "infix",
      span: new Span(this.parent, this[L], this[R]),
    })
  }

  moveAcrossWord(cursor: Cursor, dir: Dir): void {
    cursor.moveTo(this, dir)
    if (cursor[dir] instanceof CmdDot) {
      while (cursor[dir] instanceof CmdDot) {
        cursor.moveTo(cursor[dir], dir)
      }
    } else {
      while (
        cursor[dir] instanceof CmdNum ||
        (cursor[dir] instanceof CmdDot &&
          !((cursor[dir] as CmdDot)[dir] instanceof CmdDot))
      ) {
        cursor.moveTo(cursor[dir], dir)
      }
    }
  }
}
