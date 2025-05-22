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
  constructor(message: string, lexer: Lexer, on: number) {
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

  expr(min_bp: number): Item {
    const next = this.next()

    let lhs: Item =
      next == null ? this.raiseNext("Expected expression.")
      : next.type == Leaf ? { type: "atom", of: next.val }
      : next.type == Bracket ? this.takeBracket(next)
      : next.type == Prefix || next.type == PrxIfx ?
        { type: "op", via: next, of: [this.expr(next.p)] }
      : this.raisePrev("Expected expression.")

    while (true) {
      const op = this.peek()
      if (op == null) {
        break
      }

      if (op.type == Leaf) {
        this.raiseNext(
          "Unexpected expression; implicit multiplication is not supported yet.",
        )
      }

      if (op.type == Suffix) {
        const l_bp = op.p
        if (l_bp < min_bp) {
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

      if (op.type == Infix || op.type == PrxIfx) {
        if (op.pl < min_bp) {
          break
        }
        this.next()

        const rhs = this.expr(op.pr)
        lhs = { type: "op", via: op, of: [lhs, rhs] }
        continue
      }

      break
    }

    return lhs
  }
}

const T1: IR = { type: Leaf, val: { type: "num", data: "1" } }
const T2: IR = { type: Leaf, val: { type: "num", data: "2" } }
const T3: IR = { type: Leaf, val: { type: "num", data: "3" } }
const T4: IR = { type: Leaf, val: { type: "num", data: "4" } }
const T5: IR = { type: Leaf, val: { type: "num", data: "5" } }
const T6: IR = { type: Leaf, val: { type: "num", data: "6" } }

function o(data: string) {
  return { type: "op" as const, data }
}

const OPlus: IR = { type: PrxIfx, val: o("+"), pl: 5, pr: 6, p: 12 }
const OMinus: IR = { type: PrxIfx, val: o("-"), pl: 5, pr: 6, p: 12 }
const OTimes: IR = { type: Infix, val: o("*"), pl: 8, pr: 10 }
const OSine: IR = { type: Prefix, val: o("sin"), p: 7 }

function emit(data: Item): string {
  switch (data.type) {
    case "atom":
      return "" + data.of.data
    case "op":
      return `(${data.via.val.data} ${data.of.map(emit).join(" ")})`
    case "brack":
      return `(${data.via[0].val.data}..${data.via[1].val.data} ${data.of.map(emit).join(" ")})`
  }
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
  const lexer = new Lexer(a)
  // console.log(
  //   JSON.stringify(
  //     lexer.expr_bp(0),
  //     (_, v) => {
  //       if (typeof v == "object" && v && "type" in v) {
  //         if ("via" in v && "of" in v) {
  //           return {
  //             type: v.type,
  //             via:
  //               Array.isArray(v.via) ? v.via.map((x: any) => x.val) : v.via.val,
  //             of: v.of,
  //           }
  //         }
  //         if ("data" in v && typeof v.data == "string") {
  //           return v.data
  //         }
  //       }
  //       return v
  //     },
  //     2,
  //   ),
  // )
  const e = lexer.expr(0)
  // console.log(emit(e))
  console.log(emit2(e))
  // console.log()
}

go([T2, OTimes, T3])
go([OSine, T2, OTimes, OSine, T3])

function g(p1: number, p2: number, p3: number) {
  const OTimes: IR = { type: Infix, val: o("*"), pl: p1, pr: p2 }
  const OSine: IR = { type: Prefix, val: o("sin"), p: p3 }
  go([OSine, T2, OTimes, OSine, T3]) // ((sin 2) * (sin 3))
  go([OSine, T2, OTimes, T3]) // (sin (2 * 3))
}

for (const a of [0, 1, 2, 3]) {
  for (const b of [0, 1, 2, 3]) {
    for (const c of [0, 1, 2, 3]) {
      g(a, b, c)
    }
  }
}

// Notational oddities:
//   sin a b = sin (a b)
//   sum a b = sum (a b)
//   - a b = - (a b)
//   sin a sin b = (sin a) (sin b)
//   sum a sum b = sum (a (sum b))
//   - a - b = (- a) - b
//   a, b with c, d with e, f = a, ((b with (c, d)) with (e, f))
//   iterate a, b from c, d = iterate ((a, b) from (c, d))
