import { L } from "@/field/dir"
import type { LatexParser } from "@/field/latex"
import { h } from "@/jsx"
import { Leaf } from "."
import type { Command, Cursor, InitProps } from "../../model"

function brightnessRgb(r: number, g: number, b: number) {
  return Math.sqrt(r * r * 0.241 + g * g * 0.691 + b * b * 0.068)
}

function rgb(rgb: string): [number, number, number, number] {
  const r = parseInt(rgb.slice(1, 3), 16) / 255
  const g = parseInt(rgb.slice(3, 5), 16) / 255
  const b = parseInt(rgb.slice(5, 7), 16) / 255
  return [r, g, b, rgb.length == 9 ? parseInt(rgb.slice(7, 9), 16) / 255 : 1]
}

export function brightness(colorInRGB: string) {
  const [r, g, b] = rgb(colorInRGB)
  return brightnessRgb(r, g, b)
}

export class CmdColor extends Leaf {
  static parse(name: string) {
    const el = document.createElement("span")
    el.style.color = name
    document.body.appendChild(el)
    const color = getComputedStyle(el).color
    el.remove()
    const match = /^rgba?\((\d+), (\d+), (\d+)(?:, (\d+(?:\.\d+)?))?\)$/.exec(
      color,
    )
    if (match) {
      let r = parseInt(match[1]!, 10).toString(16)
      if (r.length == 1) r = "0" + r
      let g = parseInt(match[2]!, 10).toString(16)
      if (g.length == 1) g = "0" + g
      let b = parseInt(match[3]!, 10).toString(16)
      if (b.length == 1) b = "0" + b
      let a =
        match[4] ? Math.round(255 * parseFloat(match[4]!)).toString(16) : ""
      if (a.length == 1) a = "0" + a
      return "#" + r + g + b + a
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

  constructor(readonly color: string) {
    color = CmdColor.parse(color)

    const elLabel = h(
      "text-[60%] font-mono text-center w-full text-white align-[-.2em] inline-flex px-[.4em] py-[.2em]",
      color.slice(1),
    )

    const elColor = h(
      "inline-block h-[1.5em] align-[.2em] rounded-[.1875em]",
      elLabel,
    )

    // TODO: recompute brightness when switching light/dark mode
    const [sr, sg, sb] = rgb(CmdColor.parse("var(--nya-bg-sidebar)"))
    const [cr, cg, cb, ca] = rgb(color)
    const b = brightnessRgb(
      cr * ca + sr * (1 - ca),
      cg * ca + sg * (1 - ca),
      cb * ca + sb * (1 - ca),
    )
    elColor.style.backgroundColor = color
    elLabel.style.color = b > 0.6 ? "black" : "white"

    super(
      "\\color",
      h(
        "px-[.1em]",
        h(
          {
            class: "inline-block rounded-[.1875em] my-[.1em]",
            /*! https://stackoverflow.com/a/65129916 */
            style: `background: repeating-conic-gradient(#0004 0 25%, #0000 0 50%) 50% / 0.9em 0.9em;`,
          },
          elColor,
        ),
      ),
    )
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
