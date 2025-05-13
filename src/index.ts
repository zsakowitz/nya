import "./page/index.dist.css"

if (location.href.includes("nyalang")) {
  await import("../lang/src/preview")
} else {
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
}
