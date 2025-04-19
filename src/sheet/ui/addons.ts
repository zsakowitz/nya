import { addons, type PackageId } from "#/index"
import { manifest } from "#/manifest/data"
import type { ManifestPackage, PackageIndex } from "#/manifest/types"
import { list } from "@/eval/ty/list"
import { makeDocName } from "../../docs/util"
import { h, hx, t } from "../../jsx"
import type { SheetFactory } from "../factory"
import type { Sheet } from "./sheet"

function allDeps(pkg: ManifestPackage) {
  const deps = new Set(pkg[6])
  let prev = 0
  while (prev != deps.size) {
    prev = deps.size
    for (const dep of deps) {
      const next = manifest.packages[dep]?.[6]
      if (next) {
        for (const dep of next) {
          deps.add(dep)
        }
      }
    }
  }
  return deps
}

export const pkgs = manifest.packages
  .map((x, i) => ({ i: i as PackageIndex, x }))
  .filter((x) => x.x[0] in addons)

function get() {
  if (!globalThis.location) return []
  const value = new URLSearchParams(location.search).get("addons")
  if (!value) return []
  return value
    .split(",")
    .filter((x) => x in addons)
    .map((n) => pkgs.find((x) => x.x[0] == n)?.i)
    .filter((x) => x != null)
    .filter((x, i, a) => a.indexOf(x) == i)
}

export function getAll() {
  const list = get()
  const deps = list
    .map((src) =>
      Array.from(allDeps(manifest.packages[src]!))
        .filter((x) => manifest.packages[x]![0] in addons)
        .map((dep) => ({ src, dep })),
    )
    .flat()
  const extras: Record<PackageIndex, PackageIndex[]> = Object.create(null)
  for (const el of list) {
    extras[el] = []
  }
  for (const { src, dep } of deps) {
    ;(extras[dep] ??= []).push(src)
  }
  return Object.entries(extras).map(([index, dependents]) => ({
    index: +index as PackageIndex,
    dependents,
    selected: list.includes(+index as PackageIndex),
  }))
}

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
      await sheet.load(id)
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

      const sideItems = fns.filter((x) =>
        x[1][2].includes(index as PackageIndex),
      )

      const MAX_ITEMS = 20

      const side = h(
        "*:!text-base/[1.15] text-base/[1.15]",
        ...sideItems
          .slice(0, MAX_ITEMS)
          .flatMap((x, i) => [
            i == 0 ? null : h("font-['Symbola']", ", "),
            makeDocName(x[0], x[1][4]),
          ]),
      )

      if (sideItems.length > MAX_ITEMS) {
        side.append(
          h("font-['Symbola']", ", "),
          makeDocName(`... (${sideItems.length - MAX_ITEMS} `),
          makeDocName("more"),
          makeDocName(")"),
        )
      }

      const reqsContent = t("")

      const reqs = h(
        "col-span-2 italic text-[--nya-text-prose] text-sm mt-2",
        "required by ",
        reqsContent,
      )

      const el = hx(
        "button",
        {
          class:
            "grid grid-cols-[40%_auto] bg-[--nya-bg] border border-[--nya-border] text-[--d] px-3 py-2 rounded-lg text-[--nya-text-prose] gap-x-4 text-left items-start" +
            (has(id) ? " nya-sx"
            : id in sheet.factory.loaded ? " nya-yx"
            : ""),
          style: `--l:${colorL};--m:${colorM};--d:${colorD}`,
        },
        head,
        side,
        reqs,
        h(
          "col-span-2 italic text-[--nya-text-prose] hidden [.nya-yx>&]:block mt-2 text-sm",
          'Reload the page to finish removing this addon. This will erase your graph; click "Copy" to copy the graph\'s contents to your clipboard before reloading.',
        ),
      )

      el.addEventListener("click", () => {
        set(id, !has(id))
        checkData()
      })

      return {
        el,
        check() {
          const self = map[index]
          const selected = self?.selected || !!self?.dependents.length
          el.classList.toggle("nya-sx", selected)
          el.classList.toggle("nya-yx", !selected && id in sheet.factory.loaded)
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
