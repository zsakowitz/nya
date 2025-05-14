import { h } from "./jsx"
import "./page/index.dist.css"

if (location.href.includes("nyalangcv")) {
  try {
    await import("../lang/src/play/withcv")
  } catch (e) {
    document.body.appendChild(
      h(
        "p-4 block whitespace-pre-line font-mono text-sm",
        e instanceof Error ? e.message : String(e),
      ),
    )
  }
} else if (location.href.includes("nyalang")) {
  await import("../lang/src/play/preview")
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
