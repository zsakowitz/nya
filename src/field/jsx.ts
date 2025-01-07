export const U_NO_BREAK_SPACE = "\u00A0"
export const U_ZERO_WIDTH_SPACE = "\u200B"
export const U_DOT_ABOVE = "\u02D9"
export const U_NARY_SUMMATION = "\u2211"
export const U_NARY_PRODUCT = "\u220F"
export const U_NARY_COPRODUCT = "\u2210"
export const U_INTEGRAL = "\u222B"

export function h(
  cl?: string | Record<string, string>,
  ...children: (Node | string | null)[]
) {
  return hx("span", cl, ...children)
}

export function hx<K extends keyof HTMLElementTagNameMap>(
  name: K,
  cl?: string | Record<string, string>,
  ...children: (Node | string | null)[]
) {
  const el = document.createElement(name)
  if (typeof cl == "string") {
    el.className = cl
  } else if (cl) {
    for (const key in cl) {
      el.setAttribute(key, cl[key]!)
    }
  }
  for (const child of children) {
    if (child) {
      el.append(child)
    }
  }
  return el
}

export function t(text: string) {
  return document.createTextNode(text)
}

export function p(d: string) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path")
  el.setAttribute("d", d)
  return el
}

export function svg(viewBox: string, ...children: ChildNode[]) {
  return svgx(
    viewBox,
    "fill-current absolute top-0 left-0 w-full h-full",
    ...children,
  )
}

export function svgx(
  viewBox: string,
  className: string,
  ...children: ChildNode[]
) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  el.setAttribute("preserveAspectRatio", "none")
  el.setAttribute("viewBox", viewBox)
  el.setAttribute("class", className)
  for (const child of children) {
    el.appendChild(child)
  }
  return el
}

export type ViewBox = `${number} ${number} ${number} ${number}`

export function usvg(
  classes: string,
  viewBox: ViewBox,
  d: string,
  stroke = 0.4,
) {
  const [x1, y1, w, h] = viewBox.split(" ").map(parseFloat)
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  el.setAttribute("preserveAspectRatio", "none")
  el.setAttribute(
    "viewBox",
    `${x1! - stroke / 2} ${y1! - stroke / 2} ${w! + stroke} ${h! + stroke}`,
  )
  el.setAttribute("fill", "none")
  el.setAttribute("stroke", "currentColor")
  el.setAttribute("stroke-width", "" + stroke)
  el.setAttribute("stroke-linecap", "square")
  el.setAttribute("stroke-linejoin", "miter")
  el.setAttribute("stroke-miterlimit", "100")
  el.setAttribute("class", classes)
  el.appendChild(p(d))
  return el
}
