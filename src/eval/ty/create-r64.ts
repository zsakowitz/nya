import type { SReal } from "@/eval/ty"
import { num } from "./create"
import { splitRaw } from "./split"

export function gl64(x: SReal) {
  const [a, b] = splitRaw(num(x))
  return `vec2(${a.toExponential()}, ${b.toExponential()})`
}
