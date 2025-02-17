import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { faCaretRight } from "@fortawesome/free-solid-svg-icons/faCaretRight"
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck"
import { faFolderClosed } from "@fortawesome/free-solid-svg-icons/faFolderClosed"
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons/faFolderOpen"
import { FNS } from "../../../eval/ops"
import { icon } from "../../../eval/ops/dist"
import { ALL_DOCS } from "../../../eval/ops/docs"
import { VARS } from "../../../eval/ops/vars"
import type { Type } from "../../../eval/ty"
import { frac } from "../../../eval/ty/create"
import { Display } from "../../../eval/ty/display"
import { any, TY_INFO } from "../../../eval/ty/info"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdNum } from "../../../field/cmd/leaf/num"
import { OpRightArrow } from "../../../field/cmd/leaf/op"
import { CmdWord } from "../../../field/cmd/leaf/word"
import { CmdPiecewise } from "../../../field/cmd/logic/piecewise"
import { CmdBrack } from "../../../field/cmd/math/brack"
import { CmdSupSub } from "../../../field/cmd/math/supsub"
import { fa } from "../../../field/fa"
import { Block, R } from "../../../field/model"
import { a, h, hx } from "../../../jsx"
import type { Package } from "../../../pkg"

export function btn(
  icon: IconDefinition,
  label: Node | string,
  action: () => void,
) {
  const el = hx(
    "button",
    "flex flex-col h-full aspect-square [line-height:1] hover:bg-[--nya-sidebar-hover] hover:text-[--nya-title-dark] rounded",
    h(
      "flex flex-col m-auto",
      fa(icon, "mx-auto size-5 fill-current"),
      h("text-[80%]/[.5] mt-1.5 lowercase", label),
    ),
  )
  el.addEventListener("click", action)
  return el
}

export function createDocs(hide: HTMLElement, packages: Package[]) {
  const el = h(
    "flex flex-col overflow-y-auto px-4 pb-4 gap-2 [&_p+p]:-mt-2",
    secCredits(),
    secPackages(packages),
    secDataTypes(),
    secShaders(),
    secAdvancedOperators(),
    secNamedVariables(),
    secNamedFunctions(),
    secUnnamedFunctions(),
    secChangelog(),
  )

  return h(
    "flex flex-col border-r border-[--nya-border] hidden row-span-2",
    h(
      "w-full p-1 h-12 min-h-12 max-h-12 flex bg-[--nya-bg-sidebar] border-b border-[--nya-border] text-center text-[--nya-title] z-10 font-['Symbola']",
      btn(faFolderOpen, "all", () => {
        el.querySelectorAll("details").forEach((x) => (x.open = true))
      }),
      btn(faFolderClosed, "none", () => {
        el.querySelectorAll("details").forEach((x) => (x.open = false))
      }),
      h("m-auto text-2xl", "project nya"),
      hide,
    ),
    el,
  )
}

function secPackages(packages: Package[]) {
  const els = packages
    .sort((a, b) =>
      a.name < b.name ? -1
      : a.name > b.name ? 1
      : a.id < b.id ? -1
      : a.id > b.id ? 1
      : 0,
    )
    .map((pkg) => {
      const field = hx("input", { type: "checkbox", class: "sr-only" })
      return hx(
        "label",
        "flex gap-2 items-center",
        field,
        h(
          "size-4 border border-[--nya-border] rounded [:checked+&]:bg-[--nya-expr-focus] [:checked+&]:border-transparent flex",
          fa(faCheck, "size-3 fill-current m-auto hidden [:checked+*_&]:block"),
        ),
        h(
          "font-semibold",
          pkg.name,
          pkg.label &&
            h("text-[--nya-title-dark] text-sm pl-4 font-normal", pkg.label),
        ),
      )
    })

  return section(
    `packages (${packages.length})`,
    h("flex flex-col", ...els),
    true,
  )
}

function makeDocName(name: string) {
  return h(
    "font-['Symbola'] text-[1.265rem]/[1.15]",
    /^(?:\p{L}+|\p{L}[\p{L}\s]+\p{L}|\.\p{L})$/u.test(name) ?
      new CmdWord(name, undefined, /^[a-z]$/.test(name)).el
    : new CmdNum(name).el,
  )
}

