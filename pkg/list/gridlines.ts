export default {
  name: "gridlines",
  label: "draws a numbered grid below the graphs",
  category: "miscellaneous",
  deps: [],
  init: {
    intents: ["add a numbered grid below the graphpaper"],
    fn(sheet) {
      createDrawAxes(sheet.cv)
    },
  },
} satisfies Package
