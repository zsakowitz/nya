import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { faBook } from "@fortawesome/free-solid-svg-icons/faBook"
import { faCopy } from "@fortawesome/free-solid-svg-icons/faCopy"
import { faListUl } from "@fortawesome/free-solid-svg-icons/faListUl"
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash"
import type { Regl } from "regl"
import regl from "regl"
import { GlslContext, GlslHelpers } from "../../../eval/lib/fn"
import { FNS } from "../../../eval/ops"
import { ALL_DOCS } from "../../../eval/ops/docs"
import { declareAddR64 } from "../../../eval/ops/op/add"
import { declareMulR64 } from "../../../eval/ops/op/mul"
import type { JsVal, TyName } from "../../../eval/ty"
import { num, real } from "../../../eval/ty/create"
import { any, TY_INFO } from "../../../eval/ty/info"
import { splitRaw } from "../../../eval/ty/split"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdNum } from "../../../field/cmd/leaf/num"
import { OpRightArrow } from "../../../field/cmd/leaf/op"
import { CmdWord } from "../../../field/cmd/leaf/word"
import { CmdPiecewise } from "../../../field/cmd/logic/piecewise"
import { CmdBrack } from "../../../field/cmd/math/brack"
import { CmdSupSub } from "../../../field/cmd/math/supsub"
import { fa } from "../../../field/fa"
import type { Block } from "../../../field/model"
import type { Options } from "../../../field/options"
import { a, h, hx, t } from "../../../jsx"
import { Scope } from "../../deps"
import type { Exts } from "../../ext"
import type { Picker } from "../../pick"
import {
  PICK_BY_TY,
  PICK_CIRCLE,
  PICK_LINE,
  PICK_MIDPOINT,
  PICK_PARALLEL,
  PICK_PERPENDICULAR,
  PICK_POINT,
  PICK_POLYGON,
  PICK_RAY,
  PICK_SEGMENT,
  PICK_VECTOR,
  type PropsByTy,
} from "../../pick/normal"
import { doMatchReglSize } from "../../regl"
import { REMARK } from "../../remark"
import { Slider } from "../../slider"
import { isDark } from "../../theme"
import { Expr } from "../expr"
import {
  createDrawAxes,
  makeInteractive,
  matchSize,
  Paper,
  type Point,
} from "../paper"
import { Handlers } from "./handler"

