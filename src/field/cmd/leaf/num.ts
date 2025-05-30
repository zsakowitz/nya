import {
  Precedence,
  PRECEDENCE_MAP,
  type Node,
  type PuncBinaryStr,
  type PuncInfix,
  type Var,
} from "@/eval/ast/token"
import { TXR_MAGICVAR } from "@/eval/ast/tx"
import { subscript } from "@/eval/lib/text"
import { L, R, type Dir } from "@/field/dir"
import type { Options, WordMapWithoutSpaces } from "@/field/options"
import { h } from "@/jsx"
import type { Scope } from "@/sheet/deps"
import { Leaf } from "."
import type { LatexInit, LatexParser } from "../../latex"
import { Block, Cursor, Span, type Command, type InitProps } from "../../model"
import { CmdSupSub } from "../math/supsub"
import { CmdToken, TokenCtx } from "./token"
import { CmdWord } from "./word"

// DEBT: figure out a name for this file

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

/**
 * The different kinds of {@linkcode CmdVar}-composed words which exist. These
 * affect punctuation and parentheses.
 *
 * - `"var"` is suitable for variables like Desmos's `width` and `height`
 * - `"prefix"` is suitable for functions like `sin` and `cos`
 * - `"infix"` is suitable for operators like `for` and `with`
 *
 * Spacing of plus/minus signs and parentheses are specified below:
 *
 * - `"var"`: `+word` `2 + word` `word + 2` `word2` `(...)word(...)`
 * - `"prefix"`: `+word` `2 + word` `word +2` `(...) word(...)`
 * - `"infix"`: `2 word` `word 2` `word +` `(...) word (...)`
 */
export type WordKind =
  | "var"
  | "prefix"
  | "magicprefix"
  | "infix"
  | "magicprefixword"

export class CmdVar extends Leaf {
  static init(cursor: Cursor, props: InitProps) {
    const { input, options } = props
    const self = new CmdVar(input, options)
    self.insertAt(cursor, L)
    if (options.autos) {
      const cmds = options.autos
      const maxLen = cmds.maxLen
      if (!maxLen) return

      // Gather as many `CmdVar`s as possible (but only up to `maxLen`)
      let leftmost: Command = self
      const text = [self.text]
      while (text.length < maxLen && leftmost[L]?.autoCmd) {
        leftmost = leftmost[L]
        text.unshift(leftmost.autoCmd!)
      }

      // Try each combination
      while (text.length) {
        const word = text.join("")
        if (cmds.has(word)) {
          const cmd = cmds.get(word)!
          new Span(cursor.parent, leftmost[L], self[R]).remove()
          cmd.init(cursor, { ...props, input: "\\" + word })
          return
        }

        text.shift()
        leftmost = leftmost[R]!
      }
    }
  }

  static leftOf(
    cursor: Cursor,
    token: Var & { sup?: undefined },
    options: Options,
    scope: Scope,
  ) {
    if (/^\$\d+$/.test(token.value)) {
      new CmdToken(BigInt(token.value.slice(1)), new TokenCtx(scope)).insertAt(
        cursor,
        L,
      )
    } else {
      ;(token.value.length == 1 ?
        new CmdVar(token.value, options)
      : new CmdWord(token.value, "var")
      ).insertAt(cursor, L)
    }

    if (token.sub) {
      const sub = new Block(null)
      const supsub = new CmdSupSub(sub, null)
      const subc = sub.cursor(R)
      for (const char of subscript(token.sub)) {
        ;(/\d/.test(char) ?
          new CmdNum(char)
        : new CmdVar(char, options)
        ).insertAt(subc, L)
      }
      supsub.insertAt(cursor, L)
    }
  }

  static fromLatex(cmd: string, parser: LatexParser): Command {
    return new this(cmd, parser.options)
  }

  static render(
    text: string,
    kind: CmdVar["kind"],
    renderPart: CmdVar["part"] | "both",
    part: CmdVar["part"] | "both",
    prop: boolean,
  ) {
    const side =
      part == L ? "-l"
      : part == R ? "-r"
      : part == "both" ? "-l nya-cmd-word-r"
      : "-mid"

    if (kind == "magicprefix" || kind == "magicprefixword") {
      kind = "prefix"
    }

    return h(
      "nya-cmd-var" +
        (kind ?
          ` nya-cmd-word nya-cmd-word-${kind} nya-cmd-word${side}` +
          ((
            !(part == L || part == "both") &&
            (renderPart == L || renderPart == "both")
          ) ?
            " pl-[.05em]"
          : "") +
          ((
            !(part == R || part == "both") &&
            (renderPart == R || renderPart == "both")
          ) ?
            " pr-[.05em]"
          : "")
        : "") +
        (prop ? ` nya-cmd-${kind ? "word" : "var"}-prop` : ""),
      h(
        "font-['Times_New_Roman'] [line-height:.9]" +
          (kind == null ?
            text != "°" ?
              " italic"
            : ""
          : "") +
          // `relative` helps keep f above other letters, which is important in selections
          (text == "f" ?
            " mx-[.1em] [.nya-cmd-word>:where(&)]:mx-0 relative"
          : ""),
        text,
      ),
    )
  }

