import { options } from "../field/defaults"
import { exts, tyExts } from "./ext/defaults"
import type { Props } from "./ui/sheet"

export const props: Props = {
  exts,
  options: options,
  tyExts: tyExts,
}
Object.freeze(props)
