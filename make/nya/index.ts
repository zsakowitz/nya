import { errorText } from "@/lib/error"
import "../../lib/woc/surreal" // so `bun --watch` works on it

try {
  await import("./scan")
  await import("./predefined-packages")
  await import("./check")
} catch (e) {
  console.error(errorText(e))
}