  readonly kind: WordKind | null = null
  readonly renderPart: Dir | "both" | null = null
  readonly part: Dir | "both" | null = null
  readonly prop: boolean = false

  constructor(
    readonly text: string,
    readonly options: Options,
  ) {
    super(text, CmdVar.render(text, null, null, null, false))
  }

  private renderMatching(
    kind: WordKind | null,
    part: "both" | Dir | null,
    prop: boolean,
  ) {
    this.render(kind, part, part, prop)
  }

  private render(
    kind: WordKind | null,
    renderPart: "both" | Dir | null,
    part: "both" | Dir | null,
    prop: boolean,
  ) {
    if (
      this.kind == kind &&
      this.renderPart == renderPart &&
      this.part == part &&
      this.prop == prop
    ) {
      return
    }

    this.setEl(
      CmdVar.render(
        this.text,
        ((this as CmdVarMut).kind = kind),
        ((this as CmdVarMut).renderPart = renderPart),
        ((this as CmdVarMut).part = part),
        ((this as CmdVarMut).prop = prop),
      ),
    )
  }

  private checkWords(words: WordMapWithoutSpaces<WordKind>) {
    if (
      this.parent?.parent instanceof CmdSupSub &&
      this.parent == this.parent.parent.sub
    ) {
      if (!this.options.wordsInSubscript?.(this.parent.parent)) {
        return
      }
    }

    const vars: CmdVar[] = [this]

    let lhs: CmdVar = this
    while (lhs[L] instanceof CmdVar) {
      lhs = lhs[L]
      vars.push(lhs)
    }
    vars.reverse()

    let rhs: CmdVar = this
    while (rhs[R] instanceof CmdVar) {
      rhs = rhs[R]
      vars.push(rhs)
    }

    const hasDot = lhs[L] instanceof CmdDot
    for (let i = 0; i < vars.length; i++) {
      const cmd = vars[i]!
      cmd.render(null, null, null, hasDot && i == 0)
    }

    const maxLen = words.maxLen
    if (maxLen == 0) return

    for (let i = 0; i < vars.length; i++) {
      // `maxLen` might be shorter if we're near the end of the `vars` array
      const max = Math.min(vars.length - i, maxLen)

      const text: string[] = []
      for (let j = 0; j < max; j++) {
        text.push(vars[i + j]!.text)
      }

      for (let j = max; j > 0; j--, text.pop()) {
        const full = text.join("")
        const kind = words.get(full)

        if (kind) {
          const indices = words.spaceIndices(full)

          if (j == 1) {
            vars[i]!.render(kind, "both", "both", false)
          } else {
            vars[i]!.render(kind, indices?.includes(1) ? "both" : L, L, false)
            for (let k = i + 1; k < i + j - 1; k++) {
              const breakLhs = indices?.includes(k)
              const breakRhs = indices?.includes(k + 1)
              vars[k]!.render(
                kind,
                breakLhs && breakRhs ? "both"
                : breakLhs ? L
                : breakRhs ? R
                : null,
                null,
                false,
              )
            }
            vars[i + j - 1]!.render(
              kind,
              indices?.includes(i + j - 1) ? "both" : R,
              R,
              vars[i]![L] instanceof CmdDot,
            )
          }

          i += j - 1

          if (kind == "magicprefixword") {
            i++
            if (i < vars.length) {
              vars[i]!.renderMatching(
                "var",
                i == vars.length - 1 ? "both" : L,
                false,
              )
            }
            for (i++; i < vars.length; i++) {
              vars[i]!.renderMatching(
                "var",
                i == vars.length - 1 ? R : null,
                false,
              )
            }
            return
          }
          break
        }
      }
    }
  }

  ascii(): string {
    return this.text
  }

  latex(): string {
    // TODO: escape text
    if (this.part == L) {
      return "\\operatorname{" + this.text
    }
    if (this.part == R) {
      return this.text + "}"
    }
    if (this.part == "both") {
      return `\\operatorname{${this.text}}`
    }
    return this.text
  }

