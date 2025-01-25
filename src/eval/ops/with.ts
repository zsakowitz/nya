import type { Node } from "../ast/token"
import type { DepTracker } from "../deps"
import { glsl, type PropsGlsl } from "../glsl"
import { js, type PropsJs } from "../js"
import { parseBindings } from "../lib/binding"
import type { GlslValue, JsValue } from "../ty"
import {
  isIterate,
  iterateDeps,
  iterateGlsl,
  iterateJs,
  parseIterate,
} from "./iterate"

export function withBindingsJs(
  rhs: Node,
  seq: boolean,
  props: PropsJs,
): Record<string, JsValue> {
  if (isIterate(rhs)) {
    const parsed = parseIterate(rhs, { source: seq ? "withseq" : "with" })
    return iterateJs(parsed, { eval: props, seq }).data
  }

  const bindings = parseBindings(rhs)
  const result: Record<string, JsValue> = Object.create(null)

  if (seq) {
    for (const [id, node] of bindings) {
      result[id] = props.bindings.withAll(result, () => js(node, props))
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
  if (isIterate(rhs)) {
    const parsed = parseIterate(rhs, { source: seq ? "withseq" : "with" })
    return iterateGlsl(parsed, { eval: props, seq }).data
  }

  const bindings = parseBindings(rhs)
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

export function withBindingsDeps(
  rhs: Node,
  seq: boolean,
  deps: DepTracker,
): string[] {
  if (isIterate(rhs)) {
    const parsed = parseIterate(rhs, { source: seq ? "withseq" : "with" })
    return iterateDeps(parsed, deps)
  }

  const bindings = parseBindings(rhs)
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
