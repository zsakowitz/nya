import { L, R, type Dir } from "@/field/dir"
import { Infix, Leaf, Prefix, PrxIfx, Suffix, type IR } from "./node"

export const PExponent = 16
export const PProduct = 15
export const PImplicitFnCall = 14 // should not be used as an actual precedence
export const PSum = 13
export const PConversion = 12
export const PRange = 11
export const PComparison = 10
export const PBooleanAnd = 9
export const PBooleanOr = 8
export const PAction = 7
export const PColon = 6
export const PComma = 5
export const PBindingIgnoringLhsComma = 4
export const PBindingOverLhsComma = 3

export const PrecedenceAssociativity: Record<number, Dir | undefined> = {
  // @ts-expect-error typescript ignores __proto__
  __proto__: null,
  [PExponent]: R,
  [PProduct]: L,
  [PSum]: L,
  [PComparison]: L,
  [PBooleanAnd]: L,
  [PBooleanOr]: L,
  [PComma]: L,
}

function resolveOperators(ir: IR[]) {
  let expressionImmediatelyPreceding = true
  let requiresExpression = true

  for (let i = 0; i < ir.length; i++) {
    const el = ir[i]!

    switch (el.type) {
      // ... 2, x, height
      case Leaf:
        requiresExpression = false
        expressionImmediatelyPreceding = true
        break

      // ... sin, exp
      case Prefix:
        requiresExpression = true
        expressionImmediatelyPreceding = false
        break

      // ... !, ², .sin, .glider(0.5)
      case Suffix:
        if (!expressionImmediatelyPreceding) {
          throw new Error(
            `Suffix '${el.type}' encountered without preceding expression.`,
          )
        }
        requiresExpression = false
        expressionImmediatelyPreceding = true
        break

      // *, mod
      case Infix:
        if (!expressionImmediatelyPreceding) {
          throw new Error(
            `Infix operator '${el.type}' encountered without preceding expression.`,
          )
        }
        requiresExpression = true
        expressionImmediatelyPreceding = false
        break

      // +, -
      case PrxIfx:
        if (expressionImmediatelyPreceding) {
          el.type = Infix
        } else {
          el.type = Prefix
        }
        requiresExpression = true
        expressionImmediatelyPreceding = false
    }
  }
}

// sin (2 * 3)
// (sin 2) * (sin 3)
// 2 * (sin 3)