  reader(): string {
    if (this.part == L) {
      return " " + this.text
    } else if (this.part == R) {
      return this.text + " "
    } else if (this.part == "both") {
      return ` ${this.text} `
    }
    return this.text
  }

  onSiblingChange(): void {
    if (this.options.words) {
      this.checkWords(this.options.words)
    }
  }

  moveAcrossWord(cursor: Cursor, dir: Dir): void {
    if (!this.kind) {
      super.moveAcrossWord(cursor, dir)
      return
    }

    if (dir == L) {
      do {
        cursor.move(L)
      } while (
        cursor[L] instanceof CmdVar &&
        cursor[L].kind &&
        (cursor[R] as CmdVar).part != L
      )
    } else {
      do {
        cursor.move(R)
      } while (
        cursor[R] instanceof CmdVar &&
        cursor[R].kind &&
        (cursor[L] as CmdVar).part != R
      )
    }
  }

  ir(tokens: Node[]): true | void {
    magicprefix: if (
      (this.kind == "magicprefix" || this.kind == "magicprefixword") &&
      this.part == L
    ) {
      let value = this.text
      let el: Command = this
      let prop: string | undefined
      while (el[R] instanceof CmdVar) {
        const name = (el = el[R])
        value += name.text
        if (name.part == R) break
      }
      if (TXR_MAGICVAR[value]?.fnlike) {
        break magicprefix
      }
      if (el[R] instanceof CmdDot) {
        if (el[R][R] instanceof CmdVar) {
          let nextEl: CmdVar = el[R][R]
          let value = nextEl.text
          if (nextEl.kind != null) {
            while (nextEl[R] instanceof CmdVar) {
              nextEl = nextEl[R]
              value += nextEl.text
              if (nextEl.part == R) break
            }
          }
          prop = value
          el = nextEl
        }
      }
      const ss = el?.[R] instanceof CmdSupSub ? el[R] : null
      tokens.push({
        type: "magicvar",
        value,
        prop,
        sub: ss?.sub?.ast(),
        sup: ss?.sup?.ast(),
        contents: new Span(this.parent, ss || el, null).ast(),
      })
      return true
    }

    if (this.kind) {
      if (this.part == "both") {
        tokens.push({
          type: "var",
          value: this.text,
          kind:
            this.kind == "magicprefix" ? "prefix"
            : this.kind == "magicprefixword" ? "magicprefixword"
            : this.kind,
          span: new Span(this.parent, this[L], this[R]),
        })
        return
      }

      if (this.part == L) {
        tokens.push({
          type: "var",
          value: this.text,
          kind:
            this.kind == "magicprefix" ? "prefix"
            : this.kind == "magicprefixword" ? "magicprefixword"
            : this.kind,
          span: new Span(this.parent, this[L], this[R]),
        })
        return
      }

      let last = tokens[tokens.length - 1]
      if (last && last.type == "var" && !last.sub && !last.sup) {
        last.value += this.text
        if (last.span) {
          last.span[R] = this[R]
        }
      } else {
        tokens.push(
          (last = {
            type: "var",
            value: this.text,
            kind: this.kind,
            span: new Span(this.parent, this[L], this[R]),
          }),
        )
      }

      if (this.part == R && last.value in PRECEDENCE_MAP) {
        tokens.pop()
        tokens.push({
          type: "punc",
          kind: "infix",
          value: last.value as Exclude<PuncInfix, ".">,
        })
      }

      return
    }

    tokens.push({
      type: "var",
      value: this.text,
      kind: "var",
      span: new Span(this.parent, this[L], this[R]),
    })
  }

  get autoCmd(): string {
    return this.text
  }

  endsImplicitGroup(): boolean {
    if (this.kind == "magicprefix") {
      return true
    }
    if (this.kind != "infix") {
      return false
    }
    let el: CmdVar = this
    let text = this.text
    while (el.part != L && el[L] instanceof CmdVar) {
      text = el[L].text + text
      el = el[L]
    }
    return (
      {}.hasOwnProperty.call(PRECEDENCE_MAP, text) &&
      PRECEDENCE_MAP[text as PuncBinaryStr]! <= Precedence.Sum
    )
  }
}

export const OperatorName: LatexInit = {
  fromLatex(cmd, parser) {
    const word = cmd.startsWith("\\") ? cmd.slice(1) || cmd : cmd
    const block = new Block(null)
    const cursor = block.cursor(R)
    for (const char of word) {
      new CmdVar(char, parser.options).insertAt(cursor, L)
    }
    return block
  },
}

type CmdVarMut = { -readonly [K in keyof CmdVar]: CmdVar[K] }