function createDocs(className: string, hide: () => void) {
  function makeDoc(fn: { name: string; label: string; docs(): Node[] }) {
    return h(
      "flex flex-col",
      h(
        "text-[1.265rem]/[1.15]",
        ...(fn.name.match(/[a-z]+|[^a-z]+/g) || []).map((x) =>
          x.match(/[a-z]/) ?
            h("font-['Times_New_Roman']", x)
          : h("font-['Symbola']", x),
        ),
      ),
      h("text-sm leading-tight text-slate-500", fn.label),
      h("flex flex-col pl-4 mt-1", ...fn.docs()),
    )
  }

  function title(label: string) {
    const btn = hx(
      "button",
      "bg-[--nya-bg] border border-[--nya-border] size-8 flex rounded-md mb-0.5 -mt-0.5 -mr-1.5",
      fa(faListUl, "size-4 m-auto fill-[--nya-title]"),
    )

    btn.addEventListener("click", hide)

    return h(
      "sticky top-0 z-10 bg-[--nya-bg] pt-2",
      h(
        "flex bg-[--nya-bg-sidebar] border border-[--nya-border] -mx-2 rounded-lg px-2 pt-1 font-['Symbola'] text-[1.265rem] text-center",
        h("flex-1", label),
        btn,
      ),
    )
  }

  function section(label: string, data: Node[]) {
    return h("flex flex-col gap-4", title(label), ...data)
  }

  function secAdvancedOperators() {
    let q

    return section("advanced operators", [
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                any(),
                new CmdWord("base", "infix").el,
                TY_INFO.r32.icon(),
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
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
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
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdPiecewise.render([
              { el: any() },
              { el: TY_INFO.bool.icon() },
              { el: any() },
              { el: TY_INFO.bool.icon() },
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
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h("", new CmdWord("forceshader", "prefix").el, any()),
            }),
            new OpRightArrow().el,
            any(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "forces the passed expression to be evaluated in a shader",
        ),
      ),
      h(
        "flex flex-col",
        h(
          "text-[1.265rem]/[1.15]",
          h(
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                new CmdWord("iterate", "prefix").el,
                CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                new CmdWord("a", undefined, true).el,
                new OpRightArrow().el,
                TY_INFO.r32.icon(),
              ),
            }),
            new OpRightArrow().el,
            TY_INFO.r32.icon(),
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
            "font-['Times_New_Roman']",
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
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                new CmdWord("iterate", "prefix").el,
                CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                new CmdWord("a", undefined, true).el,
                new OpRightArrow().el,
                TY_INFO.r32.icon(),
                new CmdWord("while", "infix").el,
                TY_INFO.bool.icon(),
              ),
            }),
            new OpRightArrow().el,
            TY_INFO.r32.icon(),
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
            "font-['Times_New_Roman']",
            CmdBrack.render("(", ")", null, {
              el: h(
                "",
                new CmdWord("iterate", "prefix").el,
                CmdSupSub.render(null, { el: h("", new CmdNum("50").el) }),
                new CmdWord("a", undefined, true).el,
                new OpRightArrow().el,
                TY_INFO.r32.icon(),
                new CmdWord("until", "infix").el,
                TY_INFO.bool.icon(),
              ),
            }),
            new OpRightArrow().el,
            TY_INFO.r32.icon(),
          ),
        ),
        h(
          "text-sm leading-tight text-slate-500",
          "sets <a> to some expression 50 times, starting with a=0, then returns <a>; if the “until” clause is ever true, returns <a> immediately",
        ),
      ),
    ])
  }

  function secDataTypes() {
    return section("data types", [
      h(
        "flex flex-col",
        ...Object.entries(TY_INFO)
          .filter((x) => !x[0].endsWith("64"))
          .map(([, info]) => h("flex gap-1", info.icon(), info.name)),
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
    ])
  }

  const MASSIVE_URL = () =>
    "https://v8-dm8n5plod-zsnout.vercel.app/desmos?desmosState=%7B%22version%22%3A11%2C%22randomSeed%22%3A%22bce40c91e3061790fd578740a10de9b1%22%2C%22graph%22%3A%7B%22viewport%22%3A%7B%22xmin%22%3A-21.818588115496738%2C%22ymin%22%3A-18.86552532798194%2C%22xmax%22%3A19.579211720093717%2C%22ymax%22%3A18.692962426082%7D%2C%22complex%22%3Atrue%7D%2C%22expressions%22%3A%7B%22list%22%3A%5B%7B%22type%22%3A%22expression%22%2C%22id%22%3A%22__fractal_explorer_c%22%2C%22color%22%3A%22%23c74440%22%2C%22latex%22%3A%22f_c%5C%5Cleft%28p%5C%5Cright%29%3Dp%22%2C%22hidden%22%3Atrue%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%22__fractal_explorer_z%22%2C%22color%22%3A%22%232d70b3%22%2C%22latex%22%3A%22f_z%5C%5Cleft%28p%5C%5Cright%29%3Dp%22%2C%22hidden%22%3Atrue%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%22__fractal_explorer_f%22%2C%22color%22%3A%22%23388c46%22%2C%22latex%22%3A%22f_%7Beq%7D%5C%5Cleft%28c%2Cz%2Cp%5C%5Cright%29%3Dz-%5C%5Cfrac%7B%5C%5Cleft%28z-A%5C%5Cright%29%5C%5Cleft%28z-B%5C%5Cright%29%5C%5Cleft%28z-C%5C%5Cright%29%7D%7BA%5C%5Cleft%28B%2BC-2z%5C%5Cright%29%2BB%5C%5Cleft%28C-2z%5C%5Cright%29%2Bz%5C%5Cleft%283z-2C%5C%5Cright%29%7D%22%2C%22hidden%22%3Atrue%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%222%22%2C%22color%22%3A%22%23c74440%22%2C%22latex%22%3A%22A%3D-10-5.2i%22%2C%22colorLatex%22%3A%22X%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2221%22%2C%22color%22%3A%22%232d70b3%22%2C%22latex%22%3A%22B%3D0.9-3.74i%22%2C%22colorLatex%22%3A%22Y%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2222%22%2C%22color%22%3A%22%23388c46%22%2C%22latex%22%3A%22C%3D-4.7%2B2i%22%2C%22colorLatex%22%3A%22Z%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2241%22%2C%22color%22%3A%22%23c74440%22%2C%22latex%22%3A%22q%5C%5Cleft%28x%5C%5Cright%29%3D%5C%5Coperatorname%7Bhsv%7D%5C%5Cleft%28180-%5C%5Cfrac%7B360%7D%7B2%5C%5Cpi%7D%5C%5Carctan%5C%5Cleft%28%5C%5Coperatorname%7Bimag%7D%5C%5Cleft%28x%5C%5Cright%29%2C%5C%5Coperatorname%7Breal%7D%5C%5Cleft%28x%5C%5Cright%29%5C%5Cright%29%2C1%2C1%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2242%22%2C%22color%22%3A%22%232d70b3%22%2C%22latex%22%3A%22Z%3Dq%5C%5Cleft%28C%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2243%22%2C%22color%22%3A%22%23388c46%22%2C%22latex%22%3A%22Y%3Dq%5C%5Cleft%28B%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2244%22%2C%22color%22%3A%22%236042a6%22%2C%22latex%22%3A%22X%3Dq%5C%5Cleft%28A%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2246%22%2C%22color%22%3A%22%23000000%22%2C%22latex%22%3A%22P%3D11.25-2i%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2247%22%2C%22color%22%3A%22%232d70b3%22%2C%22latex%22%3A%22f%5C%5Cleft%28z%5C%5Cright%29%3Df_%7Beq%7D%5C%5Cleft%28P%2Cz%2CP%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2249%22%2C%22color%22%3A%22%236042a6%22%2C%22latex%22%3A%22s%5C%5Cleft%28z%2C0%5C%5Cright%29%3Dz%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2250%22%2C%22color%22%3A%22%23000000%22%2C%22latex%22%3A%22s%5C%5Cleft%28z%2Cn%5C%5Cright%29%3Ds%5C%5Cleft%28%5C%5Coperatorname%7Bjoin%7D%5C%5Cleft%28z%2Cf%5C%5Cleft%28z%5C%5Cleft%5Bz.%5C%5Coperatorname%7Blength%7D%5C%5Cright%5D%5C%5Cright%29%5C%5Cright%29%2Cn-1%5C%5Cright%29%22%7D%2C%7B%22type%22%3A%22expression%22%2C%22id%22%3A%2248%22%2C%22color%22%3A%22%23000000%22%2C%22latex%22%3A%22s%5C%5Cleft%28%5C%5Cleft%5BP%5C%5Cright%5D%2C50%5C%5Cright%29%22%2C%22lines%22%3Atrue%7D%5D%7D%2C%22includeFunctionParametersInRandomSeed%22%3Atrue%7D&equation=%7E%7Ez-%5Cfrac%7B%5Cleft%28z-%5Cdesmos%7BA%7D%5Cright%29%5Cleft%28z-%5Cdesmos%7BB%7D%5Cright%29%5Cleft%28z-%5Cdesmos%7BC%7D%5Cright%29%7D%7B%5Cdesmos%7BA%7D%5Cleft%28%5Cdesmos%7BB%7D%2B%5Cdesmos%7BC%7D-2z%5Cright%29%2B%5Cdesmos%7BB%7D%5Cleft%28%5Cdesmos%7BC%7D-2z%5Cright%29%2Bz%5Cleft%283z-2%5Cdesmos%7BC%7D%5Cright%29%7D&inner_theme=plot&theme=plot&size=1e10&plot_size=9.999999578402807e-9"

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
            h("flex gap-1", info.icon(), info.name + " (high-res)"),
          ),
      ),
    ])
  }

  function secNamedFunctions() {
    return section(
      "named functions",
      ALL_DOCS.filter((x) => Object.values(FNS).includes(x as any))
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .map(makeDoc),
    )
  }

  function secUnnamedFunctions() {
    return section(
      "operators",
      ALL_DOCS.filter((x) => !Object.values(FNS).includes(x as any))
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .map(makeDoc),
    )
  }

  return h(
    className,
    secCredits(),
    secDataTypes(),
    secShaders(),
    secAdvancedOperators(),
    secNamedFunctions(),
    secUnnamedFunctions(),
    secChangelog(),
  )
}

