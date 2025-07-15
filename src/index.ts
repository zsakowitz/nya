import "./page/index.dist.css"

Error.isError ??= (x) => x instanceof Error

if (new URL(location.href).searchParams.has("logeval")) {
  const e = eval
  globalThis.eval = (x) => (console.log(x), e(x))
}

if (location.href.includes("showmanifest")) {
  await import("./manifest")
} else if (location.href.includes("showkeyboards")) {
  await import("./keyboard/dev/all")
} else if (location.href.includes("showmobilekeyboard")) {
  await import("./keyboard/dev/mobile")
} else {
  await import("./sheet/dev")
}
