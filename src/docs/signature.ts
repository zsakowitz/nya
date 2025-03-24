import type { TyName } from "@/eval/ty"
import { any, TY_INFO } from "@/eval/ty/info"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { OpRightArrow } from "@/field/cmd/leaf/op"
import { CmdBrack } from "@/field/cmd/math/brack"
import { h } from "@/jsx"

export interface FnSignature {
  readonly params: readonly FnType[]
  readonly dots: boolean
  readonly ret: FnType
}

export interface FnType {
  readonly type: TyName | "__any"
  readonly list: boolean
}

function dots() {
  return h(
    "",
    h("nya-cmd-dot nya-cmd-dot-l", "."),
    h("nya-cmd-dot", "."),
    h("nya-cmd-dot", "."),
  )
}

export function tyIcon(type: "__any" | TyName): HTMLElement {
  return type == "__any" ? any() : TY_INFO[type].icon()
}

function typeDocs(type: FnType): HTMLElement {
  const item = tyIcon(type.type)
  if (type.list) {
    return CmdBrack.render("[", "]", null, {
      el: h(
        "inline-block",
        item.cloneNode(true),
        new CmdComma().el,
        item.cloneNode(true),
        new CmdComma().el,
        dots(),
      ),
    })
  } else {
    return item
  }
}

export function docFromSignature(signature: FnSignature) {
  const params = signature.params.map(typeDocs)
  if (signature.dots) {
    params.push(dots())
  }

  const el = h("inline-block")
  for (let i = 0; i < params.length; i++) {
    if (i != 0) {
      el.appendChild(new CmdComma().el)
    }
    el.appendChild(params[i]!)
  }

  return h(
    "inline-block",
    CmdBrack.render("(", ")", null, { el }),
    new OpRightArrow().el,
    typeDocs(signature.ret),
  )
}
