export const U_NO_BREAK_SPACE = "\u00A0"
export const U_ZERO_WIDTH_SPACE = "\u200B"
export const U_DOT_ABOVE = "\u02D9"
export const U_NARY_SUMMATION = "\u2211"
export const U_NARY_PRODUCT = "\u220F"
export const U_NARY_COPRODUCT = "\u2210"
export const U_INTEGRAL = "\u222B"

export function h(
  cl?: string | Record<string, string>,
  ...children: ChildNode[]
) {
  const el = document.createElement("span")
  if (typeof cl == "string") {
    el.className = cl
  } else if (cl) {
    for (const key in cl) {
      el.setAttribute(key, cl[key]!)
    }
  }
  for (const child of children) {
    el.appendChild(child)
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
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  el.setAttribute("preserveAspectRatio", "none")
  el.setAttribute("viewBox", viewBox)
  el.setAttribute("class", "fill-current absolute top-0 left-0 w-full h-full")
  for (const child of children) {
    el.appendChild(child)
  }
  return el
}
