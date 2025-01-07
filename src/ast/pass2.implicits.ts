import {
  isValueToken,
  Precedence,
  PRECEDENCE_MAP,
  type PuncBinary,
  type PuncPm,
  type Token,
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

function isAtom(token: Token | undefined) {
  return isValueToken(token) && !(token.type == "var" && token.implicitFn)
}

export function pass2_implicits(tokens: Token[]): Token[] {
  if (tokens.length == 0) {
    return [{ type: "void" }]
  }

  tokens.reverse()

  const ret: Token[] = [takeWord()]
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

  function op(precedence: number) {
    const token = tokens[tokens.length - 1]
    if (
      token?.type == "punc" &&
      PRECEDENCE_MAP[token.value.kind] == precedence
    ) {
      tokens.pop()
      return token.value
    }
  }

  function fn() {
    const token = tokens[tokens.length - 1]
    if (token?.type == "var" && token.implicitFn) {
      tokens.pop()
      return token
    }
  }

  function big() {
    const token = tokens[tokens.length - 1]
    if (token?.type == "bigsym") {
      tokens.pop()
      return token
    }
  }

  function isNextFn() {
    const next = tokens[tokens.length - 1]
    return next?.type == "var" && next.implicitFn
  }

  function isNextBig() {
    return tokens[tokens.length - 1]?.type == "bigsym"
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

  function takeSigns(): PuncPm[] {
    let f
    const pms: PuncPm[] = []
    while ((f = op(Precedence.Sum)) && f.type == "pm") {
      pms.push(f.kind)
    }
    return pms
  }

  function reduceSigns(signs: PuncPm[], value: Token): Token {
    return signs.reduceRight<Token>(
      (a, b) => ({ type: "op", kind: b, a }),
      value,
    )
  }

  function putBackSigns(signs: PuncPm[]) {
    tokens.push(
      ...signs.reverse().map<Token>((x) => ({
        type: "punc",
        value: { kind: x, type: "pm" },
      })),
    )
  }

  function takeSeq(): Token | undefined {
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
      atoms.reduce((a, b) => ({ type: "juxtaposed", a, b })),
    )
  }

  function takeExp(): Token {
    let first = takeSeq()
    if (!first) {
      return {
        type: "error",
        reason: "Expected some value; received function name or punctuation.",
      }
    }

    let values = [first]

    let exs: PuncBinary[] = []
    let ex
    while ((ex = op(Precedence.Exponential))) {
      if (ex.type != "infix") {
        return {
          type: "error",
          reason:
            "Non-infix operators cannot be parsed with exponential-level precedence.",
        }
      }
      exs.push(ex.kind)

      const next = takeSeq()
      if (!next) {
        return {
          type: "error",
          reason: `The '${ex.kind}' operator needs a value on both sides.`,
        }
      }

      values.push(next)
    }

    while (exs.length) {
      values.push({
        type: "op",
        kind: exs.pop()!,
        b: values.pop()!,
        a: values.pop()!,
      })
    }

    return values[0]!
  }

  function takeMul(): Token {
    let lhs = takeExp()
    if (lhs.type == "error") {
      return lhs
    }

    let md
    while ((md = op(Precedence.Product))) {
      if (md.type != "infix") {
        return {
          type: "error",
          reason: "Operators with product-level precedence must be infixes.",
        }
      }
      lhs = { type: "op", kind: md.kind, a: lhs, b: takeExp() }
    }

    return lhs
  }

  function takeFn(): Token | undefined {
    const name = fn()
    if (!name) return

    const nested: [PuncPm[], Token][] = []

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

    const contents = takeMul()

    return {
      type: "call",
      name,
      args: nested.reduceRight<Token>(
        (args, [signs, name]) =>
          reduceSigns(signs, { type: "call", name, args }),
        contents,
      ),
    }
  }

  function takeWord(): Token {
    const mySigns = takeSigns()
    if (isNextFn()) {
      let lhs = takeFn()!
      let f
      while ((f = takeFn())) {
        lhs = { type: "juxtaposed", a: lhs, b: f }
      }
      return reduceSigns(mySigns, lhs)
    } else {
      putBackSigns(mySigns)

      let lhs = takeMul()
      if (lhs.type == "error") return lhs

      let f
      while ((f = takeFn())) {
        lhs = { type: "juxtaposed", a: lhs, b: f }
      }

      return reduceSigns(mySigns, lhs)
    }
  }

  function takeBig(): Token | undefined {
    const head = big()
    if (!head) return

    return {
      type: "big",
      cmd: head.cmd,
      sub: head.sub,
      sup: head.sup,
      of: takeWord(),
    }
  }
}
