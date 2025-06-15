import type { Package } from "#/types"

export default {
  name: "hyperbolic trig (complexes)",
  label: "hyperbolic trig on complex numbers",
  category: "trigonometry",
  deps: ["num/complex"],
  scripts: ["complex-trig-hyperbolic"],
} satisfies Package
