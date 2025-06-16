import type { Subprocess } from "bun"
import { watch } from "node:fs"

let spawned: Subprocess | undefined
const url = new URL("../nya", import.meta.url)
console.log(url.pathname)
watch(url.pathname, { recursive: true }, () => {
  spawned?.kill()
  spawned = Bun.spawn({
    cmd: ["bun", new URL("./scripts/index.ts", import.meta.url).pathname],
    stdout: "pipe",
    stderr: "pipe",
  })
})
spawned = Bun.spawn({
  cmd: ["bun", new URL("./scripts/index.ts", import.meta.url).pathname],
  stdout: "pipe",
  stderr: "pipe",
})
