import type { GlslVal } from "../ty"
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

  cache(val: GlslVal): string {
    const name = this.name()
    this.push`${TY_INFO[val.type].glsl} ${name} = ${val.expr};\n`
    return name
  }
}

export type As<T extends readonly unknown[], U> = { readonly [K in keyof T]: U }

export type Build<T, N extends number, U extends readonly any[] = []> =
  U["length"] extends N ? U : Build<T, N, [...U, T]>
