import complex from "../../lib/complex.nya"
import geometry from "../../lib/geometry.nya"
import lngamma from "../../lib/lngamma.nya"
import { Chunk } from "../ast/issue"
import withcv from "./base.nya"

export const source = [
  new Chunk(
    "complex.nya",
    complex.replace(/assert.+/g, (x) => " ".repeat(x.length)),
  ),
  new Chunk("lngamma.nya", lngamma),
  new Chunk("geometry.nya", geometry),
]

export const sourceWithExample = [
  ...source,
  new Chunk(
    "<example>",
    `fn main() ->latex{
  display"\\left(\${2+4},\${3+4}\\right)"
}`,
  ),
]

export const mini = withcv
  .slice("fn main() {".length, -"}\n".length)
  .trim()
  .split("\n")
  .map((x) => (x.startsWith("  ") ? x.slice(2) : x))
  .join("\n")
  .split("\n\n")
  .map((x) => x.trim())
  .map((x) => (x.endsWith(";") ? x.slice(0, -1) : x))
  .join("\n\n")
