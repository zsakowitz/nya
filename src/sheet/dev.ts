import { all, manifest, type ManifestKey } from "#/manifest"
import { options } from "@/field/defaults"
import SRC_LOCALHOST from "./example/localhost.txt"
import SRC_STANDARD from "./example/standard.txt"
import { SheetFactory } from "./factory"

import { createDocs2 } from "@/docs"

const factory = new SheetFactory(options)

if (globalThis.location?.search.includes("onlypkg")) {
  const ids = (new URLSearchParams(location.search).get("onlypkg") ?? "").split(
    ",",
  )
  for (const id of ids) {
    if ({}.hasOwnProperty.call(manifest, id)) {
      const pkg = manifest[id as ManifestKey]
      await factory.load((await pkg()).default)
    }
  }
} else {
  for (const pkg of await all()) {
    await factory.load(pkg)
  }
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
