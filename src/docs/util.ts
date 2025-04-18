import { h, hx } from "@/jsx"

export function makeDocName(name: string, deitalicize = false) {
  let inv = name.endsWith("^-1")
  if (inv) {
    name = name.slice(0, -3)
  }

  let sub = name.endsWith("_")
  if (sub) {
    name = name.slice(0, -1)
  }

  return h(
    "font-['Symbola'] text-[1.265rem]/[1.15]",
    inv || /^[.\s\p{L}]+$/u.test(name) || deitalicize ?
      h(
        /^[a-z]$/.test(name) && !deitalicize ? "italic" : "",
        h(
          "font-['Times_New_Roman'] [line-height:.9]",
          ...(name.includes(" ") ?
            name.split(" ").map((x, i) => h(i == 0 ? "" : "ml-[.1em]", x))
          : [name]),
          sub ? hx("sub", "italic", "x") : null,
          inv ? hx("sup", "font-['Symbola']", "-1") : null,
        ),
      )
    : h("", name),
  )
}
