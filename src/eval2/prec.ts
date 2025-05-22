import { issue } from "../../lang/src/emit/error"
import {
  Bracket,
  Infix,
  Leaf,
  Prefix,
  PrxIfx,
  Suffix,
  type Data,
  type IR,
  type IRBracket,
  type IRInfix,
  type IRPrefix,
  type IRPrefixInfix,
  type IRSuffix,
} from "./node"

// export const PImmediateSuffix = 18
// export const PExponent = 17
// export const PProduct = 16
// export const PFnCall = 15
// export const PBigSym = 14
// export const PSum = 13
// export const PConversion = 12
// export const PRange = 11
// export const PComparison = 10
// export const PBooleanAnd = 9
// export const PBooleanOr = 8
// export const PAction = 7
// export const PColon = 6
// export const PComma = 5
// export const PBindingIgnoringLhsComma = 4
// export const PBindingOverLhsComma = 3

// https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html

export type Item =
  | { type: "atom"; of: Data<Leaf> }
  | {
      type: "op"
      via: IRPrefix | IRSuffix | IRInfix | IRPrefixInfix
      of: Item[]
    }
  | ItemBrack

type ItemBrack = {
  type: "brack"
  via: [IRBracket | IRSuffix, IRBracket]
  of: Item[]
}

class LexError extends Error {
  constructor(message: string, _lexer: Lexer, _on: number) {
    super(message)
  }
}

class Lexer {
  index = 0

  constructor(readonly ir: IR[]) {}

  raisePrev(message: string): never {
    throw new LexError(message, this, this.index - 1)
  }

  raiseNext(message: string): never {
    throw new LexError(message, this, this.index)
  }

  next() {
    return this.ir[this.index++]
  }

  peek() {
    return this.ir[this.index]
  }

  private takeBracket(lhs: IRBracket | IRSuffix): ItemBrack & { of: [Item] } {
    if (!lhs.matches) {
      this.raisePrev("Unexpected closing bracket.")
    }
    const contents = this.expr(0)
    const rhs = this.next()
    if (!rhs || rhs.type != Bracket || !lhs.matches(rhs)) {
      this.raisePrev("Mismatched brackets.")
    }
    return { type: "brack", via: [lhs, rhs], of: [contents] }
  }

  expr(min: number): Item {
    const next = this.next()

    let lhs: Item =
      next == null ? this.raiseNext("Expected expression.")
      : next.type == Leaf ? { type: "atom", of: next.val }
      : next.type == Bracket ? this.takeBracket(next)
      : next.type == Prefix || next.type == PrxIfx ?
        { type: "op", via: next, of: [this.expr(next.fr)] }
      : this.raisePrev("Expected expression.")

    loop: while (true) {
      const op = this.peek()

      if (op == null) {
        break
      }

      if (op.type == Suffix) {
        const l = op.p
        if (l < min) {
          break
        }
        this.next()
        if (op.matches) {
          const rhs = this.takeBracket(op)
          lhs = { type: "brack", via: rhs.via, of: [lhs, rhs.of[0]] }
        } else {
          lhs = { type: "op", via: op, of: [lhs] }
        }
        continue
      }

      if (op.type == Leaf || op.type == Prefix) {
        if (JUXTAPOSE.il < min) {
          break
        }

        for (let i = this.index; ; i++) {
          const el = this.ir[i]
          if (!el) {
            break
          }
          if (el.type == PrxIfx || el.type == Prefix) {
            if (el.fl < min) {
              break loop
            }
          }
        }

        const rhs = this.expr(JUXTAPOSE.ir)
        lhs = { type: "op", via: JUXTAPOSE, of: [lhs, rhs] }
        continue
      }

      if (op.type == Infix || op.type == PrxIfx) {
        if ((min == 0 ? (op.il0 ?? op.il) : op.il) < min) {
          break
        }

        for (let i = this.index + 1; ; i++) {
          const el = this.ir[i]
          if (!el) {
            break
          }
          if (el.type == PrxIfx || el.type == Prefix) {
            if (el.fl < min) {
              break loop
            }
          }
        }

        this.next()

        const rhs = this.expr(min == 0 ? (op.ir0 ?? op.ir) : op.ir)
        lhs = { type: "op", via: op, of: [lhs, rhs] }
        continue
      }

      break
    }

    return lhs
  }

  parse() {
    const item = this.expr(0)
    if (this.index < this.ir.length) {
      this.raiseNext("I don't understand this.")
    }
    return item
  }
}

