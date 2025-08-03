import "./lib/polyfills"
import "./assets/page/index.dist.css"

Error.isError ??= (x) => x instanceof Error

const logeval = new URL(location.href).searchParams.get("logeval")

if (logeval != null) {
  const e = eval
  globalThis.eval = (x) => {
    const text = x
      .split("\n")
      .filter((x) => x && x != ";")
      .join("\n")
    try {
      const result = e(x)
      if (logeval != "errors") {
        console.log(text)
      }
      return result
    } catch (e) {
      console.error(text, "\n", e)
      throw e
    }
  }
}

if (location.href.includes("showkeyboards")) {
  await import("./field/kbd/dev/all")
} else if (location.href.includes("showmobilekeyboard")) {
  await import("./field/kbd/dev/mobile")
} else {
  await import("./sheet/dev")
}
