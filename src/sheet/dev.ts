import { options } from "@/field/defaults"
import SRC_LOCALHOST from "./example/localhost.txt"
import SRC_STANDARD from "./example/standard.txt"
import { SheetFactory } from "./factory"

import { all } from "#/manifest"
import { createDocs2 } from "@/docs"

const LOAD_EMPTY = false
const SHORT_EXPRS = true

const factory = new SheetFactory(options)

const IS_DEV = "NYA_DEV" in globalThis
if (!(LOAD_EMPTY && IS_DEV)) {
  for (const pkg of await all()) {
    await factory.load(pkg)
  }
}
if (IS_DEV) {
  setTimeout(async () => (await import("@/test")).runTests())
}

const sheet = factory.create()
if (globalThis.location?.href.includes("docs")) {
  document.body.appendChild(createDocs2(sheet))
} else {
  document.body.appendChild(sheet.el)
}

const src = SHORT_EXPRS && IS_DEV ? SRC_LOCALHOST : SRC_STANDARD

src.split("\n").forEach((x) => x && sheet.list.fromString(x))
