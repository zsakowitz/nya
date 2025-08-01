import { PosVirtual } from "!/ast/issue"
import { Block, BlockGlobals, Exits } from "!/emit/decl"
import { tryPerformCall } from "!/emit/emit"
import { Id, ident } from "!/emit/id"
import { type Type } from "!/emit/type"
import { Value } from "!/emit/value"
import type { ScriptEnvironment } from "!/exec/loader"
import type { CanvasJs, PathStyled } from "!/std"

type ExecKey = number & ((...args: any[]) => any)

export interface UtilityFn {
  display: { exec(value: unknown): string }
  "plot-2d":
    | {
        output: "pt"
        exec(cv: CanvasJs, value: unknown): { x: number; y: number }
      }
    | { output: "path1"; exec(cv: CanvasJs, value: unknown): Path2D }
    | { output: "path1*"; exec(cv: CanvasJs, value: unknown): PathStyled }
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
  private stale = false

  constructor(readonly lib: ScriptEnvironment) {}

  markStale() {
    if (!this.stale) {
      this.stale = true
      queueMicrotask(() => this.recollect())
    }
  }

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
    const tyPath = lib.ty("Path")!
    const tyPathStyled = lib.ty("PathStyled")!

    // collecting functions so they can be evaluated in bulk means only one eval()
    // is necessary, but has the downside of not having actual callables until
    // all JS is finished. but that's fine, since
    const ret: [Value[], Block, Value][] = []

    const utilities: Utilities = newUtilities()

    const pos1 = new PosVirtual("UtilityFnCache.recollect")
    const globals = new BlockGlobals(lib)
    for (const [name, ty] of lib.types.all()) {
      const arg = new Value(new Id(name).ident(), ty, false)

      {
        const b1 = new Block(globals, new Exits(null))
        const val = tryPerformCall(ident("%display"), b1, [arg], pos1, pos1)
        if (val && val.type == tyLatex) {
          utilities["display"].set(ty, {
            exec: (ret.push([[arg], b1, val]) - 1) as ExecKey,
          })
        }
      }

      {
        const v1 = new Value("canvas", tyCanvas, false)
        const b1 = new Block(globals, new Exits(null))
        const val = tryPerformCall(ident("%plot_2d"), b1, [v1, arg], pos1, pos1)
        if (val) {
          const kind =
            val.type == tyCanvasPoint ? "pt"
            : val.type == tyPath ? "path1"
            : val.type == tyPathStyled ? "path1*"
            : null
          if (kind) {
            utilities["plot-2d"].set(ty, {
              output: kind,
              exec: (ret.push([[v1, arg], b1, val]) - 1) as ExecKey,
            })
          }
        }
      }
    }

    const fns = this.lib.evalRaw(`
${Array.from(globals.get()).join("\n")}
;[
${ret
  .map(([args, block, ret]) => {
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
