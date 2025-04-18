import { builtin, index, type PackageId } from "#/index"
import { options } from "@/field/defaults"
import SRC_LOCALHOST from "./example/localhost.txt"
import SRC_STANDARD from "./example/standard.txt"
import { SheetFactory } from "./factory"

import { createDocs2 } from "@/docs"

const factory = new SheetFactory(options)

async function load(ids: string[]) {
  await Promise.all(
    ids.filter((x): x is PackageId => x in index).map((x) => factory.load(x)),
  )
}

async function loadBuiltin() {
  await load(Object.keys(builtin))
}

async function loadBy(key: string) {
  const ids = new URLSearchParams(location.search).get(key) ?? ""
  await load(ids.split(","))
}

if (globalThis.location?.search.includes("addons")) {
  await Promise.all([loadBy("addons"), loadBuiltin()])
} else if (globalThis.location?.search.includes("onlypkg")) {
  await loadBy("onlypkg")
} else {
  await loadBuiltin()
}

const IS_DEV = "NYA_DEV" in globalThis
if (IS_DEV) {
  setTimeout(async () => (await import("@/test")).runTests())
}

const sheet = factory.create()
if (globalThis.location?.href.includes("docs")) {
  document.body.appendChild(createDocs2(sheet))
} else {
  document.body.appendChild(sheet.el)
}

const src = IS_DEV ? SRC_LOCALHOST : SRC_STANDARD

src.split("\n").forEach((x) => x && sheet.list.fromString(x))
