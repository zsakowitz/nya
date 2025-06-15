import type { Package } from "#/types"

export default {
  name: "complex number theory",
  label: "for complex numbers with integer components",
  category: "number theory",
  deps: ["num/real", "num/complex", "number-theory"],
  scripts: ["complex/number-theory"],
} satisfies Package
