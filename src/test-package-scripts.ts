import { index, type PackageId } from "#/index"
import { options } from "./field/defaults"
import { SheetFactory } from "./sheet/factory"

const factory = new SheetFactory(options)
a: {
  for (const p of Object.keys(index)) {
    try {
      await factory.load(p as PackageId)
    } catch (e) {
      console.error(e instanceof Error ? e.message : e)
      break a
    }
  }
  console.log(
    `✅ loaded ${factory.env.scriptCount} package scripts without errors!`,
  )
  factory.env.log("floor(2+3*i)")
}
