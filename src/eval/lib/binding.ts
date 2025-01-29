import { commalist } from "../ast/collect"
import type { Node, Var } from "../ast/token"
import { subscript } from "./text"

const encoder = new TextEncoder()

export function hex(text: string) {
  const bytes = encoder.encode(text)
  let ret = ""
  for (let i = 0; i < bytes.length; i++) {
    ret += "0123456789abcdef"[Math.floor(bytes[i]! / 16)]
    ret += "0123456789abcdef"[bytes[i]! % 16]
  }
  return ret
}

export function id(name: Pick<Var, "value" | "sub">) {
  return hex(name.value) + (name.sub ? "SUB" + hex(subscript(name.sub)) : "")
}

export function tryId(name: Pick<Var, "value" | "sub">) {
  try {
    return hex(name.value) + (name.sub ? "SUB" + hex(subscript(name.sub)) : "")
  } catch {}
}

export class Bindings<T> {
  constructor(
    private data: Record<string, T | undefined> = Object.create(null),
  ) {}

  get(id: string): T | undefined {
    return this.data[id]
  }

  withAll<U>(data: Record<string, T>, fn: () => U): U {
    const old: Record<string, PropertyDescriptor | undefined> =
      Object.create(null)
    try {
      for (const key in data) {
        old[key] = Object.getOwnPropertyDescriptor(this.data, key)
        Object.defineProperty(
          this.data,
          key,
          Object.getOwnPropertyDescriptor(data, key)!,
        )
      }
      return fn()
    } finally {
      for (const key in old) {
        const desc = old[key]
        if (desc) {
          Object.defineProperty(this.data, key, desc)
        } else {
          delete this.data[key]
        }
      }
    }
  }

  with<U>(id: string, value: T, fn: () => U): U {
    const desc = Object.getOwnPropertyDescriptor(this.data, id)
    this.data[id] = value
    try {
      return fn()
    } finally {
      if (desc) {
        Object.defineProperty(this.data, id, desc)
      } else {
        delete this.data[id]
      }
    }
  }
}

export type Binding = [id: string, contents: Node, name: string]

export type Bound = Pick<Var, "value" | "sub">

export function name(node: Bound) {
  return node.value + (node.sub ? subscript(node.sub) : "")
}

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

  return [id(node.items[0]), node.items[1], name(node.items[0])]
}

export function tryParseBindingVar(node: Node): Binding | undefined {
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
    return
  }

  return [
    id(node.items[0]),
    node.items[1],
    node.items[0].value +
      (node.items[0].sub ? subscript(node.items[0].sub) : ""),
  ]
}

export function parseUpdateVar(node: Node): Binding {
  if (
    !(
      node.type == "op" &&
      node.b &&
      node.a.type == "var" &&
      !node.a.sup &&
      node.a.kind == "var"
    )
  ) {
    throw new Error("An update expression looks like 'a->a+2'.")
  }

  return [
    id(node.a),
    node.b,
    node.a.value + (node.a.sub ? subscript(node.a.sub) : ""),
  ]
}

export function parseBindings(node: Node, f?: undefined): Binding[]
export function parseBindings<T>(node: Node, f: (node: Node) => T): T[]
export function parseBindings(node: Node, f = parseBindingVar): any[] {
  if (node.type == "group" && node.lhs == "[" && node.rhs == "]") {
    node = node.value
  }
  return commalist(node).map(f)
}

export type BindingArgs = Record<string, Node | null>

export class BindingFn {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly value: Node,
    readonly args: Node,
  ) {}
}
