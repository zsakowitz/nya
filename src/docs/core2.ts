import { FNS } from "@/eval/ops"
import { ALL_DOCS } from "@/eval/ops/docs"
import type { TyName } from "@/eval/ty"
import { TY_INFO } from "@/eval/ty/info"
import { h, hx, t } from "@/jsx"
import type { Sheet } from "@/sheet/ui/sheet"
import { PackageList, secPackagesContents } from "./list"
import { tyIcon } from "./signature"

export function createDocs2(sheet: Sheet) {
  const pkgs = Object.values(sheet.factory.loaded).sort((a, b) =>
    a.name < b.name ? -1
    : a.name > b.name ? 1
    : 0,
  )

  const raw = Object.values(FNS)
  const fns = ALL_DOCS.filter((x) => raw.includes(x as any))
  fns.sort((a, b) =>
    a.name < b.name ? -1
    : a.name > b.name ? 1
    : 0,
  )
  const ops = ALL_DOCS.filter((x) => !raw.includes(x as any))
  ops.sort((a, b) =>
    a.name < b.name ? -1
    : a.name > b.name ? 1
    : 0,
  )

  const list = new PackageList(pkgs)

  return h(
    "relative grid grid-cols-[auto,1px,24rem] min-h-screen",
    h(
      "block py-4 px-4",
      hx(
        "table",
        "w-full",
        hx(
          "thead",
          "",
          hx(
            "tr",
            "",
            hx("th", "", "name"),
            hx("th", "", "description"),
            hx("th", "", "returns"),
          ),
        ),
        hx(
          "tbody",
          "",
          ...fns.map((doc) => {
            const sources = pkgs
              .filter(
                (x) =>
                  x.eval?.fn && Object.values(x.eval.fn).includes(doc as any),
              )
              .map((x) => x.id)

            const tr = hx(
              "tr",
              "border-t border-[--nya-border]",
              hx(
                "td",
                "align-baseline font-['Times_New_Roman'] text-[1.265rem] text-[--nya-text]",
                doc.name,
              ),
              hx("td", "px-4 text-[--nya-title]", doc.label),
              hx(
                "td",
                "",
                h(
                  "inline-flex flex-wrap align-baseline pt-[2px]",
                  ...doc
                    .docs()
                    .map((x) => x.ret.type)
                    .map((x) =>
                      x.endsWith("64") ?
                        x.slice(0, -2) + "32" in TY_INFO ?
                          ((x.slice(0, -2) + "32") as TyName)
                        : x
                      : x,
                    )
                    .filter((x, i, a) => a.indexOf(x) == i)
                    .map(tyIcon),
                ),
              ),
            )

            list.on(() => {
              tr.hidden =
                list.active ? !sources.some((x) => list.has(x)) : false
            })

            return tr
          }),
        ),
      ),
    ),
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
