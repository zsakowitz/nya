try {
  await import("./scan") // scan to build the script index
  await import("./predefined-packages") // find which scripts define packages
  await import("./check") // check all scripts
  // await Bun.$`bun pkg/manifest/generate.ts > pkg/manifest/data.json`
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
}
