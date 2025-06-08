import { index, type PackageId } from "#/index"
import { options } from "./field/defaults"
import { SheetFactory } from "./sheet/factory"

const factory = new SheetFactory(options)
for (const p of Object.keys(index)) {
  try {
    await factory.load(p as PackageId)
  } catch (e) {
    console.error(e instanceof Error ? e.message : e)
    process.exit()
  }
}
console.log(
  `✅ loaded ${factory.loadedScripts.size} package scripts without errors!`,
)
