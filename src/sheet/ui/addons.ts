import { index, type PackageId } from "#/index"
import { manifest } from "#/manifest/data"
import type { PackageIndex } from "#/manifest/types"
import { getAll, pkgs } from "@/addons"
import { list } from "@/eval/ty/list"
import { makeDocName } from "../../docs/util"
import { h, hx, t } from "../../jsx"
import type { SheetFactory } from "../factory"
import { Sheet } from "./sheet"

export function createAddons(
  _factory: SheetFactory,
  sheet: Sheet,
  onSet: () => void,
) {
  function has(id: string) {
    return (
      new URLSearchParams(location.search)
        .get("addons")
        ?.split(",")
        .includes(id) ?? false
    )
  }

  async function set(id: PackageId, on: boolean) {
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
    onSet()
    if (on) {
      const pkg = (await index[id]()).default
      await sheet.load(pkg)
    }
  }

  const fns = Object.entries(manifest.fns).flatMap(([k, v]) =>
    v.map((v) => [k, v] as const),
  )

  let data = getAll()
  let map = Object.fromEntries(data.map((x) => [x.index, x]))
  function checkData() {
    data = getAll()
    map = Object.fromEntries(data.map((x) => [x.index, x]))
    els.forEach((x) => x.check())
  }

  const els = pkgs.map(
    ({ i: index, x: [id, name, colorL, colorM, colorD, label] }) => {
      const head = h(
        "flex flex-col",
        h("row-1 col-[1] text-[--nya-text] font-semibold", name),
        h("row-2 col-[1] text-[--nya-title] text-sm", label),
      )

      const side = h(
        "*:!text-base/[1.15] text-base/[1.15]",
        ...fns
          .filter((x) => x[1][2].includes(index as PackageIndex))
          .flatMap((x, i) => [
            i == 0 ? null : h("font-['Symbola']", ", "),
            makeDocName(x[0]),
          ]),
      )

      const reqsContent = t("")

      const reqs = h(
        "col-span-2 italic text-[--nya-text-prose]",
        "required by ",
        reqsContent,
      )

      const el = hx(
        "button",
        {
          class:
            "grid grid-cols-[40%_auto] bg-[--nya-bg] border border-[--nya-border] text-[--d] px-3 py-2 rounded-lg text-[--nya-text-prose] gap-x-4 text-left items-start" +
            (has(id) ? " nya-sx" : ""),
          style: `--l:${colorL};--m:${colorM};--d:${colorD}`,
        },
        head,
        side,
        reqs,
      )

      el.addEventListener("click", () => {
        set(id, !has(id))
        checkData()
      })

      return {
        el,
        check() {
          const self = map[index]
          el.classList.toggle(
            "nya-sx",
            self?.selected || !!self?.dependents.length,
          )
          head.classList.toggle("opacity-30", !!self?.dependents.length)
          side.classList.toggle("opacity-30", !!self?.dependents.length)
          reqs.classList.toggle("hidden", !self?.dependents.length)
          if (self?.dependents) {
            reqsContent.data = list(
              self.dependents.map((id) => manifest.packages[id]![1]),
            )
          }
        },
      }
    },
  )

  checkData()

  return els.map((x) => x.el)
}
