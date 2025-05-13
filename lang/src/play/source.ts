import geometry from "../../examples/geometry.nya"
import complex from "../../examples/test.nya"

export const source = geometry + "\n\n" + complex.replace(/assert.+/g, "")
