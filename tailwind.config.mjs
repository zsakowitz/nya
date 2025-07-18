// @ts-check

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./src/**/*.{ts,postcss}", "./pkg/**/*.ts", "./lang/**/*.ts"],
  plugins: [
    (
      /** @type {import("tailwindcss/types/config").PluginAPI} */
      api,
    ) => {
      api.addVariant("any-hover", "@media (any-hover: hover)")
      api.addVariant("hover", "@media (any-hover: hover) { &:hover }")
    },
  ],
}
