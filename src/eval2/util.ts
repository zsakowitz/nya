import { PosVirtual } from "!/ast/issue"
import { Block, Exits } from "!/emit/decl"
import { Id, ident } from "!/emit/id"
import { isType, type Type } from "!/emit/type"
import { Value } from "!/emit/value"
import type { ScriptEnvironment } from "!/exec/loader"
import type { CanvasJs } from "!/std"

type ExecKey = number & ((...args: any[]) => any)

export interface UtilityFn {
  display: {
    arg: Type
    exec: (value: unknown) => string
  }
  "plot-2d": {
    arg: Type
    output: "point"
    exec: (cv: CanvasJs, value: unknown) => { x: number; y: number }
  }
}

type Utilities = { [K in keyof UtilityFn]: Map<Type, UtilityFn[K]> }

function newUtilities(): Utilities {
  return {
    display: new Map(),
    "plot-2d": new Map(),
  }
}

export class UtilityFnCache {
  private utilities: Utilities = newUtilities()
  stale = false

  constructor(readonly lib: ScriptEnvironment) {}

  get<K extends keyof UtilityFn>(kind: K, ty: Type): UtilityFn[K] | null {
    if (this.stale) {
      this.recollect()
    }
    const list = this.utilities[kind]
    if (list.has(ty)) {
      return list.get(ty)!
    }
    return null
  }

  recollect() {
    this.stale = false

    const lib = this.lib.libJs
    const tyLatex = lib.tyLatex
    const tyCanvas = lib.ty("Canvas")!
    const tyCanvasPoint = lib.ty("CanvasPoint")!

    // collecting functions so they can be evaluated in bulk means only one eval()
    // is necessary, but has the downside of not having actual callables until
    // all JS is finished. but that's fine, since
    const ret = []

    const utilities: Utilities = newUtilities()

    for (const fn of lib.fns.get(ident("%display")) ?? []) {
      if (
        fn.args.length == 1 &&
        isType(fn.args[0]!.type) &&
        fn.ret == tyLatex
      ) {
        utilities["display"].set(fn.args[0]!.type, {
          arg: fn.args[0]!.type,
          exec: (ret.push(fn) - 1) as ExecKey,
        })
      }
    }

    for (const fn of lib.fns.get(ident("%plot_2d")) ?? []) {
      if (
        fn.args.length == 2 &&
        fn.args[0]!.type == tyCanvas &&
        isType(fn.args[1]!.type)
      ) {
        if (fn.ret == tyCanvasPoint) {
          utilities["plot-2d"].set(fn.args[1]!.type, {
            arg: fn.args[1]!.type,
            output: "point",
            exec: (ret.push(fn) - 1) as ExecKey,
          })
        }
      }
    }

    const pos = new PosVirtual("utility-fn-cache")

    const fns = this.lib.evalRaw(`[
${ret
  .map((fn) => {
    const args = fn.args.map(
      ({ name, type }) => new Value(new Id(name).ident(), type as Type, false),
    )
    const block = new Block(this.lib.libJs, new Exits(null))
    const ret = fn.run(args, block, pos, pos)
    return `(${args.map((x) => x.value).join(",")})=>{
${block.source}
return ${ret.toRuntime() ?? ""}
}`
  })
  .join(",\n")}
]`) as any[]

    for (const key in utilities) {
      for (const value of utilities[key as keyof typeof utilities].values()) {
        value.exec = fns[value.exec as ExecKey as number]
      }
    }

    this.utilities = utilities
  }
}