function makeDoc(fn: { name: string; label: string; docs(): Node[] }) {
  const nodes = fn.docs()
  if (nodes.length == 0) return null

  return h(
    "flex flex-col",
    makeDocName(fn.name),
    h("text-sm leading-tight text-slate-500", fn.label),
    h("flex flex-col pl-4 mt-1", ...nodes),
  )
}

function title(label: string) {
  return hx(
    "summary",
    "[[open]_&]:sticky top-0 z-10 bg-[--nya-bg] pt-2 list-none",
    h(
      "flex bg-[--nya-bg-sidebar] border border-[--nya-border] -mx-2 rounded-lg px-2 pt-1 font-['Symbola'] text-[1.265rem] text-center items-center",
      h(
        "",
        fa(
          faCaretRight,
          "size-4 fill-[--nya-title] -mt-1 [[open]_&]:rotate-90 transition-transform",
        ),
      ),
      h("flex-1", label),
    ),
  )
}

function section(label: string, data: Node | (Node | null)[], open?: boolean) {
  return hx(
    "details",
    {
      class: "flex flex-col gap-4 -mb-6 open:-mb-2",
      open: open ? "open" : null,
    },
    title(label),
    h("flex flex-col gap-4 pb-2", ...(Array.isArray(data) ? data : [data])),
  )
}

function secAdvancedOperators() {
  let q

  return section("advanced operators", [
    // with
    h(
      "flex flex-col",
      h(
        "text-[1.265rem]/[1.15]",
        h(
          "font-['Symbola']",
          CmdBrack.render("(", ")", null, {
            el: h(
              "",
              any(),
              new CmdWord("with", "infix").el,
              new CmdWord("a", undefined, true).el,
              new OpEq(false).el,
              any("text-[#2d70b3]"),
            ),
          }),
          new OpRightArrow().el,
          any(),
        ),
      ),
      h(
        "text-sm leading-tight text-slate-500",
        "evaluates <left side> with <a> set to <right side>",
      ),
    ),
    // base
    TY_INFO.r32 ?
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Symbola']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                any(),
                new CmdWord("base", "infix").el,
                TY_INFO.r32?.icon(),
              ),
            }),
            new OpRightArrow().el,
            any(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "interprets <left side> as being in base <right side>",
        ),
      )
    : null,
    // piecewise
    TY_INFO.bool ?
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Symbola']",
            CmdPiecewise.render([
              { el: any() },
              { el: TY_INFO.bool?.icon() },
              { el: any() },
              { el: TY_INFO.bool?.icon() },
              { el: any() },
              { el: (q = h("")) },
            ]),
            (q.parentElement?.classList.add("nya-has-empty"),
            new OpRightArrow().el),
            any(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "piecewise function; returns the first value whose “if” condition is true",
        ),
      )
    : null,
    ...(TY_INFO.r32 ?
      [
        // iterate
        h(
          "flex flex-col",
          h(
            "text-[1.265rem]/[1.15]",
            h(
              "font-['Symbola']",
              CmdBrack.render("(", ")", null, {
                el: h(
                  "",
                  new CmdWord("iterate", "prefix").el,
                  CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                  new CmdWord("a", undefined, true).el,
                  new OpRightArrow().el,
                  TY_INFO.r32?.icon(),
                ),
              }),
              new OpRightArrow().el,
              TY_INFO.r32?.icon(),
            ),
          ),
          h(
            "text-sm leading-tight text-slate-500",
            "sets <a> to some expression 50 times, starting with a=0, then returns <a>",
          ),
        ),
        h(
          "flex flex-col",
          h(
            "text-[1.265rem]/[1.15]",
            h(
              "font-['Symbola']",
              CmdBrack.render("(", ")", null, {
                el: h(
                  "",
                  new CmdWord("iterate", "prefix").el,
                  CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                  new CmdWord("a", undefined, true).el,
                  new OpRightArrow().el,
                  any(),
                  new CmdWord("from", "infix").el,
                  any(),
                ),
              }),
              new OpRightArrow().el,
              any(),
            ),
          ),
          h(
            "text-sm leading-tight text-slate-500",
            "sets <a> to some expression 50 times, starting with the expression after the word “from”, then returns <a>",
          ),
        ),
        h(
          "flex flex-col",
          h(
            "text-[1.265rem]/[1.15]",
            h(
              "font-['Symbola']",
              CmdBrack.render("(", ")", null, {
                el: h(
                  "",
                  new CmdWord("iterate", "prefix").el,
                  CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                  new CmdWord("a", undefined, true).el,
                  new OpRightArrow().el,
                  TY_INFO.r32?.icon(),
                  new CmdWord("while", "infix").el,
                  TY_INFO.bool?.icon(),
                ),
              }),
              new OpRightArrow().el,
              TY_INFO.r32?.icon(),
            ),
          ),
          h(
            "text-sm leading-tight text-slate-500",
            "sets <a> to some expression 50 times, starting with a=0, then returns <a>; if the “while” clause is ever false, returns <a> immediately",
          ),
        ),
        h(
          "flex flex-col",
          h(
            "text-[1.265rem]/[1.15]",
            h(
              "font-['Symbola']",
              CmdBrack.render("(", ")", null, {
                el: h(
                  "",
                  new CmdWord("iterate", "prefix").el,
                  CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                  new CmdWord("a", undefined, true).el,
                  new OpRightArrow().el,
                  TY_INFO.r32?.icon(),
                  new CmdWord("until", "infix").el,
                  TY_INFO.bool?.icon(),
                ),
              }),
              new OpRightArrow().el,
              TY_INFO.r32?.icon(),
            ),
          ),
          h(
            "text-sm leading-tight text-slate-500",
            "sets <a> to some expression 50 times, starting with a=0, then returns <a>; if the “until” clause is ever true, returns <a> immediately",
          ),
        ),
      ]
    : []),
  ])
}

