import { int, type SReal } from "@/lib/real"
import { UNIT_KIND_NAMES, UNIT_KINDS, type UnitKind } from "./kind"
import { UNIT_KIND_VALUES } from "./units"

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

export function toSI(list: UnitList): ConversionFactor {
  let scale = int(1)
  let offset = int(0)

  for (const {
    exp,
    unit: { base },
  } of list) {
    const ox = base.offset.pow(exp)
    const sx = base.scale.pow(exp)
    offset = offset.add(ox)
    scale = scale.mul(sx)
  }

  return { scale, offset }
}

export function convert(value: SReal, via: ConversionFactor) {
  return value.mul(via.scale).add(via.offset)
}

export function convertInv(value: SReal, via: ConversionFactor) {
  return value.sub(via.offset).div(via.scale)
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
      .filter((x) => x.exp.num() != 0)
      .map(({ exp, unit: { label } }) => `${label}${exponent(exp.num())}`)
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
      data[unit] = (data[unit] ?? int(0)).add(exp.mul(int(localExp)))
    }
  }

  return data
}

export function siUnit(src: UnitList): UnitList {
  const data = si(src)

  return UNIT_KINDS.map((kind): UnitEntry | undefined => {
    const exp = data[kind]
    if (exp && exp.num() != 0) {
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
    const sv = s ? s.num() : 0
    const dv = d ? d.num() : 0
    if (sv != dv) {
      throw new Error(
        `Powers of ${UNIT_KIND_NAMES[ty]} differ in units '${name(src)}' (${sv}) and '${name(dst)}' (${dv}).`,
      )
    }
  }
}

export function factor(src: UnitList, dst: UnitList): ConversionFactor {
  assertCompat(src, dst)
  const sf = toSI(src)
  const df = toSI(dst)
  return {
    scale: sf.scale.div(df.scale),
    offset: sf.offset.sub(df.offset).div(df.scale),
  }
}

const HELP = `Try:
1. If you mean a change in the measurement, prefix the variable with delta- (e.g. 1 deltafahrenheit means "a change of a single degree on the Fahrenheit scale")
2. If you actually want a measurement, convert to an absolute scale (e.g. kelvin) using the "in" operator.`

export function check(list: UnitList) {
  list = list.filter((x) => x.exp.num() != 0)

  let offset: UnitEntry | undefined

  for (const unit of list) {
    if (unit.unit.base.offset && unit.unit.base.offset.num() != 0) {
      if (unit.exp.num() != 1) {
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

// TODO: unitlist should be a class

export function badSum(src: UnitList, dst: UnitList): never {
  throw new Error(
    `Adding '${name(src)}' and '${name(dst)}' is not allowed, since both units are non-absolute. ${HELP}`,
  )
}

export function multiply(a: UnitList, b: UnitList): UnitList {
  const map = new Map<Unit, SReal>()

  for (const entry of [...a, ...b]) {
    const existing = map.get(entry.unit)
    map.set(entry.unit, existing ? existing.add(entry.exp) : entry.exp)
  }

  return check([...map].map(([unit, exp]) => ({ exp, unit })))
}

export function inv(a: UnitList): UnitList {
  return check(a.map(({ exp, unit }) => ({ exp: exp.neg(), unit })))
}

export function exp(a: UnitList, to: SReal): UnitList {
  if (to.num() == 0) {
    return []
  }

  return check(a.map(({ exp, unit }) => ({ exp: exp.mul(to), unit })))
}
