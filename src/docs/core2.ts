import { FNS } from "@/eval/ops"
import { ALL_DOCS } from "@/eval/ops/docs"
import type { TyName } from "@/eval/ty"
import { TY_INFO } from "@/eval/ty/info"
import { CmdNum } from "@/field/cmd/leaf/num"
import { CmdWord } from "@/field/cmd/leaf/word"
import { fa } from "@/field/fa"
import { FieldInert } from "@/field/field-inert"
import type { Options } from "@/field/options"
import { b, h, hx, li, px, t } from "@/jsx"
import type { Ctx } from "@/sheet/deps"
import type { Sheet } from "@/sheet/ui/sheet"
import { faFaceSadTear } from "@fortawesome/free-regular-svg-icons/faFaceSadTear"
import { faChevronRight } from "@fortawesome/free-solid-svg-icons/faChevronRight"
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
  let which = "guides"

  const names = {
    about: secAbout(),
    guides: secGuides(list, sheet.options, sheet.scope.ctx),
    functions: functions(list, true),
    operators: functions(list, false),
  }
  const tabs = Object.keys(names).map((x) => {
    const data = tab(x, x == which)
    data.el.addEventListener("pointerdown", () => {
      which = x
      check()
    })
    data.el.addEventListener("click", () => {
      which = x
      check()
    })
    return data
  })

  const main = h(
    "relative grid grid-cols-[auto,1px,18rem] [&.nya-docs-open]:grid-cols-[auto] min-h-screen text-[--nya-text]",
    h(
      "relative block z-[0]",
      h(
        "fixed left-0 right-[calc(18rem_+_1px)] [.nya-docs-open_&]:right-0 top-0 pt-2 flex text-center bg-[--nya-bg] z-10 h-[calc(3rem_+_1px)]",
        h("border-b border-[--nya-border] w-2"),
        ...tabs.map((x) => x.el),
        h("border-b border-[--nya-border] w-2"),
      ),
      h("block w-full h-[calc(3rem_+_1px)]"),
      h(
        "flex min-h-[calc(100%_-_3rem_-_1px)] p-4 bg-[--nya-bg-sidebar]",
        ...Object.values(names),
      ),
    ),
    h("[.nya-docs-open_&]:hidden bg-[--nya-border]"),
    h(
      "[.nya-docs-open_&]:hidden overflow-y-auto fixed inset-y-0 right-0 w-[18rem] h-full pb-4 px-4 bg-[--nya-bg]",
      h(
        "block sticky top-0 pt-4 bg-[--nya-bg] pb-2 mb-3 border-b border-[--nya-border] text-center font-semibold",
        list.with(t("filter packages"), (v) => {
          if (list.active) {
            v.data = `packages (${list.count} selected)`
          } else {
            v.data = "filter packages"
          }
        }),
      ),
      secPackagesContents(list, false),
    ),
  )

  function check() {
    main.classList.toggle("nya-docs-open", which == "about")
    tabs.forEach((x) => (x.open = x.title == which))
    for (const key in names) {
      names[key as keyof typeof names].hidden = key != which
      names[key as keyof typeof names].classList.toggle("hidden", key != which)
    }
  }
  check()

  return main
}

