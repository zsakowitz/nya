// @ts-check

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./src/**/*.{ts,postcss}", "./pkg/**/*.ts", "./lang/**/*.ts"],
  plugins: [
    (
      /** @type {import("tailwindcss/types/config").PluginAPI} */
      api,
    ) => {
      api.matchVariant(
        "picking",
        (v) =>
          v
            .split(",")
            .map((v) =>
              v == "" ?
                ":where(.nya-svg-display[data-nya-picking]) &"
              : `:where(.nya-svg-display[data-nya-picking~="${api.e(v)}"]) &`,
            ),
        {
          values: {
            any: "",
            point: "point32,point64",
            line: "line,point32,point64",
            ray: "ray,point32,point64",
            segment: "segment,point32,point64",
            vector: "vector",
            polygon: "polygon",
            circle: "circle,point32,point64",
            angle: "angle",
            directedangle: "directedangle",
            arc: "arc,point32,point64",
          },
        },
      )

      api.addVariant("any-hover", "@media (any-hover: hover)")
      api.addVariant("hover", "@media (any-hover: hover) { &:hover }")
    },
  ],
}
