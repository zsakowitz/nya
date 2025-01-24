import { getPrecedence, Precedence, type Node, type PuncBinary } from "./token"

export function pass3_ordering(tokens: Node[]): Node {
  if (tokens.length == 0) {
    return { type: "void" }
  }

  tokens.reverse()

  let isValue = false
  const output: Node[] = [tokens.pop()!]
  const ops: PuncBinary[] = []

  function pop() {
    isValue = !isValue
    return tokens.pop()
  }

  while (tokens.length) {
    if (isValue) {
      output.push(pop()!)
      continue
    }

    let o1 = pop()!
    if (o1.type != "punc") {
      return {
        type: "error",
        reason: `Expected operator; found '${o1.type}'.`,
      }
    }

    if (o1.kind != "infix" && o1.kind != "pm" && o1.kind != "cmp") {
      return {
        type: "error",
        reason: `Expected infix operator; found prefix or suffix '${o1.value}'.`,
      }
    }

    let o2
    while (
      (o2 = ops[ops.length - 1]) &&
      getPrecedence(o2.value) >= getPrecedence(o1.value)
    ) {
      ops.pop()
      output.push(o2)
    }

    ops.push(o1)
  }

  while (ops.length) {
    const op = ops.pop()!
    output.push(op)
  }

  const stack: Node[] = []

  for (const node of output) {
    if (node.type != "punc" || node.kind == "prefix" || node.kind == "suffix") {
      stack.push(node)
      continue
    }

    const b = stack.pop()!
    const a = stack.pop()!

    if (node.kind == "cmp") {
      if (a.type == "cmplist") {
        a.items.push(b)
        a.ops.push(node.value)
        stack.push(a)
      } else {
        stack.push({ type: "cmplist", items: [a, b], ops: [node.value] })
      }

      continue
    }

    if (node.value == ",") {
      if (a.type == "commalist") {
        a.items.push(b)
        stack.push(a)
      } else {
        stack.push({ type: "commalist", items: [a, b] })
      }

      continue
    }

    if (
      getPrecedence(node.value) == Precedence.WordInfix &&
      a.type == "commalist" &&
      a.items.length > 1
    ) {
      stack.push(a)
      a.items[a.items.length - 1] = {
        type: "op",
        kind: node.value,
        a: a.items[a.items.length - 1]!,
        b,
      }
      continue
    }

    stack.push({ type: "op", kind: node.value, a, b })
  }

  const ret = stack[0]

  if (!ret) {
    return {
      type: "error",
      reason:
        "Highly invalid expression encountered. Please contact the authors of nya; this is definitely a bug.",
    }
  }

  return ret
}
