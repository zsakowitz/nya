import type { Package } from "#/types"

export default {
  name: "number theory",
  label: "functions for working with integers",
  category: "number theory",
  deps: ["num/real"],
  scripts: ["numtheory-real"],
} satisfies Package
