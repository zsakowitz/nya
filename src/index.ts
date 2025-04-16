try {
  if (location.href.includes("showmanifest")) {
    await import("./manifest")
  } else if (location.href.includes("showaddons")) {
    await import("./addons")
  } else {
    await import("./sheet/dev")
  }
} catch {
  await import("./sheet/dev")
}
