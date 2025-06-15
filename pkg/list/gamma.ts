import type { Package } from "#/types"

export default {
  name: "gamma functions",
  label: "functions related to the factorial and its derivative",
  category: "numbers",
  deps: ["core/ops", "num/complex", "factorial"],
  scripts: ["gamma/gamma", "gamma/lngamma", "gamma/digamma"],
} satisfies Package
