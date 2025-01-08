import { getPrecedence, type Node, type PuncInfix } from "./token"

export function pass3_ordering(tokens: Node[]): Node {
  if (tokens.length == 0) {
    return { type: "void" }
  }

  tokens.reverse()

  let isValue = false
  const output: Node[] = [tokens.pop()!]
  const ops: PuncInfix[] = []

  function pop() {
    isValue = !isValue
    return tokens.pop()
  }

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

      const a = output.pop()!
      const b = output.pop()!
      const op = o2.value
      if (op == ",") {
        if (a.type == "commalist") {
          output.push(a)
          a.items.push(b)
        } else {
          output.push({ type: "commalist", items: [a, b] })
        }
      } else {
        output.push({ type: "op", kind: op, a, b })
      }
    }

    ops.push(o1)
  }

  while (ops.length) {
    const op = ops.pop()!.value
    const a = output.pop()!
    const b = output.pop()!
    if (op == ",") {
      if (a.type == "commalist") {
        output.push(a)
        a.items.push(b)
      } else {
        output.push({ type: "commalist", items: [a, b] })
      }
    } else {
      output.push({ type: "op", kind: op, a, b })
    }
  }

  const ret = output[0]

  if (!ret) {
    return {
      type: "error",
      reason:
        "Highly invalid expression encountered. Please contact the authors of nya; this is definitely a bug.",
    }
  }

  return ret
}
