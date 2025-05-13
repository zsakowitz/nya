import geometry from "../../examples/geometry.nya"
import complex from "../../examples/test.nya"

export const source = complex.replace(/assert.+/g, "") + "\n\n" + geometry