function secDataTypes() {
  return section(`data types (${Object.entries(TY_INFO).length})`, [
    h(
      "flex flex-col",
      ...Object.entries(TY_INFO)
        .filter((x) => !x[0].endsWith("64"))
        .map(([, info]) => h("flex gap-1", info?.icon(), info.name)),
      h("flex gap-1", any(), "any type"),
    ),
  ])
}

function secCredits() {
  return section("credits", [
    hx(
      "p",
      "",
      "This site is a work in progress by ",
      hx(
        "a",
        {
          class: "text-blue-500 underline underline-offset-2",
          href: "https://github.com/zsakowitz",
        },
        "sakawi",
      ),
      ". ",
      hx(
        "a",
        {
          class: "text-blue-500 underline underline-offset-2",
          href: "https://github.com/zsakowitz/nya",
        },
        "Its source code",
      ),
      " is publicly available on GitHub.",
    ),
    hx(
      "p",
      "",
      "Inspiration for project nya was taken primarily from Desmos. I love their tools, and I've always thought it would be fun to rebuild it, simply for my own enjoyment.",
    ),
    hx(
      "p",
      "",
      "My original dream was simply to make a version of Desmos with complex numbers (they weren't added to Desmos until late 2024). But I never created that, since it never seemed worth it to rebuild a whole calculator app just for one tiny feature.",
    ),
    hx(
      "p",
      "",
      "Later, I became obsessed with fractals (see the ",
      a(
        "https://v8.zsnout.com/fractal-gallery",
        "fractal gallery on my main site, zSnout",
      ),
      " for interactive examples). I tried making some in Desmos, but they never matched up to my quality expectations, since Desmos wasn't built for fractals. So I brushed the thought aside.",
    ),
    hx(
      "p",
      "",
      "But then, around November 2024, I had a realization. I'm a programmer. If I want Desmos to make fractals, I can just... make it do that. And the project just exploded from there. For the full details, scroll down to the changelog at the bottom of this page.",
    ),
    hx(
      "p",
      "",
      "Hence, I present to you: ",
      hx("strong", "font-semibold", "project nya"),
      ". I hope you enjoy it.",
    ),
  ])
}

