import SRC_LOCALHOST from "@/assets/preload/localhost.txt"
import SRC_STANDARD_2D from "@/assets/preload/standard2d.txt"
import SRC_STANDARD_3D from "@/assets/preload/standard3d.txt"
import { options } from "@/field/defaults"
import { showKeyboard } from "@/field/kbd/global"
import { builtin, type PackageId } from "@/pkg"
import { SheetFactory } from "./factory"
import { PLOT_3D } from "./plot/3d"

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

const search = new URL(location.href).searchParams

if (search.has("addons")) {
  await Promise.all([loadBy("addons"), loadBuiltin()])
} else if (search.has("onlypkg")) {
  await loadBy("onlypkg")
} else {
  await loadBuiltin()
}

const IS_DEV = "NYA_DEV" in globalThis

const sheet = factory.create()
Object.assign(globalThis, { sheet })
document.body.appendChild(sheet.el)
if (search.has("showkeyboard")) {
  setTimeout(() => {
    showKeyboard(document.querySelector(".nya-kbd-field")!.nyaField!)
  }, 100)
}

const src =
  IS_DEV ? SRC_LOCALHOST
  : PLOT_3D ? SRC_STANDARD_3D
  : SRC_STANDARD_2D

src.split("\n").forEach((x) => x && sheet.list.fromString(x))
