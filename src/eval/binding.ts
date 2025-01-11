import type { Node, Var } from "./ast/token"
import { subscript } from "./text"

const encoder = new TextEncoder()

function hex(text: string) {
  const bytes = encoder.encode(text)
  let ret = ""
  for (let i = 0; i < bytes.length; i++) {
    ret += "0123456789abcdef"[Math.floor(bytes[i]! / 16)]
    ret += "0123456789abcdef"[bytes[i]! % 16]
  }
  return ret
}

export class Bindings<T> {
  static id(name: Var) {
    return hex(name.value) + (name.sub ? "_" + hex(subscript(name.sub)) : "")
  }

  constructor(
    private data: Record<string, T | undefined> = Object.create(null),
  ) {}

  get(name: Var): T | undefined {
    return this.data[Bindings.id(name)]
  }

  with<U>(name: Var, value: T, fn: () => U): U {
    const id = Bindings.id(name)
    const oldValue = this.data[id]
    this.data[id] = value
    try {
      return fn()
    } finally {
      this.data[id] = oldValue
    }
  }
}

export function parseBindingVar(node: Node): [Var, Node] {
  if (
    !(
      node.type == "cmplist" &&
      node.items.length == 2 &&
      node.ops.length == 1 &&
      node.ops[0]?.dir == "=" &&
      !node.ops[0].neg &&
      node.items[0]?.type == "var" &&
      node.items[0].kind == "var" &&
      !node.items[0].sup &&
      node.items[1]
    )
  ) {
    throw new Error("A 'with' statement looks like 'with a = 3'.")
  }

  return [node.items[0], node.items[1]]
}
