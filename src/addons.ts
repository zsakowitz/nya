import { addons } from "#/index"
import { manifest } from "#/manifest/data"
import type { PackageIndex } from "#/manifest/types"
import { makeDocName } from "./docs/util"
import { h, hx } from "./jsx"

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

const els = pkgs
  .sort(([, a], [, b]) =>
    a < b ? -1
    : a > b ? 1
    : 0,
  )
  .map(([id, name, colorL, colorM, colorD, label, index]) => {
    const el = hx(
      "button",
      {
        class:
          "grid grid-cols-2 grid-rows-[auto,auto] bg-[--nya-bg] border border-[--nya-border] text-[--d] px-3 py-2 rounded-lg text-[--nya-text-prose] gap-x-2 text-left" +
          (has(id) ? " nya-sx" : ""),
        style: `--l:${colorL};--m:${colorM};--d:${colorD}`,
      },
      h("row-1 col-[1] text-[--nya-text] text-lg font-semibold", name),
      h("row-2 col-[1] text-[--nya-title]", label),
      h(
        "col-[2] row-[1/3] text-lg",
        ...fns
          .filter((x) => x[1][2].includes(index as PackageIndex))
          .map((x) => makeDocName(x[0])),
      ),
    )

    el.addEventListener("click", () => {
      set(id, !has(id))
      el.classList.toggle("nya-sx", has(id))
    })

    return el
  })

document.body.classList.add("p-4")
document.body.appendChild(h("flex flex-col gap-2 max-w-3xl mx-auto", ...els))
