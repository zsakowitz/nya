import "./page/index.dist.css"

try {
  if (location.href.includes("showmanifest")) {
    await import("./manifest")
  } else if (location.href.includes("showtokenized")) {
    await import("../lang/src/preview")
  } else {
    await import("./sheet/dev")
  }
} catch (e) {
  console.error(e)
  await import("./sheet/dev")
}
