import { CmuLeaf } from "."
import type { Node } from "../../../../eval/ast/token"
import { h, usvg } from "../../../jsx"
import { L, type Cursor, type InitProps, type InitRet } from "../../../model"

const Q = 2.1

// Symbols are grouped by kind and general shape
const SYM = {
  // Plain digits

  0: `M 1.75 ${2 - Q} a ${Q} ${Q} 180 0 0 0 ${2 * Q} a ${Q} ${Q} 180 0 0 0-${2 * Q}`,
  f: "M 0 2 h 3.5 M 1.07 1.25 v 1.5 M 2.43 1.25 v 1.5",

  1: "M 0 0.75 h 3.5 V 4 M 1.55 0 v 1.6",
  7: "M 0 0 v 3.25 h 3.5 M 1.95 2.4 v 1.6",
  8: "M 3.5 0.75 h-3.5 V 4 M 1.95 0 v 1.6",
  e: "M 3.5 0 v 3.25 h-3.5 M 1.55 2.4 v 1.6",

  2: "M 0 0 h 1.5 l 1 3.6 l 1-3.6",
  4: "M 0 0 l 1 3.6 l 1-3.6 h 1.5",
  b: "M 0 4 l 1-3.6 l 1 3.6 h 1.5",
  d: "M 0 4 h 1.5 l 1-3.6 l 1 3.6",

  3: "M 0 0 h 1.75 v 4 h 1.75",
  c: "M 0 4 h 1.75 v-4 h 1.75",

  5: "M 0 0 l 1.17 3.8 l 1.17-3.6 l 1.17 3.8",
  a: "M 0 4 l 1.17-3.8 l 1.17 3.6 l 1.17-3.8",

  6: "M 0 0 v 4 h 3.5 v-4",
  9: "M 0 4 v-4 h 3.5 v 4",

  // Digits tagged with waves

  v1: "M -0.5 0 h 1.2 l -0.8 1 H 3.5 V 4 M 1.85 0.25 v 1.6",
  v7: "M -0.5 0 h 1.2 l -0.8 1 H 1 V 3.25 H 3.5 M 2.4 2.4 v 1.6",

  v2: "M -0.5 0 h 1.2 l -0.8 1 H 1.5 l 1 2.7 l 1-2.7",
  v4: "M -0.5 0 h 1.2 l -0.8 1 H 1 l 0.75 2.7 l 0.75-2.7 H 3.5",

  v3: "M -0.5 0 h 1.2 l -0.8 1 H 1.85 V 4 H 3.5",

  v5: "M -0.5 0 h 1.2 l -0.8 1 H 1 l 0.83 2.7 l 0.83 -2.4 l 0.83 2.7",

  v6: "M -0.5 0 h 1.2 l -0.8 1 H 1 V 4 H 3.5 V 1",

  // Mathematical operations

  "+": "M 0 0 A 1.7 1.7 0 0 0 3.5 0 M 1.75 1.7 V 4",
  "-": "M 0 4 A 1.7 1.7 0 0 1 3.5 4 M 1.75 2.3 V 0",
}

export type Sym = `${keyof typeof SYM}`

export class CmuSym extends CmuLeaf {
  static init(cursor: Cursor, { input }: InitProps): InitRet {
    if (Object.keys(SYM).indexOf(input) != -1) {
      new CmuSym(input as Sym).insertAt(cursor, L)
    }
  }

  constructor(readonly sym: Sym) {
    super(
      sym,
      h(
        "inline-block p-[.1em]",
        usvg(
          "overflow-visible inline-block h-[1em] align-[-.2em]",
          /[0-9a-f]/.test(sym[sym.length - 1]!) ?
            sym[0] == "v" ?
              "-0.5 -0.5 4 5"
            : "0 -0.5 3.5 5"
          : "0 0 3.5 4",
          SYM[sym],
          /[0-9a-f]/.test(sym[sym.length - 1]!) ?
            sym[0] == "v" ?
              0.4 * (5 / 4)
            : 0.4 * (5 / 4)
          : 0.4,
        ),
      ),
    )
  }

  ascii(): string {
    return "[redacted]"
  }

  latex(): string {
    return "[redacted]"
  }

  reader(): string {
    return "[redacted]"
  }

  ir(tokens: Node[]): void {
    if (this.sym == "+" || this.sym == "-") {
      tokens.push({ type: "punc", kind: "pm", value: this.sym })
      return
    }

    if (this.sym[0] == "v") {
      tokens.push({ type: "var", value: this.sym, kind: "var" })
      return
    }

    const last = tokens[tokens.length - 1]
    if (last?.type == "num16") {
      tokens.pop()
      tokens.push({ type: "num16", value: last.value + this.sym })
    } else {
      tokens.push({ type: "num16", value: this.sym })
    }
  }
}
