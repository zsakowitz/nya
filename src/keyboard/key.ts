import { options } from "@/field/defaults"
import type { Field } from "@/field/field"
import { LatexParser } from "@/field/latex"
import type { Block, Command } from "@/field/model"
import { fa, h, hx } from "@/jsx"
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { faLock } from "@fortawesome/free-solid-svg-icons/faLock"

const parser = new LatexParser(options, null, "")

function key(base?: string | Node, clsx?: string, active?: boolean) {
  const contents =
    typeof base == "string" ?
      h("font-['Symbola'] last:*:*:*:pr-0", parser.run(base).el)
    : (base ?? "")

  return hx(
    "button",
    "flex rounded-sm h-[40px] text-center items-center justify-center [line-height:1] relative nya-kbd" +
      (active ? " nya-kbd-active" : "") +
      (clsx ? " " + clsx : ""),
    h("font-['Symbola'] pointer-events-none", contents),
    h(
      "nya-kbd-lock hidden absolute top-0.5 right-0.5",
      fa(faLock, "size-2 opacity-30"),
    ),
  )
}

export const CANCEL_CHANGES = Symbol()

export type KeyActionReturn =
  | Block // block to be inserted left of cursor
  | Command // command to be inserted left of cursor
  | string // latex
  | void // this command wrote its output already
  | typeof CANCEL_CHANGES // this command did not modify anything

export type KeyAction =
  | string
  | ((field: Field) => Block | Command | string | void | typeof CANCEL_CHANGES)

export type Size = keyof typeof span

type OneOf<T> = {
  [K in keyof T]: Record<K, T[K]> &
    Partial<Record<Exclude<keyof T, K>, undefined>>
}[keyof T]

type Contents = OneOf<{
  latex: string
  text: string
  icon: IconDefinition // TODO: switch to heroicons
}>

export type Key =
  | string // shortcut for 4-width, latex, typed is same as written
  | (Contents & { size?: Size; clsx?: string; active?: boolean }) // normal key
  | Size // spacer

export type ActionKey =
  | string
  | (Contents & {
      action: KeyAction
      size?: Size
      clsx?: string
      active?: boolean
    })
  | ({ latex: string } & {
      action?: KeyAction
      size?: Size
      clsx?: string
      active?: boolean
    })
  | Size

const span = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
}

export function keyFrom(k: Key) {
  if (typeof k == "string") {
    return key(k, "col-span-4")
  }

  if (typeof k == "number") {
    return h(span[k])
  }

  if (k == null) {
    return key(undefined, "col-span-4 text-[.875em]")
  }

  return key(
    k.latex ??
      (k.text ? h("font-[system-ui]", k.text)
      : k.icon ? fa(k.icon, "size-4")
      : h("")),
    span[k.size ?? 4] + " " + k.clsx,
    k.active,
  )
}
