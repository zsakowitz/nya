import { safe } from "@/eval/lib/util"
import type { SReal } from "@/eval/ty"
import { frac, num, real } from "@/eval/ty/create"
import { add, div, mul, neg, sub } from "@/eval/ty/ops"
import {
  UNIT_KIND_NAMES,
  UNIT_KIND_VALUES,
  UNIT_KINDS,
  type UnitKind,
} from "./kind"
import { UNITS } from "./units"

/**
 * A conversion factor from `src` to `dst`.
 *
 *     dst = src * scale + offset
 *     src = (dst - offset) / scale
 */
export interface ConversionFactor {
  /** ∆1src ÷ ∆1dst */
  scale: SReal

  /** (0src - 0dst) ÷ ∆1dst */
  offset: SReal
}

export interface BaseUnit {
  unit: UnitKind
  exp: number
}

export interface BaseUnitList extends ConversionFactor {
  dst: BaseUnit[]
}

export interface Unit {
  label: string
  base: BaseUnitList
}

export interface UnitEntry {
  unit: Unit
  exp: SReal
}

export type UnitList = UnitEntry[]

function raise(base: SReal, exp: SReal): SReal {
  const val = num(exp)

  if (num(base) == 0) {
    return frac(0, 1)
  } else if (val == 0) {
    return frac(1, 1)
  } else if (val == 1) {
    return base
  } else if (base.type == "exact" && safe(val)) {
    const n = base.n ** val
    const d = base.d ** val
    if (safe(n) && safe(d)) {
      return frac(n, d)
    }
  }

  return real(num(base) ** val)
}

export function toSI(list: UnitList): ConversionFactor {
  let scale = real(1)
  let offset = real(0)

  for (const {
    exp,
    unit: { base },
  } of list) {
    const ox = raise(base.offset, exp)
    const sx = raise(base.scale, exp)
    offset = add(offset, ox)
    scale = mul(scale, sx)
  }

  return { scale, offset }
}

export function convert(value: SReal, via: ConversionFactor) {
  return add(mul(value, via.scale), via.offset)
}

export function convertInv(value: SReal, via: ConversionFactor) {
  return div(sub(value, via.offset), via.scale)
}

function base(
  category: UnitKind | BaseUnit[],
  scale: SReal,
  offset: SReal,
): BaseUnitList {
  return {
    dst: typeof category == "string" ? [{ exp: 1, unit: category }] : category,
    scale,
    offset,
  }
}

export function unit(
  label: string,
  category: UnitKind | BaseUnit[],
  scale: SReal = frac(1, 1),
  offset: SReal = frac(0, 1),
): Unit {
  return { label, base: base(category, scale, offset) }
}

export type SICoefficients = { [x in UnitKind]?: SReal }

function exponent(value: number) {
  return (
    [
      "⁻⁹",
      "⁻⁸",
      "⁻⁷",
      "⁻⁶",
      "⁻⁵",
      "⁻⁴",
      "⁻³",
      "⁻²",
      "⁻¹",
      "⁰",
      "",
      "²",
      "³",
      "⁴",
      "⁵",
      "⁶",
      "⁷",
      "⁸",
      "⁹",
    ][value + 9] ?? `^${value}`
  )
}

export function name(list: UnitList) {
  return (
    list
      .filter((x) => num(x.exp) != 0)
      .map(({ exp, unit: { label } }) => `${label}${exponent(num(exp))}`)
      .join(" ") || "unitless"
  )
}

function si(src: UnitList): SICoefficients {
  const data: SICoefficients = Object.create(null)

  for (const {
    exp,
    unit: {
      base: { dst },
    },
  } of src) {
    for (const { exp: localExp, unit } of dst) {
      data[unit] = add(data[unit] ?? real(0), mul(exp, real(localExp)))
    }
  }

  return data
}

export function siUnit(src: UnitList): UnitList {
  const data = si(src)

  return UNIT_KINDS.map((kind): UnitEntry | undefined => {
    const exp = data[kind]
    if (exp && num(exp) != 0) {
      return { exp, unit: UNIT_KIND_VALUES[kind] }
    }
  }).filter((x) => x != null)
}

export function assertCompat(src: UnitList, dst: UnitList) {
  const si1 = si(src)
  const si2 = si(dst)

  for (const ty of UNIT_KINDS) {
    const s = si1[ty]
    const d = si2[ty]
    if (!s && !d) continue
    if (!s || !d || num(s) != num(d)) {
      throw new Error(
        `Powers of ${UNIT_KIND_NAMES[ty]} differ in units '${name(src)}' (${s ? num(s) : 0}) and '${name(dst)}' (${d ? num(d) : 0}).`,
      )
    }
  }
}

export function factor(src: UnitList, dst: UnitList): ConversionFactor {
  assertCompat(src, dst)
  const sf = toSI(src)
  const df = toSI(dst)
  return {
    scale: div(sf.scale, df.scale),
    offset: div(sub(sf.offset, df.offset), df.scale),
  }
}

const HELP = `Try:
1. If you mean a change in the measurement, prefix the variable with delta- (e.g. 1 deltafahrenheit means "a change of a single degree on the Fahrenheit scale")
2. If you actually want a measurement, convert to an absolute scale (e.g. kelvin) using the "in" operator.`

export function check(list: UnitList) {
  list = list.filter((x) => num(x.exp) != 0)

  let offset: UnitEntry | undefined

  for (const unit of list) {
    if (unit.unit.base.offset && num(unit.unit.base.offset) != 0) {
      if (num(unit.exp) != 1) {
        throw new Error(
          `'${unit.unit.label}' is non-absolute, and can't be raised to any exponent besides one. ${HELP}`,
        )
      }

      if (offset) {
        throw new Error(
          `Only one non-absolute unit is allowed in a compound unit, but two were used (${offset.unit.label} and ${unit.unit.label}). ${HELP}`,
        )
      }

      offset = unit
    }
  }

  return list
}

export function badSum(src: UnitList, dst: UnitList): never {
  throw new Error(
    `Adding '${name(src)}' and '${name(dst)}' is not allowed, since both units are non-absolute. ${HELP}`,
  )
}

export function multiply(a: UnitList, b: UnitList): UnitList {
  const map = new Map<Unit, SReal>()

  for (const entry of [...a, ...b]) {
    const existing = map.get(entry.unit)
    map.set(entry.unit, existing ? add(existing, entry.exp) : entry.exp)
  }

  return check([...map].map(([unit, exp]) => ({ exp, unit })))
}

export function inv(a: UnitList): UnitList {
  return check(a.map(({ exp, unit }) => ({ exp: neg(exp), unit })))
}

export function exp(a: UnitList, to: SReal): UnitList {
  if (num(to) == 0) {
    return []
  }

  return check(a.map(({ exp, unit }) => ({ exp: mul(exp, to), unit })))
}

console.log(toSI([{ exp: real(-1), unit: UNITS.second! }]))
