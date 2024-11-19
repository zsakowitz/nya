export const U_NO_BREAK_SPACE = "\u00A0"
export const U_ZERO_WIDTH_SPACE = "\u200B"
export const U_DOT_ABOVE = "\u02D9"
export const U_NARY_SUMMATION = "\u2211"
export const U_NARY_PRODUCT = "\u220F"
export const U_NARY_COPRODUCT = "\u2210"
export const U_INTEGRAL = "\u222B"

export type Clsx =
  | string
  | 0
  | 0n
  | false
  | null
  | undefined
  | Clsx[]
  | { readonly [x: string]: boolean }

export function clsx(cl: Clsx): string {
  if (!cl) {
    return ""
  }

  if (Array.isArray(cl)) {
    return cl.map(clsx).reduce((a, b) => (a && b ? a + " " + b : a || b), "")
  }

  if (typeof cl == "object") {
    let o = ""
    for (const key in cl) {
      if (key && cl[key]) {
        if (o) {
          o += " "
        }
        o += key
      }
    }
    return o
  }

  return cl
}

export function h<K extends keyof HTMLElementTagNameMap>(
  name: K,
  cl?: Clsx,
  ...children: ChildNode[]
): HTMLElementTagNameMap[K]

export function h(
  name: string,
  cl?: Clsx,
  ...children: ChildNode[]
): HTMLElement

export function h(name: string, cl?: Clsx, ...children: ChildNode[]) {
  const el = document.createElement(name)
  if (cl) {
    el.className = clsx(cl)
  }
  for (const child of children) {
    el.appendChild(child)
  }
  return el
}

export function t(text: string) {
  return document.createTextNode(text)
}
