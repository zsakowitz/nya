import { addons } from "#/index"
import { manifest } from "#/manifest/data"
import type { PackageIndex } from "#/manifest/types"
import { makeDocName } from "./docs/util"
import { h, hx } from "./jsx"
import type { SheetFactory } from "./sheet/factory"
import type { Sheet } from "./sheet/ui/sheet"

export function createAddons(_factory: SheetFactory, _sheet: Sheet) {
  const pkgs = manifest.packages
    .map((x, i) => [...x, i] as const)
    .filter((x) => x[0] in addons)

  function has(id: string) {
    return (
      new URLSearchParams(location.search)
        .get("addons")
        ?.split(",")
        .includes(id) ?? false
    )
  }

  function set(id: string, on: boolean) {
    const params = new URLSearchParams(location.search)
    const addons = new Set(params.get("addons")?.split(",") ?? [])
    if (on) {
      addons.add(id)
    } else {
      addons.delete(id)
    }
    const value = [...addons].join(",")
    if (value) {
      params.set("addons", value)
    } else {
      params.delete("addons")
    }
    history.replaceState(
      {},
      "",
      location.origin + (params.toString() ? "?" + params : ""),
    )
  }

  const fns = Object.entries(manifest.fns).flatMap(([k, v]) =>
    v.map((v) => [k, v] as const),
  )

  const els = pkgs.map(([id, name, colorL, colorM, colorD, label, index]) => {
    const el = hx(
      "button",
      {
        class:
          "grid grid-cols-[40%_auto] bg-[--nya-bg] border border-[--nya-border] text-[--d] px-3 py-2 rounded-lg text-[--nya-text-prose] gap-x-4 text-left items-start" +
          (has(id) ? " nya-sx" : ""),
        style: `--l:${colorL};--m:${colorM};--d:${colorD}`,
      },
      h(
        "flex flex-col",
        h("row-1 col-[1] text-[--nya-text] font-semibold", name),
        h("row-2 col-[1] text-[--nya-title] text-sm", label),
      ),
      h(
        "*:!text-base/[1.15] text-base/[1.15]",
        ...fns
          .filter((x) => x[1][2].includes(index as PackageIndex))
          .flatMap((x, i) => [
            i == 0 ? null : h("font-['Symbola']", ", "),
            makeDocName(x[0]),
          ]),
      ),
    )

    el.addEventListener("click", () => {
      set(id, !has(id))
      el.classList.toggle("nya-sx", has(id))
    })

    return el
  })

  return els
}