function secChangelog() {
  return section("changelog", [
    hx(
      "p",
      "",
      "My original prototype was just ",
      a(MASSIVE_URL(), "to slap Desmos onto my existing Fractal Explorer"),
      ". It worked well, but it could only render one fractal. Since then, I've rebuilt every component of those original projects. Here are some highlights:",
    ),
    hx("p", "", "Nov. 18 was the day I started the project."),
    hx(
      "p",
      "",
      "Nov. 28 was the first day ",
      a(
        "https://ts-latex-ckprccic9-zsakowitzs-projects.vercel.app/",
        "the project",
      ),
      " was accessible on the internet.",
    ),
    hx(
      "p",
      "",
      "By Nov. 30, ",
      a(
        "https://ts-latex-1u30n8hl1-zsakowitzs-projects.vercel.app/",
        "the math editor",
      ),
      " could type everything Desmos's can, and then some.",
    ),
    hx("p", "", "I took a month-long break during December."),
    hx(
      "p",
      "",
      "Jan. 6 was the first day ",
      a(
        "https://ts-latex-6bxt4jtun-zsakowitzs-projects.vercel.app/",
        "the vision for a full calculator",
      ),
      " started to actually set in.",
    ),
    hx(
      "p",
      "",
      "By Jan. 8, it could evaluate some expressions and had a graph paper ",
      a("https://ts-latex-7q5154x8x-zsakowitzs-projects.vercel.app/", ""),
      ". (I stole the graph paper from an old project, which saved a bit of time.)",
    ),
    hx(
      "p",
      "",
      a(
        "https://ts-latex-15r43kfip-zsakowitzs-projects.vercel.app/",
        "On Jan. 10",
      ),
      ", it could render basic shaders.",
    ),
    hx(
      "p",
      "",
      "On Jan. 11, iteration was supported enough to ",
      a(
        "https://ts-latex-ejtii37qi-zsakowitzs-projects.vercel.app/",
        "render the Mandelbrot Set",
      ),
      ".",
    ),
    hx(
      "p",
      "",
      "By Jan. 25, it could mimic high-precision numbers enough to ",
      a(
        "https://ts-latex-gvky3jt81-zsakowitzs-projects.vercel.app/",
        "draw an incredibly high-resolution version of the Mandelbrot Set",
      ),
      ". (Drag the slider at the top-right to the left for less pixelation.)",
    ),
    hx(
      "p",
      "",
      "By Feb. 5, it could draw objects directly from the CPU, and ",
      a(
        "https://ts-latex-1ggybmqd9-zsakowitzs-projects.vercel.app/",
        "had variables with sliders",
      ),
      ".",
    ),
    hx(
      "p",
      "",
      "On Feb. 6, I worked on adding ",
      a(
        "https://ts-latex-3n1xvcbem-zsakowitzs-projects.vercel.app/",
        "built-in automatically-updating documentation",
      ),
      ".",
    ),
    hx(
      "p",
      "",
      "As of Feb. 8, ",
      a(
        "https://ts-latex-oywr5or8t-zsakowitzs-projects.vercel.app/",
        "basic geometric objects could be constructed",
      ),
      " without ever touching the expression list.",
    ),
    hx(
      "p",
      "",
      "As of Feb. 11, ",
      a(
        "https://github.com/zsakowitz/nya/tree/4d7dfd34cbcec061a9d0e0befe15fc259415b97e/src/pkg",
        "a robust package system had been implemented",
      ),
      " to ensure further extension was not just possible, but ridiculously easy. As a test, I tried to incorporate my preexisting Ithkuil tooling into project nya; it took only three minutes to incorporate the first of just three features.",
    ),
  ])
}

