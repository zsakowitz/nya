import "./page/index.dist.css"

try {
  if (location.href.includes("showmanifest")) {
    await import("./manifest")
  } else if (location.href.includes("showtokenized")) {
    await import("../lang/src/token")
  } else {
    await import("./sheet/dev")
  }
} catch {
  await import("./sheet/dev")
}
