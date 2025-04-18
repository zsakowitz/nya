import type { WithDocs } from "@/eval/ops/docs"
import { CmdNum } from "@/field/cmd/leaf/num"
import { CmdWord } from "@/field/cmd/leaf/word"
import { fa, h, hx } from "@/jsx"
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { docFromSignature } from "./signature"

export function btnSkin2<K extends keyof HTMLElementTagNameMap>(
  kind: K,
  icon: Node,
  label: Node | string,
) {
  return hx(
    kind,
    "flex flex-col h-[calc(2.5rem_-_1px)] min-w-10 [line-height:1] hover:bg-[--nya-sidebar-hover] hover:text-[--nya-title-dark] rounded focus:outline-none focus-visible:ring ring-[--nya-expr-focus]",
    h(
      "flex flex-col m-auto",
      icon,
      h("text-[80%]/[.5] mt-1.5 lowercase", label),
    ),
  )
}

export function btnSkin<K extends "button" | "a">(
  kind: K,
  icon: IconDefinition,
  label: Node | string,
) {
  return btnSkin2(kind, fa(icon, "mx-auto size-5 fill-current"), label)
}

export function btn(
  icon: IconDefinition,
  label: Node | string,
  action: () => void,
) {
  const el = btnSkin("button", icon, label)
  el.addEventListener("click", action)
  return el
}

function makeDocName(name: string) {
  return h(
    "font-['Symbola'] text-[1.265rem]/[1.15]",
    /^(?:\p{L}+|\p{L}[\p{L}\s]+\p{L}|\.\p{L})$/u.test(name) ?
      new CmdWord(name, undefined, /^[a-z]$/.test(name)).el
    : new CmdNum(name).el,
  )
}

export function makeDoc(
  fn: WithDocs,
  props?: {
    title?: boolean
  },
) {
  const nodes = fn.docs()
  if (nodes.length == 0) return null

  return h(
    "flex flex-col",
    props?.title === false ? null : makeDocName(fn.name),
    h("text-sm leading-tight text-slate-500", fn.label),
    h("flex flex-col pl-4 mt-1", ...nodes.map(docFromSignature)),
  )
}

export function example(input: string, value: string | null) {
  return h(
    "block -mr-4 w-[calc(100%_+_1rem)] border-l border-[--nya-border] nya-doc-ex [.nya-doc-ex+&]:-mt-4 [.nya-doc-ex+&]:pt-2",
    h(
      "block px-4 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden text-left",
      hx("samp", "", input),
    ),
    value ?
      h(
        "pt-2 block px-2 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden text-right",
        h(
          "bg-[--nya-bg-sidebar] [line-height:1] border border-[--nya-border] px-2 py-1 rounded ml-auto inline-block",
          hx("samp", "", value),
        ),
      )
    : "",
  )
}
