import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { p, svgx } from "../jsx"

export function fa(icon: IconDefinition, className: string) {
  return svgx(
    `0 0 ${icon.icon[0]} ${icon.icon[1]}`,
    "overflow-visible " + className,
    p(String(icon.icon[4])),
  )
}
