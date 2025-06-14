import type { Package } from "#/types"

export default {
  name: "color functions extended",
  label: "more functions for creating colors",
  category: "color",
  deps: ["color/core"],
  scripts: ["color/extras"],
} satisfies Package
