import { h, hx, t } from "@/jsx"
import { Cv } from "@/sheet/ui/cv"
import FuzzySearch from "fuzzy-search"
import { formatWithCursor } from "prettier"
import { parse } from "../ast/parse"
import { createStream } from "../ast/stream"
import { emitItem } from "../emit/emit"
import { ident } from "../emit/id"
import { EmitProps } from "../emit/props"
import { createStdlib } from "../emit/stdlib"
import * as plugin from "../prettier/plugin"
import { source } from "./source"

const cv = new Cv("absolute inset-0 size-full touch-none")

const area = hx("textarea", {
  class:
    "block resize-none h-full w-full border-r border-b rounded-br border-[--nya-border] font-mono p-2 focus:border-[--nya-expr-focus] focus:ring-1 ring-[--nya-expr-focus] focus:outline-none bg-[--nya-bg] text-sm",
  spellcheck: "false",
})
const lib = createAutocomplete()
createFormatter()

function createFormatter() {
  area.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && e.ctrlKey != e.metaKey) {
      format()
    }
  })

  async function format() {
    const cstart = area.selectionStart
    const { formatted, cursorOffset } = await formatWithCursor(area.value, {
      cursorOffset: cstart,
      plugins: [plugin],
      parser: "nya-parse-block-contents",
      printWidth: 50,
      tabWidth: 2,
    })
    area.value = formatted
    area.setSelectionRange(cursorOffset, cursorOffset, "none")
  }
}

function createAutocomplete() {
  const props = new EmitProps("js")
  const stdlib = createStdlib(props)
  const stream = createStream(source, { comments: false })
  for (const item of parse(stream).items) emitItem(item, stdlib)

  const allNames = stdlib.fns.map((x) => x[0]!.id.label)
  const search = new FuzzySearch(allNames, undefined, { sort: true })
  const libnow = t("")
  const lib = h(
    "overflow-y-auto absolute top-0 left-0 w-full h-full flex flex-col font-mono text-xs whitespace-pre-wrap text-[--nya-text-prose] py-4 pl-4",
    h("font-semibold text-[--nya-text]", libnow),
    ...stdlib.fns
      .mapEach(
        (fn) => [fn.id.label, h("-indent-4 pl-4", fn.toString())] as const,
      )
      .sort((a, b) =>
        a[0] < b[0] ? -1
        : a[0] > b[0] ? 1
        : 0,
      )
      .map((x) => x[1]),
  )
  async function checkCurrentFn() {
    libnow.data = ""
    const c = area.selectionStart
    const s = area.value
      .slice(0, c)
      .match(/(?:[+\-*\/#~|&@\\=!<>%]+|\w+)\s*(?:\(\s*)?$/)?.[0]
    const e = area.value
      .slice(c)
      .match(/^\s*(?:\w+|[+\-*\/#~|&@\\=!<>%]+)/)?.[0]
    const word = ((s ?? "") + (e ?? "")).match(
      /[+\-*\/#~|&@\\=!<>%]+|[A-Za-z_]\w*/,
    )?.[0]
    if (!word) {
      return
    }
    const fns = search
      .search(word)
      .map((x) => stdlib.fns.get(ident(x)))
      .filter((x) => x != null)
    if (fns.length) {
      libnow.data =
        fns
          .flat()
          .map((x) => x.toString())
          .join("\n") + "\n\n"
    }
  }
  area.addEventListener("selectionchange", checkCurrentFn)
  area.addEventListener("input", checkCurrentFn)
  return lib
}

document.body.appendChild(
  h(
    "bg-[--nya-bg] fixed inset-0 grid grid-cols-[min(500px,40vw)_1fr] select-none",
    h(
      "grid grid-cols-1 grid-rows-[24rem_1fr]",
      h("flex", area),
      h("flex relative h-full", lib),
    ),
    h("relative", cv.el),
  ),
)
