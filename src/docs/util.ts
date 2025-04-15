import { CmdNum } from "@/field/cmd/leaf/num"
import { h, hx } from "@/jsx"

export function makeDocName(name: string) {
  let inv = name.endsWith("^-1")
  if (inv) {
    name = name.slice(0, -3)
  }

  return h(
    "font-['Symbola'] text-[1.265rem]/[1.15]",
    inv || /^[.\s\p{L}]+(?:\^-1)?$/u.test(name) ?
      h(
        /^[a-z]$/.test(name) ? "italic" : "",
        h(
          "font-['Times_New_Roman'] [line-height:.9]",
          name,
          inv ? hx("sup", "font-['Symbola']", "-1") : null,
        ),
      )
    : new CmdNum(name).el,
  )
}