function secShaders() {
  return section("shaders", [
    hx(
      "p",
      "",
      "If you reference the 'x', 'y', or 'p' variables in an expression, it becomes a ",
      hx("em", "", "shader"),
      ". A shader outputs a single color for every pixel on your screen, and can draw very complex shapes very quickly.",
    ),
    hx(
      "p",
      "",
      "When running in shaders, most computations run at a lower precision than normal, since most devices can't handle higher precision values, which might lead to shaders appearing pixelated.",
    ),
    hx(
      "p",
      "",
      "Some functions and operators, however, can run on high-precision variants. These operations can be up to 20x slower, but are much more accurate. Note that only these types have high-precision variants:",
    ),
    h(
      "flex flex-col",
      ...Object.entries(TY_INFO)
        .filter((x) => x[0].endsWith("64"))
        .map(([, info]) =>
          h("flex gap-1", info?.icon(), info.name + " (high-res)"),
        ),
    ),
  ])
}

function secNamedVariables() {
  return section(`named variables (${Object.entries(VARS).length})`, [
    h(
      "flex flex-col",
      ...Object.entries(VARS)
        .sort(([a], [b]) => a.length - b.length || (a < b ? -1 : 1))
        .map(([name, a]) => {
          let value: Type
          let js
          try {
            js = value = a.js
          } catch {
            value = a.glsl
          }
          let block
          if (a.display) {
            if (js) {
              block = new Block(null)
              const display = new Display(block.cursor(R), frac(10, 1))
              if (typeof a.display == "function") {
                a.display(display)
              } else {
                display.output(js)
              }
              block.el.insertBefore(makeDocName(name), block.el.firstChild)
            } else {
              block = { el: makeDocName(name) }
            }
          }
          return h(
            "flex gap-2 font-['Symbola'] text-[1.265rem] overflow-x-auto -mx-4 px-4 max-w-[calc(100%_+_2rem)] [&::-webkit-scrollbar]:hidden whitespace-nowrap",
            h("", icon(value.type)),
            h("", block?.el ?? makeDocName(name)),
          )
        }),
    ),
  ])
}

function secNamedFunctions() {
  const fns = ALL_DOCS.filter((x) => Object.values(FNS).includes(x as any))
  return section(
    `named functions (${fns.length})`,
    fns
      .sort((a, b) => (a.name < b.name ? -1 : 1))
      .map(makeDoc)
      .filter((x) => x != null),
  )
}

function secUnnamedFunctions() {
  const fns = ALL_DOCS.filter((x) => !Object.values(FNS).includes(x as any))
  return section(
    `operators (${fns.length})`,
    fns
      .sort((a, b) => (a.name < b.name ? -1 : 1))
      .map(makeDoc)
      .filter((x) => x != null),
  )
}

