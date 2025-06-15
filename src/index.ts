import "./page/index.dist.css"

try {
  if (location.href.includes("showmanifest")) {
    await import("./manifest")
  } else {
    await import("./sheet/dev")
  }
} catch (e) {
  console.error(e)
  await import("./sheet/dev")
}
