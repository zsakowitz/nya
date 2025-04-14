import { glsl, js, TXR_MAGICVAR } from "@/eval/ast/tx"
import type { Node } from "../ast/token"
import type { Deps } from "../deps"
import type { PropsGlsl } from "../glsl"
import type { PropsJs } from "../js"
import { parseBindings, parseBindingVar } from "../lib/binding"
import type { GlslValue, JsValue } from "../ty"

export function withBindingsJs(
  rhs: Node,
  seq: boolean,
  props: PropsJs,
): Record<string, JsValue> {
  if (rhs.type == "magicvar") {
    const mv = TXR_MAGICVAR[rhs.value]
    if (!mv) {
      throw new Error(`The '${rhs.value}' operator is not defined.`)
    }
    if (!mv.with) {
      throw new Error(
        `The '${rhs.value}' operator cannot be used after 'with'.`,
      )
    }
    return mv.with.js(rhs, props, seq)
  }

  const bindings = parseBindings(rhs, (node) => parseBindingVar(node, "with"))
  const result: Record<string, JsValue> = Object.create(null)

  if (seq) {
    for (const [id, node] of bindings) {
      result[id] = props.bindingsJs.withAll(result, () => js(node, props))
    }
  } else {
    for (const [id, node, name] of bindings) {
      if (id in result) {
        throw new Error(
          `Variable '${name}' declared twice. Maybe you want a 'withseq ...' clause instead of 'with ...'?`,
        )
      }
      result[id] = js(node, props)
    }
  }

  return result
}

export function withBindingsGlsl(
  rhs: Node,
  seq: boolean,
  props: PropsGlsl,
): Record<string, GlslValue> {
  if (rhs.type == "magicvar") {
    const mv = TXR_MAGICVAR[rhs.value]
    if (!mv) {
      throw new Error(`The '${rhs.value}' operator is not defined.`)
    }
    if (!mv.with) {
      throw new Error(
        `The '${rhs.value}' operator cannot be used after 'with'.`,
      )
    }
    return mv.with.glsl(rhs, props, seq)
  }

  const bindings = parseBindings(rhs, (node) => parseBindingVar(node, "with"))
  const result: Record<string, GlslValue> = Object.create(null)

  if (seq) {
    for (const [id, node] of bindings) {
      result[id] = props.bindings.withAll(result, () => glsl(node, props))
    }
  } else {
    for (const [id, node, name] of bindings) {
      if (id in result) {
        throw new Error(
          `Variable '${name}' declared twice. Maybe you want a 'withseq ...' clause instead of 'with ...'?`,
        )
      }
      result[id] = glsl(node, props)
    }
  }

  return result
}

export function bindingDeps(rhs: Node, seq: boolean, deps: Deps): string[] {
  if (rhs.type == "magicvar") {
    const mv = TXR_MAGICVAR[rhs.value]
    if (!mv) {
      throw new Error(`The '${rhs.value}' operator is not defined.`)
    }
    if (!mv.with) {
      throw new Error(
        `The '${rhs.value}' operator cannot be used after 'with'.`,
      )
    }
    return mv.with.deps(rhs, deps, seq)
  }

  const bindings = parseBindings(rhs, (node) => parseBindingVar(node, "with"))
  const bound: string[] = []

  if (seq) {
    for (const [id, node] of bindings) {
      deps.withBoundIds(bound, () => deps.add(node))
      bound.push(id)
    }
    return bound
  } else {
    for (const [, node] of bindings) {
      deps.add(node)
    }
    return bindings.map((x) => x[0])
  }
}
