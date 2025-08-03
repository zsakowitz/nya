import SRC_LOCALHOST from "@/assets/example/localhost.txt"
import SRC_STANDARD from "@/assets/example/standard.txt"
import { options } from "@/field/defaults"
import { builtin, type PackageId } from "@/pkg"
import { SheetFactory } from "./factory"

import { showKeyboard } from "@/field/kbd/global"

const factory = new SheetFactory(options)

async function load(ids: string[]) {
  for (const id of ids) {
    await factory.load(id as PackageId)
  }
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

const sheet = factory.create()
Object.assign(globalThis, { sheet })
document.body.appendChild(sheet.el)
if (globalThis.location?.href.includes("showkeyboard")) {
  setTimeout(() => {
    showKeyboard(document.querySelector(".nya-kbd-field")!.nyaField!)
  }, 100)
}

const src = IS_DEV ? SRC_LOCALHOST : SRC_STANDARD

src.split("\n").forEach((x) => x && sheet.list.fromString(x))
