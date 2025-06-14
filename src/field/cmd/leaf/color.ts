import { L } from "@/field/dir"
import type { LatexParser } from "@/field/latex"
import { h, hx } from "@/jsx"
import { Leaf } from "."
import type { Command, Cursor, InitProps } from "../../model"

export function brightness(rgb: string) {
  const r = parseInt(rgb.slice(1, 3), 16) / 255
  const g = parseInt(rgb.slice(3, 5), 16) / 255
  const b = parseInt(rgb.slice(5, 7), 16) / 255

  return Math.sqrt(r * r * 0.241 + g * g * 0.691 + b * b * 0.068)
}

// TODO: this is only ever used in readonly contexts now
export class CmdColor extends Leaf {
  static parse(name: string) {
    const el = document.createElement("span")
    el.style.color = name
    document.body.appendChild(el)
    const color = getComputedStyle(el).color
    el.remove()
    const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(color)
    if (match) {
      let r = parseInt(match[1]!, 10).toString(16)
      if (r.length == 1) r = "0" + r
      let g = parseInt(match[2]!, 10).toString(16)
      if (g.length == 1) g = "0" + g
      let b = parseInt(match[3]!, 10).toString(16)
      if (b.length == 1) b = "0" + b
      return "#" + r + g + b
    } else {
      return "#808080"
    }
  }

  static fromLatex(_cmd: string, parser: LatexParser): Command {
    return new CmdColor(parser.text())
  }

  static init(cursor: Cursor, { input }: InitProps) {
    new CmdColor(CmdColor.parse(input)).insertAt(cursor, L)
  }

  private readonly elColor
  private readonly elField
  private readonly elLabel

  constructor(readonly color: string) {
    color = CmdColor.parse(color)

    const elLabel = h(
      "text-[60%] font-mono text-center w-full text-white align-[-.15em] inline-flex px-[.4em]",
      color.slice(1),
    )

    const elField = hx("input", {
      type: "color",
      value: color,
      class: "sr-only",
      autocomplete: "off",
    })

    const elColor = h(
      "inline-block h-[1.5em] align-[.15em] py-[.1em] my-[.1em] rounded-[.1875em]",
      elField,
      elLabel,
    )

    elColor.style.backgroundColor = color
    elLabel.style.color = brightness(color) > 0.6 ? "black" : "white"

    super("\\color", h("px-[.1em]", hx("label", "contents", elColor)))

    this.elColor = elColor
    this.elField = elField
    this.elLabel = elLabel

    this.elField.addEventListener("input", () => {
      this.setColor(this.elField.value)
    })
  }

  setColor(color: string) {
    color = CmdColor.parse(color)
    this.elColor.style.backgroundColor = color
    this.elLabel.style.color = brightness(color) > 0.6 ? "black" : "white"
    this.elLabel.textContent = color.slice(1)
    ;(this as any).color = color
  }

  reader(): string {
    return ` Color, ${this.color}, EndColor `
  }

  ascii(): string {
    return `color(${this.color})`
  }

  latex(): string {
    const color = CmdColor.parse(this.color)
    // TODO: make this also copy as a color node
    return `\\operatorname{rgb}\\left(\
${parseInt(color.slice(1, 3), 16)},\
${parseInt(color.slice(3, 5), 16)},\
${parseInt(color.slice(5, 7), 16)}\\right)`
  }
}
