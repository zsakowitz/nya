import { writeFileSync } from "node:fs"
import { todo } from "../../lang/src/emit/error"

/**
 * Everything is either present or `null` to allow for shape-based
 * optimizations, and so that tokens like `+`, which could either be prefixes or
 * infixes, may exist without specialized token types.
 */
class IR<T> {
  constructor(
    readonly leaf: Item<T> | null,
    readonly prfx: { data: T; pl: number; pr: number } | null,
    readonly sufx: { data: T; prec: number } | null,
    readonly infx: {
      data: T
      pl: number
      pr: number
      /** A special precedence to use for the RHS when parsing at root level. */
      pr0: number
    } | null,
  ) {}
}

class Item<T> {
  constructor(
    readonly data: T,
    readonly args: readonly Item<T>[] | null,
  ) {}
}

function leaf<T>(data: T) {
  return new IR(new Item(data, null), null, null, null)
}

function prfx<T>(data: T, pl: number, pr = pl) {
  return new IR(null, { data, pl, pr }, null, null)
}

function sufx<T>(data: T, prec: number) {
  return new IR(null, null, { data, prec }, null)
}

function infx<T>(data: T, pl: number, pr: number, pr0 = pr) {
  return new IR(null, null, null, { data, pl, pr, pr0 })
}

function pifx<T>(data: T, pl: number, pr: number, prec: number) {
  return new IR(null, { data, pl: prec, pr: prec }, null, {
    data,
    pl,
    pr,
    pr0: pr,
  })
}

const ops: Record<string, IR<string>> = {
  true: leaf("true"),
  false: leaf("false"),

  ",": infx(",", 4, 5, 1),
  with: infx("with", 2, 3),

  not: prfx("not", 12),

  "=": infx("=", 13, 14),
  "<": infx("<", 13, 14),
  ">": infx(">", 13, 14),

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

class Lexer<T> {
  private index = 0
  private readonly j: IR<T> | null

  constructor(
    private readonly ir: IR<T>[],
    juxtaposeToken: IR<T> | null,
  ) {
    this.j = juxtaposeToken
  }

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

  private leaf(): Item<T> {
    const next = this.next()

    if (next == null) {
      this.raiseNext(`Unexpected end of expression.`)
    }

    if (next.leaf != null) {
      return next.leaf
    }

    if (next.prfx) {
      return new Item(next.prfx.data, [this.expr(next.prfx.pr)])
    }

    this.raisePrev(`Expected expression.`)
  }

  private isNextOpLowerThan(min: number, skip: 0 | 1): boolean {
    for (let i = this.index + skip; i < this.ir.length; i++) {
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

  private expr(min: number): Item<T> {
    let lhs = this.leaf()

    while (true) {
      const next = this.peek()

      if (next == null) {
        return lhs
      }

      if (next.sufx) {
        if (next.sufx.prec > min) {
          this.next()
          lhs = new Item(next.sufx.data, [lhs])
          continue
        } else break
      }

      let skip: 0 | 1 = 1
      const infx = next.infx ?? ((skip = 0), this.j?.infx)
      if (!infx || infx.pl < min || this.isNextOpLowerThan(min, skip)) {
        break
      }
      if (skip) {
        this.next()
      }
      lhs = new Item(infx.data, [
        lhs,
        this.expr(min === 0 ? infx.pr0 : infx.pr),
      ])
      continue
    }

    return lhs
  }

  parse(): Item<T> {
    const item = this.expr(0)
    if (this.index < this.ir.length) {
      this.raiseNext("Unable to parse expression.")
    }
    return item
  }
}

function of(text: string) {
  return new Lexer(
    (text.match(/[A-Za-z]+|\d+|\S/g) ?? []).map((x) =>
      /^\w$|^\d+$/.test(x) ?
        leaf(x)
      : (ops[x] ?? todo(`Unknown token '${x}'.`)),
    ),
    ops["*"]!,
  )
}

function log(item: Item<string>): string {
  const op = item.data

  return (
    !item.args?.length ? op
    : item.args.length == 2 ?
      `(${log(item.args[0]!)} ${op} ${log(item.args[1]!)})`
    : `(${op} ${item.args.map(log).join(" ")})`
  )
}

const sources = `
a , b with c , d with e , f
2 = 3 = 4 = 5 = 6
true < false > true < false > true < false > true + 2 * 3 * 4 + 5 * 8 * - 9 * sin 4 * 4 * not true < 2
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
4 * not 2 + 3 < 4
2 = 3 + 4 * 5 ^ 6
2 ! * 3 * - 4 !
2 sin 4 sin 3 !
`
  .split("\n")
  .map((x) => x.trim())
  .filter((x) => x)

const rounds = 1e4
function round() {
  let now = performance.now()
  for (let i = 0; i < rounds; i++) {
    sources.map((x) => of(x).parse())
  }
  return performance.now() - now
}

function stdev(data: number[]) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length
  return (
    data.map((x) => (x - mean) ** 2).reduce((a, b) => a + b) / (data.length - 1)
  )
}

const data = Array.from<void>({ length: 10 }).fill().map(round).slice(1)
const mean = data.reduce((a, b) => a + b, 0) / data.length
console.log(
  `${((mean / rounds) * 1e3).toFixed(2)}µs ± ${((stdev(data) / rounds) * 1e6).toFixed(2)}ns`,
)

const ret = sources.map((x) => log(of(x).parse())).join("\n")

writeFileSync("./text", ret)

// current algorithm is 7.4~7.5µs