function o(data: string) {
  return { type: "op" as const, data }
}

function emit2(data: Item): string {
  switch (data.type) {
    case "atom":
      return "" + data.of.data
    case "op":
      if (data.of.length == 2) {
        return `(${emit2(data.of[0]!)} ${data.via.val.data} ${emit2(data.of[1]!)})`
      }
      return `(${data.via.val.data} ${data.of.map(emit2).join(" ")})`
    case "brack":
      return `(${data.via[0].val.data}..${data.via[1].val.data} ${data.of.map(emit2).join(" ")})`
  }
}

function go(a: IR[]) {
  const e = new Lexer(a).parse()
  return emit2(e)
}

const JUXTAPOSE: IRInfix = { type: Infix, val: o("*"), il: 10, ir: 11 }

const ops: Record<string, IR> = {
  // @ts-expect-error
  __proto__: null,

  ",": { type: Infix, val: o(","), il: 1, ir: 2 },
  with: { type: Infix, val: o("with"), il: 1, ir: 2 },

  not: { type: Prefix, val: o("not"), fl: 2, fr: 2 },

  "==": { type: Infix, val: o("=="), il: 3, ir: 4 },
  "!=": { type: Infix, val: o("!="), il: 3, ir: 4 },

  "+": { type: PrxIfx, val: o("+"), il: 5, ir: 6, fl: 10, fr: 10 },
  "-": { type: PrxIfx, val: o("-"), il: 5, ir: 6, fl: 10, fr: 10 },

  sum: { type: Prefix, val: o("sum"), fl: 7, fr: 7 },

  sin: { type: Prefix, val: o("sin"), fl: 8, fr: 9 },
  exp: { type: Prefix, val: o("exp"), fl: 8, fr: 9 },

  "*": { type: Infix, val: o("*"), il: 10, ir: 11 },
  "/": { type: Infix, val: o("/"), il: 10, ir: 11 },
  mod: { type: Infix, val: o("mod"), il: 10, ir: 11 },
  odot: { type: Infix, val: o("odot"), il: 10, ir: 11 },
  "%": { type: Infix, val: o("%"), il: 10, ir: 11 },

  "^": { type: Infix, val: o("^"), il: 13, ir: 12 },
}

function parse(x: string) {
  const ir = (x.match(/[A-Za-z]+|\d+|[=!<>]=|&&|\|\||\S/g) ?? []).map(
    (x): IR => {
      if (/^\w$/.test(x)) {
        return { type: Leaf, val: { type: "num", data: x } }
      }
      return ops[x] ?? issue("Invalid token " + x + ".")
    },
  )

  return go(ir)
}

for (const a of [1, 2, 3, 4])
  for (const b of [1, 2, 3, 4])
    for (const c of [1, 2, 3, 4])
      for (const e of [1, 2, 3, 4])
        for (const f of [1, 2, 3, 4])
          for (const g of [1, 2, 3, 4])
            for (const h of [1, 2, 3, 4])
              for (const d of [1, 2, 3, 4]) {
                ops[","] = {
                  type: Infix,
                  val: o(","),
                  il: a,
                  il0: b,
                  ir: c,
                  ir0: d,
                }
                ops["with"] = {
                  type: Infix,
                  val: o("with"),
                  il: e,
                  il0: f,
                  ir: g,
                  ir0: h,
                }
                if (
                  parse(`2 , 3 with 4 , 5 with 6 , 7`) ==
                  "(2 , ((3 with (4 , 5)) with (6 , 7)))"
                ) {
                  const n = +(a == b) + +(c == d) + +(e == f) + +(g == h)
                  if (n >= 3) {
                    console.log([a, b, c, d, e, f, g, h].join(" ") + " // " + n)
                  }
                }
              }

// (2 , ((3 with (4 , 5)) with (6 , 7)))

//
// ;`
// 2 , 3 with 4 , 5
// `
//   .split("\n")
//   .map((x) => x.trim())
//   .filter((x) => x)
//   .forEach(parse)

// Notational oddities:
//   sin a b = sin (a b)
//   sum a b = sum (a b)
//   - a b = - (a b)
//   sin a sin b = (sin a) (sin b)
//   sum a sum b = sum (a (sum b))
//   - a - b = (- a) - b
//   a, b with c, d with e, f = a, ((b with (c, d)) with (e, f))
//   iterate a, b from c, d = iterate ((a, b) from (c, d))
