import { int } from "@/lib/real"
import type { GlslValue, JsValue } from "."

export function splitRaw(value: number): [number, number] {
  const high = new Float32Array([value])[0]!
  return [high, value - high]
}

export function splitValue(value: number): GlslValue<"r64", false> {
  const [a, b] = splitRaw(value)
  return {
    type: "r64",
    list: false,
    expr: `vec2(${a.toExponential()}, ${b.toExponential()})`,
  }
}

export function splitDual(
  value: number,
  label: string,
): {
  label: string
  js: JsValue<"r64", false>
  glsl: GlslValue<"r64", false>
  display: true
} {
  const glsl = splitValue(value)
  return {
    label,
    glsl,
    js: { list: false, type: glsl.type, value: int(value) },
    display: true,
  }
}
