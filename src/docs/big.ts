import { h, t } from "@/jsx"
import type { Sheet } from "@/sheet/ui/sheet"
import { PackageList, secPackagesContents } from "./list"

export function createDocs2(sheet: Sheet) {
  const pkgs = Object.values(sheet.factory.loaded).sort((a, b) =>
    a.name < b.name ? -1
    : a.name > b.name ? 1
    : 0,
  )
  const list = new PackageList(pkgs)

  return h(
    "relative grid grid-cols-[auto,1px,24rem] min-h-screen",
    h(""),
    h("fixed right-[24rem] w-px h-[calc(100%_-_2rem)] top-4 bg-[--nya-border]"),
    h(
      "overflow-y-auto fixed inset-y-0 right-0 w-96 h-full pb-4 px-4",
      h(
        "block sticky top-0 pt-4 bg-[--nya-bg] pb-2 mb-3 border-b border-[--nya-border] text-center font-semibold",
        list.with(t("packages"), (v) => {
          if (list.active) {
            v.data = `packages (${list.count} selected)`
          } else {
            v.data = "packages"
          }
        }),
      ),
      secPackagesContents(list, false),
    ),
  )
}
