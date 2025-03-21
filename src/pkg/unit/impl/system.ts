import { safe } from "@/eval/lib/util"
import type { SReal } from "@/eval/ty"
import { frac, num, real } from "@/eval/ty/create"
import { add, div, mul, neg, sub } from "@/eval/ty/ops"
import { UNIT_KIND_NAMES, UNIT_KINDS, type UnitKind } from "./kind"

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

  if (val == 0) {
    return frac(1, 0)
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

function toBase(list: UnitList): ConversionFactor {
  let scale = real(1)
  let offset = real(0)

  for (const {
    exp,
    unit: { base },
  } of list) {
    const ox = base.offset ? raise(base.offset, exp) : real(0)
    const sx = base.scale ? raise(base.scale, exp) : real(1)
    offset = add(offset, ox)
    scale = mul(scale, sx)
  }

  return { scale, offset }
}

export function convert(value: SReal, via: ConversionFactor) {
  return add(mul(value, via.scale ?? real(1)), via.offset ?? real(0))
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
  return list
    .filter((x) => num(x.exp) != 0)
    .map(({ exp, unit: { label } }) => `${label}${exponent(num(exp))}`)
    .join(" ")
}

function si(src: UnitList): SICoefficients {
  const data = Object.create(null)

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

function assertSiCompat(src: UnitList, dst: UnitList) {
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
  assertSiCompat(src, dst)
  const sf = toBase(src)
  const df = toBase(dst)
  return {
    scale: div(sf.scale, df.scale),
    offset: div(sub(sf.offset, df.offset), df.scale),
  }
}

export function multiply(a: UnitList, b: UnitList): UnitList {
  const map = new Map<Unit, SReal>()

  for (const entry of [...a, ...b]) {
    const existing = map.get(entry.unit)
    map.set(entry.unit, existing ? add(existing, entry.exp) : entry.exp)
  }

  return [...map].map(([unit, exp]) => ({ exp, unit }))
}

export function inv(a: UnitList): UnitList {
  return a.map(({ exp, unit }) => ({ exp: neg(exp), unit }))
}

export function exp(a: UnitList, to: SReal): UnitList {
  if (num(to) == 0) {
    return []
  }

  return a.map(({ exp, unit }) => ({ exp: mul(exp, to), unit }))
}