const MASSIVE_URL = () =>
  "https://v8-dm8n5plod-zsnout.vercel.app/desmos?desmosState=%7B%22version%22%3A11%2C%22randomSeed%22%3A%22bce40c91e3061790fd578740a10de9b1%22%2C%22graph%22%3A%7B%22viewport%22%3A%7B%22xmin%22%3A-21.818588115496738%2C%22ymin%22%3A-18.86552532798194%2C%22xmax%22%3A19.579211720093717%2C%22ymax%22%3A18.692962426082%7D%2C%22complex%22%3Atrue%7D%2C%22expressions%22%3A%7B%22list%22%3A%5B%7B%22type%22%3A%22expression%22%2C%22id%22%3A%22__fractal_explorer_c%22%2C%22color%22%3A%22%23c74440%22%2C%22latex%22%3A%22f_c%5C%5Cleft%28p%5C%5Cright%29%3Dp%22%2C%22hidden%22%3Atrue%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%22__fractal_explorer_z%22%2C%22color%22%3A%22%232d70b3%22%2C%22latex%22%3A%22f_z%5C%5Cleft%28p%5C%5Cright%29%3Dp%22%2C%22hidden%22%3Atrue%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%22__fractal_explorer_f%22%2C%22color%22%3A%22%23388c46%22%2C%22latex%22%3A%22f_%7Beq%7D%5C%5Cleft%28c%2Cz%2Cp%5C%5Cright%29%3Dz-%5C%5Cfrac%7B%5C%5Cleft%28z-A%5C%5Cright%29%5C%5Cleft%28z-B%5C%5Cright%29%5C%5Cleft%28z-C%5C%5Cright%29%7D%7BA%5C%5Cleft%28B%2BC-2z%5C%5Cright%29%2BB%5C%5Cleft%28C-2z%5C%5Cright%29%2Bz%5C%5Cleft%283z-2C%5C%5Cright%29%7D%22%2C%22hidden%22%3Atrue%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%222%22%2C%22color%22%3A%22%23c74440%22%2C%22latex%22%3A%22A%3D-10-5.2i%22%2C%22colorLatex%22%3A%22X%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2221%22%2C%22color%22%3A%22%232d70b3%22%2C%22latex%22%3A%22B%3D0.9-3.74i%22%2C%22colorLatex%22%3A%22Y%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2222%22%2C%22color%22%3A%22%23388c46%22%2C%22latex%22%3A%22C%3D-4.7%2B2i%22%2C%22colorLatex%22%3A%22Z%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2241%22%2C%22color%22%3A%22%23c74440%22%2C%22latex%22%3A%22q%5C%5Cleft%28x%5C%5Cright%29%3D%5C%5Coperatorname%7Bhsv%7D%5C%5Cleft%28180-%5C%5Cfrac%7B360%7D%7B2%5C%5Cpi%7D%5C%5Carctan%5C%5Cleft%28%5C%5Coperatorname%7Bimag%7D%5C%5Cleft%28x%5C%5Cright%29%2C%5C%5Coperatorname%7Breal%7D%5C%5Cleft%28x%5C%5Cright%29%5C%5Cright%29%2C1%2C1%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2242%22%2C%22color%22%3A%22%232d70b3%22%2C%22latex%22%3A%22Z%3Dq%5C%5Cleft%28C%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2243%22%2C%22color%22%3A%22%23388c46%22%2C%22latex%22%3A%22Y%3Dq%5C%5Cleft%28B%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2244%22%2C%22color%22%3A%22%236042a6%22%2C%22latex%22%3A%22X%3Dq%5C%5Cleft%28A%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2246%22%2C%22color%22%3A%22%23000000%22%2C%22latex%22%3A%22P%3D11.25-2i%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2247%22%2C%22color%22%3A%22%232d70b3%22%2C%22latex%22%3A%22f%5C%5Cleft%28z%5C%5Cright%29%3Df_%7Beq%7D%5C%5Cleft%28P%2Cz%2CP%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2249%22%2C%22color%22%3A%22%236042a6%22%2C%22latex%22%3A%22s%5C%5Cleft%28z%2C0%5C%5Cright%29%3Dz%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2250%22%2C%22color%22%3A%22%23000000%22%2C%22latex%22%3A%22s%5C%5Cleft%28z%2Cn%5C%5Cright%29%3Ds%5C%5Cleft%28%5C%5Coperatorname%7Bjoin%7D%5C%5Cleft%28z%2Cf%5C%5Cleft%28z%5C%5Cleft%5Bz.%5C%5Coperatorname%7Blength%7D%5C%5Cright%5D%5C%5Cright%29%5C%5Cright%29%2Cn-1%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2248%22%2C%22color%22%3A%22%23000000%22%2C%22latex%22%3A%22s%5C%5Cleft%28%5C%5Cleft%5BP%5C%5Cright%5D%2C50%5C%5Cright%29%22%2C%22lines%22%3Atrue%7D%5D%7D%2C%22includeFunctionParametersInRandomSeed%22%3Atrue%7D&equation=%7E%7Ez-%5Cfrac%7B%5Cleft%28z-%5Cdesmos%7BA%7D%5Cright%29%5Cleft%28z-%5Cdesmos%7BB%7D%5Cright%29%5Cleft%28z-%5Cdesmos%7BC%7D%5Cright%29%7D%7B%5Cdesmos%7BA%7D%5Cleft%28%5Cdesmos%7BB%7D%2B%5Cdesmos%7BC%7D-2z%5Cright%29%2B%5Cdesmos%7BB%7D%5Cleft%28%5Cdesmos%7BC%7D-2z%5Cright%29%2Bz%5Cleft%283z-2%5Cdesmos%7BC%7D%5Cright%29%7D&inner_theme=plot&theme=plot&size=1e10&plot_size=9.999999578402807e-9"
