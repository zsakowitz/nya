import "./page/index.dist.css"

Error.isError ??= (x) => x instanceof Error

if (location.href.includes("showmanifest")) {
  await import("./manifest")
} else {
  await import("./sheet/dev")
}