export class Sheet {
  readonly paper = new Paper()
  readonly helpers = new GlslHelpers()
  readonly scope: Scope
  readonly exprs: Expr[] = []

  private readonly pixelRatio
  private readonly setPixelRatio
  private readonly glPixelRatio = new Slider()

  private readonly handlers = new Handlers(this)
  private readonly regl: Regl

  readonly el
  readonly elExpressions = h("flex flex-col")
  readonly elNextIndex = h(
    "font-sans text-[--nya-expr-index] text-[65%] leading-none",
    "1",
  )

  constructor(
    readonly options: Options,
    readonly exts: Exts,
  ) {
    this.scope = new Scope(options)
    Object.assign(globalThis, { scope: this.scope })

    // prepare js context
    this.paper.el.classList.add(
      "size-full",
      "touch-none",
      "inset-0",
      "absolute",
    )
    matchSize(this.paper)
    makeInteractive(this.paper, this.handlers)
    createDrawAxes(this.paper)
    this.paper.drawFns.push(() => {
      this.paper.ctx.lineJoin = "round"
      this.paper.ctx.lineCap = "round"
      for (const e of this.exprs
        .filter((x) => x.state.ok && x.state.ext?.plot2d != null)
        .sort((a, b) => a.layer - b.layer)) {
        if (e.state.ok && e.state.ext?.plot2d) {
          try {
            e.state.ext.plot2d(e.state.data, this.paper)
          } catch {}
        }
      }
    })
    this.paper.drawFns.push(() => this.handlers.draw())

    // prepare glsl context
    const canvas = hx(
      "canvas",
      "absolute inset-0 size-full pointer-events-none [image-rendering:pixelated]",
    )
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: false })!
    this.regl = regl({ canvas, gl })

    // prepare slider
    ;[this.pixelRatio, this.setPixelRatio] = doMatchReglSize(canvas, this.regl)
    this.glPixelRatio.bounds(real(1), real(16))
    this.glPixelRatio.value = real(this.pixelRatio())
    this.glPixelRatio.onInput = () =>
      this.setPixelRatio(num(this.glPixelRatio.value))

    function btn(
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

    const switchToDocs = btn(faBook, "Docs", () => {
      docs.classList.remove("hidden")
      sidebar.classList.add("hidden")
    })

    const clearAll = btn(faTrash, "Clear", () => {
      while (this.exprs[0]) {
        this.exprs[0].delete()
      }
    })

    const copyAllLabel = t("Copy")

    let copyId = 0
    const copyAll = btn(faCopy, copyAllLabel, async () => {
      copyAllLabel.data = "Copying..."
      const id = ++copyId
      try {
        await navigator.clipboard.writeText(
          this.exprs.map((x) => x.field.block.latex()).join("\n"),
        )
        if (copyId == id) {
          copyAllLabel.data = "Copied!"
          setTimeout(() => {
            if (copyId == id) {
              copyAllLabel.data = "Copy"
            }
          }, 3000)
        }
      } catch {
        if (copyId == id) {
          copyAllLabel.data = "Failed ❌"
          setTimeout(() => {
            if (copyId == id) {
              copyAllLabel.data = "Copy"
            }
          }, 3000)
        }
      }
    })

    const nextExpression = hx(
      "button",
      "relative text-left grid grid-cols-[2.5rem_auto] min-h-[3.625rem] border-r border-[--nya-border]",

      // grey side of expression
      h(
        "inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border]",
        this.elNextIndex,
      ),

      // main expression body
      // TODO: make this clickable

      // cover
      h("absolute inset-0 from-transparent to-[--nya-bg] bg-gradient-to-b"),
    )

    nextExpression.addEventListener("click", () => {
      const expr = new Expr(this)
      setTimeout(() => nextExpression.scrollIntoView())
      setTimeout(() => expr.field.el.focus())
    })

    const sidebar = h(
      "font-['Symbola','Times_New_Roman',sans-serif] flex flex-col overflow-y-auto row-span-2",

      // title bar
      h(
        "sticky top-0 w-full p-1 h-12 min-h-12 max-h-12 flex bg-[--nya-bg-sidebar] border-b border-r border-[--nya-border] text-center text-[--nya-title] z-10",
        copyAll,
        clearAll,
        h("m-auto text-2xl", "project nya"),
        switchToDocs,
      ),

      // main expression list
      this.elExpressions,

      // fake expression
      nextExpression,

      // right border on remainder of the flexbox
      h("flex-1 border-r min-h-24 border-[--nya-border]"),
    )

    const checkPick: (() => void)[] = []
    this.handlers.onPickChange = () => checkPick.forEach((x) => x())

    const picker = (icon: HTMLSpanElement, props: PropsByTy) => {
      const btn = hx(
        "button",
        "w-12 hover:bg-[--nya-bg] border-x border-transparent hover:border-[--nya-border] focus:outline-none -mr-px last:mr-0",
        icon,
      )
      checkPick.push(() => {
        const current = this.handlers.getPick()
        if (current?.from.id(current.data) == props.ext.id) {
          btn.classList.add("bg-[--nya-bg]", "border-[--nya-border]")
          btn.classList.remove("border-transparent")
        } else {
          btn.classList.remove("bg-[--nya-bg]", "border-[--nya-border]")
          btn.classList.add("border-transparent")
        }
      })
      btn.addEventListener("click", () => {
        this.setPick(PICK_BY_TY, props)
      })
      return btn
    }

    const toolbar = h(
      "font-['Symbola','Times_New_Roman',sans-serif] flex overflow-x-auto h-12 min-h-12 bg-[--nya-bg-sidebar] border-b border-[--nya-border] first:*:ml-auto last:*:mr-auto [&::-webkit-scrollbar]:hidden px-2",
      picker(TY_INFO.point32.icon(), PICK_POINT),
      picker(TY_INFO.segment.icon(), PICK_SEGMENT),
      picker(TY_INFO.ray.icon(), PICK_RAY),
      picker(TY_INFO.line.icon(), PICK_LINE),
      picker(TY_INFO.vector.icon(), PICK_VECTOR),
      picker(TY_INFO.circle.icon(), PICK_CIRCLE),
      picker(TY_INFO.polygon.icon(), PICK_POLYGON),
      picker(
        h(
          "",
          h(
            "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
            h(
              "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
            ),
            h(
              "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
            ),
            h(
              "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current opacity-30 rotate-[60deg]",
            ),
            h(
              "size-1 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#6042a6]",
            ),
          ),
        ),
        PICK_PERPENDICULAR,
      ),
      picker(
        h(
          "",
          h(
            "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
            h(
              "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
            ),
            h(
              "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_+_4px)] border-t-2 border-current -rotate-[30deg]",
            ),
            h(
              "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_-_4px)] border-t-2 border-current opacity-30 -rotate-[30deg]",
            ),
            h(
              "size-1 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_+_4px)] bg-[#6042a6]",
            ),
          ),
        ),
        PICK_PARALLEL,
      ),
      picker(
        h(
          "",
          h(
            "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
            h(
              "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
            ),
            h(
              "text-[#2d70b3] w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
            ),
            h(
              "size-1 absolute rounded-full top-1/2 left-1/2 [transform:translate(-50%,-50%)_rotate(-30deg)_translate(-8px,0)] bg-[#6042a6]",
            ),
            h(
              "size-1 absolute rounded-full top-1/2 left-1/2 [transform:translate(-50%,-50%)_rotate(-30deg)_translate(8px,0)] bg-[#6042a6]",
            ),
            h(
              "size-[7px] absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#6042a6]",
            ),
          ),
        ),
        PICK_MIDPOINT,
      ),
    )

    const docs = createDocs(
      "flex flex-col overflow-y-auto px-4 pb-4 gap-2 border-r border-[--nya-border] hidden row-span-2 [&_p+p]:-mt-2",
      () => {
        docs.classList.add("hidden")
        sidebar.classList.remove("hidden")
      },
    )

    // dom
    this.glPixelRatio.el.className =
      "block w-48 bg-[--nya-bg] outline outline-[--nya-pixel-ratio] rounded-full p-1"
    this.el = h(
      "fixed inset-0 grid grid-cols-[500px_1fr] grid-rows-[3rem_1fr] grid-rows-1 select-none",

      sidebar,
      docs,
      toolbar,

      h(
        "relative",
        canvas,
        this.paper.el,
        h(
          "absolute block top-0 left-0 right-0 h-1 from-[--nya-sidebar-shadow] to-transparent bg-gradient-to-b",
        ),
        h(
          "absolute block top-0 bottom-0 left-0 w-1 from-[--nya-sidebar-shadow] to-transparent bg-gradient-to-r",
        ),
        h("absolute flex flex-col top-2 right-2", this.glPixelRatio.el),
        h(
          "absolute flex flex-col bottom-2 right-2 text-right font-['Symbola'] text-[--nya-title] pointer-events-none [-webkit-text-stroke:2px_var(--nya-bg)] [paint-order:stroke] opacity-30",
          h("text-3xl/[1]", "project nya"),
          h("italic text-sm leading-none", REMARK),
        ),
      ),
    )
    new ResizeObserver(() =>
      this.el.style.setProperty(
        "--nya-sidebar",
        this.elExpressions.clientWidth + "px",
      ),
    ).observe(this.elExpressions)

    this.startGlslLoop()

    addEventListener("keydown", (event) => {
      if (
        this.handlers.getPick() &&
        event.key == "Escape" &&
        !(event.metaKey || event.shiftKey || event.altKey || event.ctrlKey)
      ) {
        event.preventDefault()
        this.handlers.unsetPick()
      }
    })
  }

  setPick<T extends {}, U extends {}>(pick: Picker<T, U>, data: NoInfer<T>) {
    this.handlers.setPick(pick, data)
  }

  unsetPick() {
    this.handlers.unsetPick()
  }

  private checkIndices() {
    for (let i = 0; i < this.exprs.length; i++) {
      const expr = this.exprs[i]!
      expr.elIndex.textContent = i + 1 + ""
    }
    this.elNextIndex.textContent = this.exprs.length + 1 + ""
  }

  private _qdIndices = false
  queueIndices() {
    if (this._qdIndices) return
    setTimeout(() => {
      this._qdIndices = false
      this.checkIndices()
    })
    this._qdIndices = true
  }

  private startGlslLoop() {
    const global = this.regl({
      attributes: {
        position: [
          [-1, 1],
          [-1, -1],
          [1, 1],
          [1, -1],
          [-1, -1],
          [1, 1],
        ],
      },

      uniforms: {
        // @ts-expect-error regl requires generics in weird places
        u_scale: this.regl.prop("u_scale"),
        // @ts-expect-error
        u_cx: this.regl.prop("u_cx"),
        // @ts-expect-error
        u_cy: this.regl.prop("u_cy"),
        // @ts-expect-error
        u_px_per_unit: this.regl.prop("u_px_per_unit"),
        // @ts-expect-error
        u_darkmul: this.regl.prop("u_darkmul"),
        // @ts-expect-error
        u_darkoffset: this.regl.prop("u_darkoffset"),
      },
    })

    this.regl.frame(() => {
      this.regl.clear({ color: [0, 0, 0, 0] })

      const program = this.program
      if (!program) return

      const { xmin, w, ymin, h } = this.paper.bounds()
      global(
        {
          u_scale: splitRaw(w / this.regl._gl.drawingBufferWidth),
          u_cx: splitRaw(xmin),
          u_cy: splitRaw(ymin),
          u_px_per_unit: [
            ...splitRaw(this.paper.el.clientWidth / w),
            ...splitRaw(this.paper.el.clientHeight / h),
          ],
          u_darkmul: isDark() ? [-1, -1, -1, 1] : [1, 1, 1, 1],
          u_darkoffset: isDark() ? [1, 1, 1, 0] : [0, 0, 0, 0],
        },
        () => program(),
      )
    })
  }

  private program: regl.DrawCommand | undefined
  private checkGlsl() {
    const compiled = this.exprs
      .filter((x) => x.glsl != null)
      .sort((a, b) => a.layer - b.layer)
      .map((x) => x.glsl!)

    if (compiled.length == 0) {
      this.program = undefined
      return
    }

    declareAddR64(new GlslContext(this.scope.helpers))
    declareMulR64(new GlslContext(this.scope.helpers))
    const frag = `#version 300 es
precision highp float;
out vec4 color;
vec4 v_coords;
uniform vec4 u_darkmul;
uniform vec4 u_darkoffset;
uniform vec2 u_scale;
uniform vec2 u_cx;
uniform vec2 u_cy;
uniform vec4 u_px_per_unit;
vec4 _nya_helper_compose(vec4 base, vec4 added) {
  if (base.w == 0.) return added;
  if (added.w == 0.) return base;
  float w = 1. - (1. - added.w) * (1. - base.w);
  return vec4(
    ((added.xyz * added.w / w) + (base.xyz * base.w * (1. - added.w) / w)),
    w
  );
}
${this.scope.helpers.helpers}void main() {
vec2 e_tx = vec2(gl_FragCoord.x, 0);
vec2 e_ty = vec2(gl_FragCoord.y, 0);
v_coords = vec4(
  _helper_add_r64(u_cx, _helper_mul_r64(e_tx, u_scale)),
  _helper_add_r64(u_cy, _helper_mul_r64(e_ty, u_scale))
);
${compiled.map((x) => x[0].block).join("")}color = ${compiled.map((x) => x[1]).reduce((a, b) => `_nya_helper_compose(${a},${b})`)};
      }
      `
    this.program = this.regl({
      frag,
      vert: `#version 300 es
precision highp float;
in vec2 position;
void main() {
  gl_Position = vec4(position, 0, 1);
}
`,
      count: 6,
    })
  }

  private _qdGlsl = false
  queueGlsl() {
    if (this._qdGlsl) return
    setTimeout(() => {
      this._qdGlsl = false
      this.checkGlsl()
    })
    this._qdGlsl = true
  }

  private resetOn: (() => void)[] = []
  private resetDim: (() => void)[] = []

  clearSelect() {
    this.resetOn.forEach((x) => x())
    this.resetOn = []
    this.paper.el.classList.remove("cursor-pointer")

    this.resetDim.forEach((x) => x())
    this.resetDim = []
  }

  checkDim(possible: readonly TyName[]) {
    this.resetDim.forEach((x) => x())
    this.resetDim = []

    for (const expr of this.exprs) {
      if (!(expr.state.ok && expr.state.ext?.select)) continue

      const select = expr.state.ext.select
      const data = expr.state.data

      const ty = select.ty(data)
      if (!ty) continue

      if (!possible.includes(ty)) {
        select.dim(data)
        this.resetDim.push(() => select.undim(data))
      }
    }
  }

  /**
   * @param tys The types directly accepted by this operation.
   * @param allPossible All possible types the operation might use, even if this
   *   particular .select() call doesn't accept them.
   */
  select<const K extends readonly TyName[]>(
    at: Point,
    tys: K,
    limit: number,
    possible: readonly TyName[],
  ): Selected<K[number]>[] {
    this.clearSelect()
    this.checkDim(possible)

    let ret = []

    for (const expr of this.exprs
      .slice()
      .reverse()
      .sort((a, b) => a.layer - b.layer)) {
      if (!expr.state.ok) continue

      const ext = expr.state.ext
      if (!ext) continue

      const select = ext.select
      if (!select) continue
      // it's fine for .includes(), since `null` won't be in the original list anyways
      if (
        !tys.includes(
          select.ty(expr.state.data) satisfies TyName | null as TyName,
        )
      )
        continue

      const data = select.on(expr.state.data, at)
      if (data == null) continue
      this.paper.el.classList.add("cursor-pointer")

      this.resetOn.push(() => select.off(data))
      const val = select.val(data)
      if (!tys.includes(val.type)) continue
      const ref = () => select.ref(data)

      ret.push({ val, ref })
      if (ret.length >= limit) return ret
    }

    return ret
  }
}

export interface Selected<K extends TyName = TyName> {
  val: JsVal<K>
  ref(): Block
  draw?(): void
}

if (location.search.includes("?docsonly")) {
  const el = createDocs(
    "fixed inset-0 *:*:relative first:*:*:[grid-column:1_/_-1] *:grid *:grid-cols-[repeat(auto-fill,minmax(400px,1fr))] overflow-y-auto px-4 pb-4 gap-2 z-20 bg-[--nya-bg]",
    () => el.remove(),
  )

  document.body.appendChild(el)
}
