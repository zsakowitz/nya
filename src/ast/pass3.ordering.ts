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

    let o1 = pop()!
    if (o1.type != "punc") {
      return {
        type: "error",
        reason: `Expected operator; found '${o1.type}' (more: ${JSON.stringify(o1)}).`,
      }
    }

    if (o1.kind != "infix" && o1.kind != "pm") {
      return {
        type: "error",
        reason: `Expected infix operator; found prefix or suffix '${o1.value}' (more: ${JSON.stringify(o1)}).`,
      }
    }

    let o2
    while (
      (o2 = ops[ops.length - 1]) &&
      o2.type == "punc" &&
      (o2.kind == "infix" || o2.kind == "pm") &&
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
    if (node.type == "punc" && (node.kind == "infix" || node.kind == "pm")) {
      const b = stack.pop()!
      const a = stack.pop()!
      if (node.value == ",") {
        if (a.type == "commalist") {
          a.items.push(b)
          stack.push(a)
        } else {
          stack.push({ type: "commalist", items: [a, b] })
        }
      } else {
        stack.push({ type: "op", kind: node.value, a, b })
      }
    } else {
      stack.push(node)
    }
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
