import { writeFileSync } from "node:fs"
import { todo } from "../../lang/src/emit/error"

/**
 * Everything is either present or `null` to allow for shape-based
 * optimizations, and so that tokens like `+`, which could either be prefixes or
 * infixes, may exist without specialized token types.
 */
class IR {
  constructor(
    readonly leaf: Item | null,
    readonly prfx: { data: string; pl: number; pr: number } | null,
    readonly sufx: { data: string; prec: number } | null,
    readonly infx: { data: string; pl: number; pr: number } | null,
  ) {}
}

type Item =
  | { type: "leaf"; data: string }
  | { type: "op"; op: string | Brack; args: readonly Item[] }

type Brack = { bl: string; br: string }

function leaf(data: string): IR {
  return new IR({ type: "leaf", data }, null, null, null)
}

function prfx(data: string, pl: number, pr = pl): IR {
  return new IR(null, { data, pl, pr }, null, null)
}

function sufx(data: string, prec: number): IR {
  return new IR(null, null, { data, prec }, null)
}

function infx(data: string, pl: number, pr: number): IR {
  return new IR(null, null, null, { data, pl, pr })
}

function pifx(data: string, pl: number, pr: number, prec: number): IR {
  return new IR(null, { data, pl: prec, pr: prec }, null, { data, pl, pr })
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

  "!": sufx("!", 25),
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

  private leaf(): Item {
    const next = this.next()

    if (next == null) {
      this.raiseNext(`Unexpected end of expression.`)
    }

    if (next.leaf != null) {
      return next.leaf
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
    let lhs = this.leaf()

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

  parse(source: string): Item {
    const item = this.expr(0)
    if (this.index < this.ir.length) {
      return {
        type: "op",
        op: `error "${source}" ${this.index}`,
        args: [item],
      }
    }
    return item
  }
}

function log(item: Item): string {
  if (item.type == "leaf") {
    return item.data
  }

  const op =
    typeof item.op == "string" ? item.op : `${item.op.bl}...${item.op.br}`

  return item.args.length == 2 ?
      `(${log(item.args[0]!)} ${op} ${log(item.args[1]!)})`
    : `(${op} ${item.args.map(log).join(" ")})`
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
( 4 + 5 ) * 5
`
  .split("\n")
  .map((x) => x.trim())
  .filter((x) => x)
  .map((x) => log(Lexer.of(x).parse(x)))
  .join("\n")

writeFileSync("./text", ret)
