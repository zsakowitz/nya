import { getPrecedence, type PuncInfix, type Token } from "./token"

export function pass3_ordering(tokens: Token[]): Token {
  tokens.reverse()

  const output: Token[] = []
  const ops: PuncInfix[] = []

  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 == 0) {
      output.push(tokens.pop()!)
      continue
    }

    const o1 = tokens.pop()!
    if (o1.type != "punc") {
      return {
        type: "error",
        reason: `Expected operator; found '${o1.type}'.`,
      }
    }

    if (o1.value.type != "infix" && o1.value.type != "pm") {
      return {
        type: "error",
        reason: `Expected infix operator; found prefix or suffix '${o1.value.kind}'.`,
      }
    }

    let o2
    while (
      (o2 = tokens[tokens.length - 1]) &&
      o2.type == "punc" &&
      (o2.value.type == "infix" || o2.value.type == "pm") &&
      getPrecedence(o2.value.kind) >= getPrecedence(o1.value.kind)
    ) {
      tokens.pop()
      output.push(o2)
    }

    ops.push(o1.value)
  }

  while (ops.length) {
    output.push({ type: "punc", value: ops.pop()! })
  }

  return output as any
}