function tabBorders() {
  return h(
    "",
    h(
      "absolute bottom-[--size] inset-x-0 top-0 border-x border-t border-[--nya-border] rounded-t-[--size]",
    ),
    h(
      "absolute bottom-0 left-full size-[--size] -translate-x-px bg-[--nya-bg-sidebar]",
    ),
    h(
      "absolute bottom-0 left-full size-[--size] -translate-x-px rounded-bl-[--size] border-b border-l border-[--nya-border] bg-[--nya-bg] [:has(+:hover)>*>&]:bg-[--nya-bg-sidebar]",
    ),
    h(
      "absolute bottom-0 right-full size-[--size] translate-x-px bg-[--nya-bg-sidebar]",
    ),
    h(
      "absolute bottom-0 right-full size-[--size] translate-x-px rounded-br-[--size] border-b border-r border-[--nya-border] bg-[--nya-bg] [:hover+*>*>&]:bg-[--nya-bg-sidebar]",
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
    el.classList.toggle("bg-[--nya-bg-sidebar]", open)
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

function functions(list: PackageList, named: boolean) {
  const raw = Object.values(FNS)
  const fns = ALL_DOCS.filter((x) => raw.includes(x as any) === named)
  fns.sort(
    (a, b) =>
      +/^[\w\s]+$/.test(b.name) - +/^[\w\s]+$/.test(a.name) ||
      (a.name < b.name ? -1
      : a.name > b.name ? 1
      : 0),
  )

  return hx(
    "table",
    "w-full h-min",
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

function secAbout() {
  return h(
    "flex flex-col gap-2 w-full max-w-prose border rounded-lg p-4 mx-auto text-[--nya-text-prose] bg-[--nya-bg] border-[--nya-border]",
    hx(
      "h2",
      "text-2xl font-semibold border-b border-[--nya-border] pb-1 mb-2 text-[--nya-text]",
      "Introduction",
    ),
    px`project nya is a graphing calculator, shader playground, unit converter, and symbolic computation tool. Its author is ${hx("a", { class: "text-blue-500 underline underline-offset-2", href: "https://github.com/@zsakowitz" }, "sakawi (she/her)")}, who tries to update it daily. All its code is available ${hx("a", { class: "text-blue-500 underline underline-offset-2", href: "https://github.com/zsakowitz/nya" }, "for free on GitHub")}.`,
    px`project nya was originally conceived as a simple replacement for Desmos with support for complex numbers (Desmos's support for them is somewhat recent, as of 2024). It has evolved slightly from that base goal. (This is an understatement.)`,
    px`project nya is designed to be extensible, so that new features can be added easily. This extensibility is why project nya can convert units, work with quaternions, provide chemical data, and plot recursive images.`,
    hx(
      "h2",
      "text-2xl font-semibold border-b border-[--nya-border] pb-1 my-2 text-[--nya-text]",
      "How to use it",
    ),
    px`The best idea is just to experiment! Type something, see what happens, edit it, and repeat. Or use the geometry tools at the top, which will help you construct geometrical objects.`,
    px`Additionally, check out the ${b("guides")} tab. It has more specific guides about how to do recursion, construct geometrical objects, perform symbolic calculus, write in binary and hexadecimal, and more.`,
    px`For an information overload, click the ${b("functions")} tab. It lists every function project nya supports, what it does, and what data types it works with, and will give you detailed information if you click the function entry. The ${b("operators")} tab is equivalent, but lists operators instead of named functions.`,
    subsecPackages(),
  )

  function subsecPackages() {
    return h(
      "flex flex-col gap-2",
      hx(
        "h2",
        "text-2xl font-semibold border-b border-[--nya-border] pb-1 my-2 text-[--nya-text]",
        "The package system",
      ),
      px`Warning: this may be incredibly boring. However, this is my website, and I am very proud of the package system, so I am allowed to infodump about it.`,
      px`project nya is essentially split into two parts: the core, and the packages. The core contains 1) a subset of the LaTeX renderer, 2) limited parts of the math evaluator, and 3) a definition of how the full app and graphpaper works.`,
      px`That core library is basically a scaffold for the app, but it doesn't really have any content. If only the core library existed, project nya wouldn't know "sin" should be deitalicized, it would forget what an integer is, and typing math wouldn't even show the result.`,
      px`All of ${h("italic", "that")} stuff exists solely within packages, small bits of code which provide small bits of functionality. The key point about packages is that they are easily composable: just stack one on top of the other, and they all will magically Just Work™ together.`,
      px`That's what the ${b("packages")} thing on the right is! It's a list of every package loaded into project nya, so that you can more easily filter the help menu.`,
      px`Here are some things packages do now:`,
      hx(
        "ul",
        "list-disc pl-6 *:pl-2",
        li`allow you to type in hexadecimal`,
        li`add support for tiny notes in the expression list`,
        li`put gridlines on the graphpaper`,
        li`define statistical distributions`,
        li`write in calligraphic text`,
      ),
      px`Here are some things you could make a package do:`,
      hx(
        "ul",
        "list-disc pl-6 *:pl-2",
        li`embed Photoshop into project nya`,
        li`capture a livestream into a constantly updating image`,
        li`compute regressions using Desmos`,
        li`enable collaborative editing on a graph`,
        li`stream your camera directly to the canvas`,
      ),
      px`Basically, packages let project nya split its functionality into many little parts, and anybody can write their own package.`,
      px`Thanks for listening!`,
    )
  }
}

function secGuides(list: PackageList, options: Options, ctx: Ctx) {
  const guides = list.packages
    .flatMap((x) => (x.docs ? x.docs : []).map((v) => [v, x.id] as const))
    .sort(([a], [b]) =>
      a.name < b.name ? -1
      : a.name > b.name ? 1
      : 0,
    )
    .map(([v, x]) => {
      // FIXME: sections are collapsible
      // FIXME: ToC as sidebar

      const el = hx(
        "details",
        "border border-transparent rounded-lg text-[--nya-text-prose] open:bg-[--nya-bg] open:border-[--nya-border] open:-mt-2",
        hx(
          "summary",
          "list-none text-2xl font-semibold text-[--nya-text] select-none [[open]>&]:pt-2 px-4",
          h(
            "flex items-center gap-2 w-full [[open]>*>&]:border-b border-[--nya-border] [[open]>*>&]:pb-1",
            fa(
              faChevronRight,
              "size-4 fill-[--nya-title] [[open]>*>*>&]:rotate-90",
            ),
            v.name,
          ),
        ),
        h("flex flex-col gap-4 p-4 pt-2", ...v.render()),
      )

      list.on(() => {
        el.classList.toggle("hidden", list.active ? !list.has(x) : false)
      })

      return {
        el,
        get hidden() {
          return list.active ? !list.has(x) : false
        },
      }
    })

  const allHidden = () => guides.every((x) => x.hidden)

  const el = h(
    "flex flex-col gap-4 w-full max-w-prose mx-auto",
    ...guides.map((x) => x.el),
    list.with(
      h(
        "m-auto flex flex-col",
        fa(faFaceSadTear, "size-8 fill-[--nya-title] mx-auto mb-4"),
        hx(
          "p",
          "w-full max-w-96 text-[--nya-text-prose]",
          "There are no in-depth guides available for the packages you have selected. Try deselecting some packages.",
        ),
      ),
      (v) => v.classList.toggle("hidden", !allHidden()),
    ),
  )

  el.querySelectorAll("samp").forEach((el) => {
    const field = new FieldInert(options, ctx)
    field.typeLatex(el.textContent ?? "")
    el.replaceWith(field.el)
  })

  return el
}
