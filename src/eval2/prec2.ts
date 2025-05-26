import { writeFileSync } from "node:fs"
import { todo } from "../../lang/src/emit/error"

/**
 * Everything is either present or `null` to allow for shape-based
 * optimizations, and so that tokens like `+`, which could either be prefixes or
 * infixes, may exist without specialized token types.
 */
interface IR {
  leaf: { data: string } | null
  prfx: { data: string; pl: number; pr: number } | null
  sufx: { data: string; prec: number } | null
  infx: { data: string; pl: number; pr: number } | null
}

type Item =
  | { type: "leaf"; data: string }
  | { type: "op"; op: string; args: readonly Item[] }

function leaf(data: string): IR {
  return { leaf: { data }, prfx: null, sufx: null, infx: null }
}

function prfx(data: string, pl: number, pr = pl): IR {
  return {
    leaf: null,
    prfx: { data, pl, pr },
    sufx: null,
    infx: null,
  }
}

function sufx(data: string, prec: number): IR {
  return {
    leaf: null,
    prfx: null,
    sufx: { data, prec },
    infx: null,
  }
}

function infx(data: string, pl: number, pr: number): IR {
  return {
    leaf: null,
    prfx: null,
    sufx: null,
    infx: { data, pl, pr },
  }
}

function pifx(data: string, pl: number, pr: number, prec: number): IR {
  return {
    leaf: null,
    prfx: { data, pl: prec, pr: prec },
    sufx: null,
    infx: { data, pl, pr },
  }
}

const ops: Record<string, IR> = {
  not: prfx("not", 12),

  "==": infx("==", 13, 14),
  "!=": infx("!=", 13, 14),

  "+": pifx("+", 15, 16, 22),
  "-": pifx("-", 15, 16, 22),

  sum: prfx("sum", 17),

  sin: prfx("sin", 18, 19),
  exp: prfx("exp", 18, 19),

  "*": infx("*", 20, 21),
  "/": infx("/", 20, 21),

  "^": infx("^", 24, 23),

  "!": sufx("!", 26),
}

class Lexer {
  static of(text: string) {
    return new Lexer(
      (text.match(/[A-Za-z]+|\d+|\S/g) ?? []).map((x) =>
        /^\w$|^\d+$/.test(x) ?
          leaf(x)
        : (ops[x] ?? todo(`Unknown token '${x}'.`)),
      ),
    )
  }

  index = 0

  constructor(readonly ir: IR[]) {}

  private raiseAt(message: string, index: number): never {
    console.error(this.ir[index])
    throw new Error(`${message} (at ${index})`)
  }

  private raisePrev(message: string): never {
    this.raiseAt(message, this.index - 1)
  }

  private raiseNext(message: string): never {
    this.raiseAt(message, this.index)
  }

  private peek() {
    return this.ir[this.index]
  }

  private next() {
    const ir = this.ir[this.index]
    if (ir != null) this.index++
    return ir
  }

  private leaf(min: number): Item {
    const next = this.next()

    if (next == null) {
      this.raiseNext(`Unexpected end of expression.`)
    }

    if (next.leaf) {
      return { type: "leaf", data: next.leaf.data }
    }

    if (next.prfx) {
      return {
        type: "op",
        op: next.prfx.data,
        args: [this.expr(next.prfx.pr)], // TODO: this will need to be reduced for 2 ^ -sin 3 * 2
      }
    }

    this.raisePrev(`Expected expression.`)
  }

  private isNextOpLowerThan(min: number): boolean {
    for (let i = this.index + 1; i < this.ir.length; i++) {
      const el = this.ir[i]!
      if (el.prfx && el.prfx.pl < min) {
        return true
      }
      if (el.leaf || el.infx) {
        return false
      }
    }
    return false
  }

  private expr(min: number): Item {
    let lhs = this.leaf(min)

    while (true) {
      const next = this.peek()

      if (next == null) {
        return lhs
      }

      if (next.sufx) {
        if (next.sufx.prec > min) {
          this.next()
          lhs = { type: "op", op: next.sufx.data, args: [lhs] }
          continue
        } else break
      }

      if (next.infx && next.infx.pl > min) {
        if (this.isNextOpLowerThan(min)) {
          break
        }
        this.next()
        lhs = {
          type: "op",
          op: next.infx.data,
          args: [lhs, this.expr(next.infx.pr)],
        }
        continue
      }

      break
    }

    return lhs
  }

  parse(): Item {
    const item = this.expr(0)
    // if (this.index < this.ir.length) {
    //   this.raisePrev(`I don't understand this.`)
    // }
    return item
  }
}

function log(item: Item): string {
  return (
    item.type == "leaf" ? item.data
    : item.args.length == 2 ?
      `(${log(item.args[0]!)} ${item.op} ${log(item.args[1]!)})`
    : `(${item.op} ${item.args.map(log).join(" ")})`
  )
}

const ret = `
2 + 3 + 4 * 5 * 6 + 2 * - 3 * 4 * sin 4 * sin 3
sin 2 * 3
sin 2 * 3 * sin 4
sin 2 * sin 3
sum 2 * sum 3
sin 2 * sin 3 !
4 !
sin 4 !
- 4 * 5
4 * - 5
4 * not 2 + 3
`
  .split("\n")
  .map((x) => x.trim())
  .filter((x) => x)
  .map((x) => log(Lexer.of(x).parse()))
  .join("\n")

writeFileSync("./text", ret)
