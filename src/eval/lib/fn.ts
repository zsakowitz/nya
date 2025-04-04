import type { RequireRadiansContext } from "@/sheet/ui/sheet"
import type { GlslVal, GlslValue, TyName } from "../ty"
import { TY_INFO } from "../ty/info"
import type { JsContext } from "./jsctx"

export class GlslHelpers {
  helpers = ""
  private next = 0

  constructor(readonly jsCtx: JsContext) {}

  name() {
    return `_nya_helper_${this.next++}`
  }

  private templateHelpers: TemplateStringsArray[] = []

  declare(source: TemplateStringsArray) {
    if (this.templateHelpers.indexOf(source) == -1) {
      this.templateHelpers.push(source)
      ;(this as any).helpers += source[0]!
      if (!source[0]!.endsWith("\n")) {
        console.warn("[declare source invalid]", source)
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
    if (
      val.match(
        /^(?:[A-Za-z_][A-Za-z0-9_]*(?:\[\d+\])?|\d+(?:\.\d*)?|\d*\.\d+)$/,
      )
    ) {
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

  private fns = new WeakMap<TemplateStringsArray, string>()
  fn(source: TemplateStringsArray, ...interps: (GlslVal | (() => string))[]) {
    const cached = this.fns.get(source)
    if (cached != null) {
      return `${cached}(${interps
        .filter((x) => typeof x != "function")
        .map((x) => x.expr)
        .join(", ")})`
    }

    const [ret, ...first] = source[0]!.split("\n")
    const name = this.name()
    const args = interps.map((x) =>
      typeof x == "function" ? x : { arg: x, name: this.name() },
    )
    const contents = `${ret} ${name}(${args
      .filter((x) => typeof x != "function")
      .map((x) => `${TY_INFO[x.arg.type].glsl} ${x.name}`)}) {
${first.join("\n")}${source
      .slice(1)
      .map(
        (x, i) =>
          (typeof args[i] == "function" ? args[i]() : args[i]!.name) + x,
      )
      .join("")}
}\n`
    this.helpers.helpers += contents
    return `${name}(
${interps
  .filter((x) => typeof x == "object")
  .map((x) => x.expr)
  .join(",\n")}
)`
  }

  /** Returns a `float`. */
  rad() {
    return this.helpers.jsCtx.sheet.toRadiansR32()
  }

  requireRad(ctx: RequireRadiansContext) {
    return this.helpers.jsCtx.sheet.requireRadians(ctx)
  }
}

export type GlslResult = readonly [block: GlslContext, expr: string]

interface GlslFn<T extends readonly TyName[] = readonly TyName[]> {
  (ctx: GlslContext, ...args: { [K in keyof T]: GlslVal<T[K]> }): string
  glName: string
  load(ctx: GlslContext): void
  raw(ctx: GlslContext, ...args: { [K in keyof T]: string }): string
}

let fnNext = 0

export function fn<const T extends readonly TyName[], const R extends TyName>(
  tys: T,
  ret: R,
): (
  strings: TemplateStringsArray,
  ...interps: (number | GlslFn<any>)[]
) => GlslFn<T>

export function fn(tys: readonly TyName[], ret: TyName) {
  return (
    strings: TemplateStringsArray,
    ...interps: (number | GlslFn)[]
  ): GlslFn => {
    const loadFns = interps
      .map((x) => typeof x == "function" && x.load)
      .filter((x) => x != false)
    const name = `_nya_helperfn_${fnNext++}`

    const args = tys.map((x) => ({ ty: x, name: `_nya_helperfn_${fnNext++}` }))
    let source: string | undefined

    const on = new WeakSet<GlslHelpers>()
    function load(ctx: GlslContext) {
      loadFns.forEach((load) => load(ctx))
      if (!on.has(ctx.helpers)) {
        if (source == null) {
          source = `${TY_INFO[ret].glsl} ${name}(${args.map(({ ty, name }) => `${TY_INFO[ty].glsl} ${name}`).join(", ")}) {
${strings[0]!}${strings
            .slice(1)
            .map((x, i) => {
              const interp = interps[i]!
              return (
                (typeof interp == "number" ?
                  args[interp]!.name
                : interp.glName) + x
              )
            })
            .join("")}
}
`
        }
        ctx.helpers.helpers += source
        on.add(ctx.helpers)
      }
    }
    function raw(ctx: GlslContext, ...args: string[]): string {
      load(ctx)
      return `${name}(${args.join(", ")})`
    }

    function fn(ctx: GlslContext, ...args: GlslVal[]): string {
      return raw(ctx, ...args.map((x) => x.expr))
    }

    fn.glName = name
    fn.raw = raw
    fn.load = load

    return fn
  }
}
