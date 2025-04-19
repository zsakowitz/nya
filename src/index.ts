import "./page/index.dist.css"

try {
  if (location.href.includes("showmanifest")) {
    await import("./manifest")
  } else {
    await import("./sheet/dev")
  }
} catch {
  await import("./sheet/dev")
}
