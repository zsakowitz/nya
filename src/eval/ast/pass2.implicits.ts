import { L } from "../../field/model"
import { FNLIKE_MAGICVAR } from "./fnlike"
import {
  getPrecedence,
  isValueToken,
  Precedence,
  type Node,
  type PuncBinary,
  type PuncBinaryNoComma,
  type PuncInfix,
  type PuncPrefix,
  type Var,
} from "./token"

// rules governing implicits:
//
// TINY TOKENS
//   atom = x, x², (...), x.y, x!, etc.
//   fn   = implicit function name (sin, ln)
//   ex   = exponentiation-like operator (↑, ^)
//   md   = multiplication-level operator (*, mod)
//   pm   = plus-or-minus-like operator (+, -, ±)
//   big  = big operator (∑, ∏, ∫)
//
// SEQ = pm* (atom* BIG | atom+)
// EXP = SEQ (ex SEQ)*
// MUL = EXP (md EXP)*
// FN = fn (pm* fn)+ MUL
// WORD = pm* (FN+ | MUL FN*)
// BIG = big WORD

function isAtom(token: Node | undefined) {
  return token?.type == "var" ? token.kind == "var" : isValueToken(token)
}

export function pass2_implicits(tokens: Node[]): Node[] {
  if (tokens.length == 0) {
    return [{ type: "void" }]
  }

  tokens.reverse()

  const ret: Node[] = [takeWord()]
  let i = 0
  while (tokens.length) {
    i++
    if (i > 1e5) throw new Error("Expression is too long.")
    ret.push(tokens.pop()!)
    ret.push(takeWord())
  }

  return ret

  function atom() {
    const token = tokens[tokens.length - 1]
    if (isAtom(token)) {
      tokens.pop()
      return token
    }
  }

  function op(precedence: number): PuncBinaryNoComma | undefined {
    const token = tokens[tokens.length - 1]
    if (
      token?.type == "punc" &&
      (token.kind == "infix" || token.kind == "pm" || token.kind == "cmp") &&
      getPrecedence(token.value) == precedence &&
      token.value != ","
    ) {
      tokens.pop()
      return token satisfies PuncBinary as PuncBinaryNoComma
    }
  }

  function prefix(): PuncPrefix | undefined {
    const token = tokens[tokens.length - 1]
    if (
      token?.type == "punc" &&
      (token.kind == "prefix" || token.kind == "pm")
    ) {
      tokens.pop()
      return token
    }
  }

  function fn() {
    const token = tokens[tokens.length - 1]
    if (token?.type == "var" && token.kind == "prefix") {
      tokens.pop()
      return token
    }
  }

  function big() {
    const token = tokens[tokens.length - 1]
    if (token?.type == "bigsym" || token?.type == "dd") {
      tokens.pop()
      return token
    }
  }

  function isNextFn() {
    const next = tokens[tokens.length - 1]
    return next?.type == "var" && next.kind == "prefix"
  }

  function isNextBig() {
    return (
      tokens[tokens.length - 1]?.type == "bigsym" ||
      tokens[tokens.length - 1]?.type == "dd"
    )
  }

  function many1<T>(f: () => T): (T & {})[] | undefined {
    const first = f()
    if (!first) return
    const ret = [first]
    let match
    while ((match = f())) {
      ret.push(match)
    }
    return ret
  }

  function takeSigns(): PuncPrefix[] {
    let f
    const pms: PuncPrefix[] = []
    while ((f = prefix())) {
      pms.push(f)
    }
    return pms
  }

  function reduceSigns(signs: PuncPrefix[], value: Node): Node {
    if (
      signs.length >= 1 &&
      value.type == "num" &&
      value.value[0] != "-" &&
      value.value[0] != "+"
    ) {
      const last = signs[signs.length - 1]
      if (last?.value == "+" || last?.value == "-") {
        value.value = last.value + value.value
        if (value.span) {
          value.span[L] = "span" in last ? last.span[L] : value.span[L]
        }
        signs.pop()
      }
    }
    return signs.reduceRight<Node>(
      (a, b) => ({ type: "op", kind: b.value, a }),
      value,
    )
  }

  function putBackSigns(signs: PuncPrefix[]) {
    tokens.push(...signs.reverse())
  }

  function takeSeq(): Node | undefined {
    if (isNextBig()) {
      return takeBig()!
    }

    const signs = takeSigns()
    const atoms = many1(atom)
    if (!atoms) {
      return
    }
    if (isNextBig()) {
      atoms.push(takeBig()!)
    }

    return reduceSigns(
      signs,
      atoms.length == 1 ? atoms[0]! : { type: "juxtaposed", nodes: atoms },
    )
  }

  function takeExp(): Node {
    let first = takeSeq()
    if (!first) {
      return {
        type: "error",
        reason: "Expected some value; received function name or punctuation.",
      }
    }

    let values = [first]

    let exs: Exclude<PuncInfix, ",">[] = []
    let ex
    while ((ex = op(Precedence.Exponential))) {
      if (ex.kind != "infix") {
        return {
          type: "error",
          reason:
            "Non-infix operators cannot be parsed with exponential-level precedence. " +
            JSON.stringify(ex),
        }
      }
      exs.push(ex.value)

      const next = takeSeq()
      if (!next) {
        return {
          type: "error",
          reason: `The '${ex.value}' operator needs a value on both sides.`,
        }
      }

      values.push(next)
    }

    while (exs.length) {
      const b = values.pop()!
      values.push({
        type: "op",
        kind: exs.pop()!,
        // instead of b\na, we store `a` so that the order in debug windows looks correct
        a: values.pop()!,
        b,
        span: null,
      })
    }

    return values[0]!
  }

  function takeMul(): Node {
    let lhs = takeExp()
    if (lhs.type == "error") {
      return lhs
    }

    let md
    while ((md = op(Precedence.Product))) {
      lhs = {
        type: "op",
        kind: md.value,
        a: lhs,
        b: takeExp(),
        span: "span" in md ? md.span : null!,
      }
    }

    return lhs
  }

  function takeFn(): Node | undefined {
    const name = fn()
    if (!name) return

    const nested: [PuncPrefix[], Var][] = []

    while (true) {
      const mySigns = takeSigns()
      const myFn = fn()
      if (myFn) {
        nested.push([mySigns, myFn])
      } else {
        putBackSigns(mySigns)
        break
      }
    }

    let contents = takeMul()

    function isFnLikeMagicVar(node: Var) {
      return node.kind == "prefix" && FNLIKE_MAGICVAR[node.value]
    }

    while (nested.length) {
      const [signs, name] = nested.pop()!
      if (isFnLikeMagicVar(name)) {
        contents = reduceSigns(signs, {
          type: "magicvar",
          value: name.value,
          sub: name.sub,
          sup: name.sup,
          contents,
        })
      } else {
        contents = reduceSigns(signs, {
          type: "suffixed",
          base: name,
          suffixes: [{ type: "call", args: contents }],
        })
      }
    }

    if (isFnLikeMagicVar(name)) {
      return {
        type: "magicvar",
        value: name.value,
        sub: name.sub,
        sup: name.sup,
        contents,
      }
    } else {
      return {
        type: "suffixed",
        base: name,
        suffixes: [{ type: "call", args: contents }],
      }
    }
  }

  function takeWord(): Node {
    const mySigns = takeSigns()
    if (isNextFn()) {
      let lhs = takeFn()!
      let f
      while ((f = takeFn())) {
        if (lhs.type == "juxtaposed") {
          lhs.nodes.push(f)
        } else {
          lhs = { type: "juxtaposed", nodes: [lhs, f] }
        }
      }
      return reduceSigns(mySigns, lhs)
    } else {
      putBackSigns(mySigns)

      const lhs = takeMul()
      if (lhs.type == "error") return lhs

      const nodes: Node[] = [lhs]

      let f
      while ((f = takeFn())) {
        nodes.push(f)
      }

      if (nodes.length == 1) {
        return lhs
      } else {
        return { type: "juxtaposed", nodes }
      }
    }
  }

  function takeBig(): Node | undefined {
    const head = big()
    if (!head) return

    const of = takeWord()

    if (head.type == "dd") {
      return { type: "deriv", wrt: head.wrt, of }
    } else {
      return { type: "big", cmd: head.cmd, sub: head.sub, sup: head.sup, of }
    }
  }

  // FIXME: d/dx (x^2) doesn't work since it parses as a function call. maybe
  // it's easier to restrict function calls to actual variables only instead
  // of these cycle-wasting post-parse stage checks we do
}
