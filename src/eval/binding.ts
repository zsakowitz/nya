import { commalist } from "./ast/collect"
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

export function id(name: Var) {
  return hex(name.value) + (name.sub ? "_" + hex(subscript(name.sub)) : "")
}

export class Bindings<T> {
  constructor(
    private data: Record<string, T | undefined> = Object.create(null),
  ) {}

  get(id: string): T | undefined {
    return this.data[id]
  }

  withAll<U>(data: Record<string, T>, fn: () => U): U {
    const old: Record<string, T | undefined> = {}
    try {
      for (const key in data) {
        old[key] = this.data[key]
        this.data[key] = data[key]
      }
      return fn()
    } finally {
      for (const key in old) {
        this.data[key] = old[key]
      }
    }
  }

  with<U>(id: string, value: T, fn: () => U): U {
    const oldValue = this.data[id]
    this.data[id] = value
    try {
      return fn()
    } finally {
      this.data[id] = oldValue
    }
  }
}

export type Binding = [id: string, contents: Node, name: string]

export function parseBindingVar(node: Node): Binding {
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

  return [
    id(node.items[0]),
    node.items[1],
    node.items[0].value +
      (node.items[0].sub ? subscript(node.items[0].sub) : ""),
  ]
}

export function parseBindingVars(node: Node): Binding[] {
  if (node.type == "group" && node.lhs == "[" && node.rhs == "]") {
    node = node.value
  }
  return commalist(node).map(parseBindingVar)
}
