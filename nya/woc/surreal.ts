import type { Plugin } from "!/emit/api"

export const PKG_SURREAL = {
  meta: {
    name: "surreal numbers",
    default: true,
  },
  load(api) {
    const S = api.opaque("Surreal", {
      glsl: null,
      js: "interface %% { x: ReadonlySet<%%>, y: ReadonlySet<%%> }",
    })
  },
} satisfies Plugin
