import type { Package } from "#/types"

export default {
  name: "complex trig",
  label: null,
  category: "trigonometry",
  deps: ["trig/real", "num/complex"],
  scripts: ["complex-trig"],
} satisfies Package
