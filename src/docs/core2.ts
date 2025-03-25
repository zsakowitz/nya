import { FNS } from "@/eval/ops"
import { ALL_DOCS } from "@/eval/ops/docs"
import type { TyName } from "@/eval/ty"
import { TY_INFO } from "@/eval/ty/info"
import { CmdNum } from "@/field/cmd/leaf/num"
import { CmdWord } from "@/field/cmd/leaf/word"
import { h, hx, t } from "@/jsx"
import type { Sheet } from "@/sheet/ui/sheet"
import { PackageList, secPackagesContents } from "./list"
import { tyIcon } from "./signature"

function makeDocName(name: string) {
  return h(
    "font-['Symbola'] text-[1.265rem]/[1.15]",
    /^(?:\p{L}+|\p{L}[\p{L}\s]+\p{L}|\.\p{L})$/u.test(name) ?
      new CmdWord(name, undefined, /^[a-z]$/.test(name)).el
    : new CmdNum(name).el,
  )
}

export function createDocs2(sheet: Sheet) {
  const pkgs = Object.values(sheet.factory.loaded).sort((a, b) =>
    a.name < b.name ? -1
    : a.name > b.name ? 1
    : 0,
  )

  const list = new PackageList(pkgs)
  let which = "functions"

  const names = ["overview", "functions", "operators"]
  const tabs = names.map((x) => {
    const data = tab(x, x == which)
    data.el.addEventListener("pointerdown", () => {
      which = x
      tabs.forEach((x) => (x.open = x.title == which))
    })
    return data
  })

  const fns = allFunctions(list)

  return h(
    "relative grid grid-cols-[auto,1px,24rem] min-h-screen text-[--nya-text]",
    h(
      "relative block pb-4 z-[0]",
      h(
        "fixed left-0 right-[calc(24rem_+_1px)] top-0 pt-2 flex text-center bg-[--nya-bg] z-10 h-[calc(3rem_+_1px)]",
        h("border-b border-[--nya-border] w-2"),
        ...tabs.map((x) => x.el),
        h("border-b border-[--nya-border] w-2"),
      ),
      h("block w-full h-[calc(3rem_+_1px)]"),
      h("block p-4", fns),
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

function tabBorders() {
  return h(
    "",
    h(
      "absolute bottom-[--size] inset-x-0 top-0 border-x border-t border-[--nya-border] rounded-t-[--size]",
    ),
    h(
      "absolute bottom-0 left-full size-[--size] -translate-x-px bg-[--nya-bg] [:hover>*>&]:bg-[--nya-bg-sidebar]",
    ),
    h(
      "absolute bottom-0 left-full size-[--size] -translate-x-px rounded-bl-[--size] border-b border-l border-[--nya-border] [:hover>*>&]:bg-[--nya-bg] [:has(+:hover)>*>&]:bg-[--nya-bg-sidebar]",
    ),

    h(
      "absolute bottom-0 right-full size-[--size] translate-x-px bg-[--nya-bg] [:hover>*>&]:bg-[--nya-bg-sidebar]",
    ),
    h(
      "absolute bottom-0 right-full size-[--size] translate-x-px rounded-br-[--size] border-b border-r border-[--nya-border] [:hover>*>&]:bg-[--nya-bg] [:hover+*>*>&]:bg-[--nya-bg-sidebar]",
    ),
  )
}

function tab(title: string, open: boolean) {
  const borders = tabBorders()

  const el = hx(
    "button",
    "py-2 font-semibold relative [--size:.5rem] border-[--nya-border] hover:bg-[--nya-bg-sidebar] rounded-t-[--size] -ml-px first:ml-0 px-6 flex-1",
    title,
    borders,
  )

  function check() {
    borders.hidden = !open
    el.classList.toggle("pb-[calc(0.5rem_+_1px)]", open)
    el.classList.toggle("border-b", !open)
    el.classList.toggle("z-10", open)
  }
  check()

  return {
    el,
    title,
    set open(v: boolean) {
      open = v
      check()
    },
  }
}

function allFunctions(list: PackageList) {
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

  return hx(
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
      ...[...fns, ...ops].map((doc) => {
        const sources = list.packages
          .filter(
            (x) => x.eval?.fn && Object.values(x.eval.fn).includes(doc as any),
          )
          .map((x) => x.id)

        const tr = hx(
          "tr",
          "border-t border-[--nya-border]",
          hx(
            "td",
            "align-baseline font-['Times_New_Roman'] text-[1.265rem] text-[--nya-text] whitespace-nowrap",
            makeDocName(doc.name),
          ),
          hx("td", "align-baseline px-4 py-1 text-[--nya-title]", doc.label),
          hx(
            "td",
            "pt-[2px]",
            h(
              "inline-flex flex-wrap",
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
          tr.hidden = list.active ? !sources.some((x) => list.has(x)) : false
        })

        return tr
      }),
    ),
  )
}
