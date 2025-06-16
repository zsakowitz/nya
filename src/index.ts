import "./page/index.dist.css"

if (location.href.includes("showmanifest")) {
  await import("./manifest")
} else {
  await import("./sheet/dev")
}
