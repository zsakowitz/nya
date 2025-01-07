import { getPrecedence, type PuncInfix, type Token } from "./token"

export function pass3_ordering(tokens: Token[]): Token {
  tokens.reverse()

  const output: Token[] = []
  const ops: PuncInfix[] = []

  function pop() {
    isValue = !isValue
    return tokens.pop()
  }

  let isValue = true
  while (tokens.length) {
    if (isValue) {
      output.push(pop()!)
      continue
    }

    const o1 = pop()!
    if (o1.type != "punc") {
      return {
        type: "error",
        reason: `Expected operator; found '${o1.type}'.`,
      }
    }

    if (o1.kind != "infix" && o1.kind != "pm") {
      return {
        type: "error",
        reason: `Expected infix operator; found prefix or suffix '${o1.value}'.`,
      }
    }

    let o2
    while (
      (o2 = tokens[tokens.length - 1]) &&
      o2.type == "punc" &&
      (o2.kind == "infix" || o2.kind == "pm") &&
      getPrecedence(o2.value) >= getPrecedence(o1.value)
    ) {
      pop()
      output.push(o2)
    }

    ops.push(o1)
  }

  while (ops.length) {
    output.push(ops.pop()!)
  }

  return { type: "rpn", nodes: output }
}
