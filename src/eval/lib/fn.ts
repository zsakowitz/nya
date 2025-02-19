import type { GlslVal, GlslValue, TyName } from "../ty"
import { TY_INFO } from "../ty/info"

export class GlslHelpers {
  helpers = ""
  private next = 0

  name() {
    return `_nya_helper_${this.next++}`
  }

  private templateHelpers: TemplateStringsArray[] = []

  declare(source: TemplateStringsArray) {
    if (this.templateHelpers.indexOf(source) == -1) {
      this.templateHelpers.push(source)
      ;(this as any).helpers += source[0]!
      if (!source[0]!.endsWith("\n")) {
        console.error(source)
      }
    }
  }
}

export class GlslContext {
  block = ""

  constructor(readonly helpers: GlslHelpers) {}

  name() {
    return this.helpers.name()
  }

  glsl(source: TemplateStringsArray) {
    this.helpers.declare(source)
  }

  fork() {
    return new GlslContext(this.helpers)
  }

  /**
   * Better than `ctx.block += ...` because += will ignore any additions made
   * while the RHS executes, whereas .push will first write any additions made
   * in the RHS, then add the final value of the template literal.
   */
  push(strings: TemplateStringsArray, ...interps: (string | number)[]) {
    for (let i = 0; i < strings.length; i++) {
      if (i != 0) {
        this.block += interps[i - 1]
      }
      this.block += strings[i]
    }
  }

  cachedNative(ty: string, val: string, list?: number | false): string {
    if (val.match(/^([A-Za-z_]+|\d+|\d*\.\d+|\d+\.)$/)) {
      return val
    }

    const name = this.name()
    this
      .push`${ty} ${name}${typeof list == "number" ? `[${list}]` : ""} = ${val};\n`
    return name
  }

  cached(ty: TyName, val: string, list?: number | false): string {
    return this.cachedNative(TY_INFO[ty].glsl, val, list)
  }

  cache(val: GlslVal & { list?: false }): string {
    return this.cached(val.type, val.expr)
  }

  cacheValue(val: GlslValue): string {
    return this.cached(val.type, val.expr, val.list)
  }
}

export type As<T extends readonly unknown[], U> = { readonly [K in keyof T]: U }

export type Build<T, N extends number, U extends readonly any[] = []> =
  U["length"] extends N ? U : Build<T, N, [...U, T]>

export type GlslResult = readonly [block: GlslContext, expr: string]
