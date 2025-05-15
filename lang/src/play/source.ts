import complex from "../../examples/complex.nya"
import geometry from "../../examples/geometry.nya"
import lngamma from "../../examples/lngamma.nya"
import withcv from "../../examples/withcv.nya"

export const source =
  complex.replace(/assert.+/g, "") + "\n" + lngamma + "\n\n" + geometry

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
