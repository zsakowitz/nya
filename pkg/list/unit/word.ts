import type { Addon } from "#/types"
import type { Builtin } from "@/eval/ops/vars"
import type { JsValue } from "@/eval/ty"
import { real } from "@/eval/ty/create"
import { unitsInShadersError } from "./pkg"
import { UNITS } from "./util/units"

const { min, ...acceptableUnits } = UNITS

export default {
  name: "shorter unit names",
  label:
    "adds every unit name as a short variable; most letters cannot be used as variables after enabling this",
  category: "measurement",
  deps: ["unit/pkg"],
  eval: {
    var: Object.fromEntries(
      Object.entries(acceptableUnits).map(([k, v]) => [
        k,
        {
          js: {
            type: "unit",
            list: false,
            value: [{ exp: real(1), unit: v }],
          } satisfies JsValue<"unit">,
          display: false,
          get glsl() {
            return unitsInShadersError()
          },
          label: `the unit ${v.label}`,
          word: true,
        } satisfies Builtin,
      ]),
    ),
  },
} satisfies Addon
