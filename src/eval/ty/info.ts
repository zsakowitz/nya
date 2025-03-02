import type { SPoint, TyComponents, TyName, Tys } from "."
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h, path, svgx } from "../../jsx"
import type { Paper, Point } from "../../sheet/ui/paper"
import type { GlslContext } from "../lib/fn"
import type { TyWrite } from "./display"

interface TyGarbage<T> {
  js: T
  glsl: string
}

export interface TyInfo<T, U extends TyName> {
  name: string
  namePlural: string
  glsl: string
  garbage: TyGarbage<T>
  coerce: TyCoerceMap<T>
  write: TyWrite<T>
  icon(): HTMLSpanElement
  token?(val: T): HTMLSpanElement | null
  glide?: TyGlide<T>
  components?: TyComponentInfo<T, U>
}

export type TyInfoByName<T extends TyName> = TyInfo<Tys[T], TyComponents[T]>

export type TyGlide<T> = (props: GlideProps<T>) => {
  value: number
  /** Number of values the user can choose. */
  precision: number
}

interface TyComponentInfo<T, U extends TyName> {
  ty: U
  at: [(val: T) => Tys[U], (val: string) => string][]
}

interface GlideProps<T> {
  shape: T
  point: Point
  paper: Paper
}

export type TyCoerceMap<T> = {
  [K in keyof Tys]?: TyCoerce<T, Tys[K]>
}

export interface TyCoerce<T, U> {
  js(self: T): U
  glsl(self: string, ctx: GlslContext): string
}

type TyInfoMap = {
  [K in keyof Tys]: TyInfo<Tys[K], TyComponents[K]>
}

export const WRITE_POINT: TyWrite<SPoint> = {
  isApprox(value) {
    return value.x.type == "approx" || value.y.type == "approx"
  },
  display(value, props) {
    const block = new Block(null)
    new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
    const inner = props.at(block.cursor(R))
    inner.num(value.x)
    new CmdComma().insertAt(inner.cursor, L)
    inner.num(value.y)
  },
}

export function gliderOnLine(
  paper: Paper,
  [p1, p2]: [Point, Point],
  { x, y }: Point,
) {
  const { x: x1, y: y1 } = p1
  const { x: x2, y: y2 } = p2

  const B = Math.hypot(x1 - x, y1 - y)
  const A = Math.hypot(x2 - x, y2 - y)
  const C = Math.hypot(x1 - x2, y1 - y2)

  const a = (C * C + B * B - A * A) / (2 * C)

  return {
    value: a / C,
    precision: paper.offsetDistance(p1, p2),
  }
}

export function highRes() {
  return h(
    "absolute bottom-[.5px] right-[1px] font-['Symbola'] text-[50%]/[1]",
    "+",
  )
}

export function any(
  color: "text-[#fa7e19]" | "text-[#2d70b3]" = "text-[#fa7e19]",
) {
  return h(
    "",
    h(
      color +
        " size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      svgx(
        "0 0 20 16",
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] fill-current -rotate-90",
        path(
          "M7 0 5 0A1 1 0 004 1L4 3A1 1 0 005 4L7 4A1 1 0 008 3L8 1A1 1 0 007 0ZM3 8 1 8A1 1 0 000 9L0 11A1 1 0 001 12L3 12A1 1 0 014 13L4 15A1 1 0 005 16L7 16 7 16A1 1 0 008 15L8 13A1 1 0 019 12L11 12A1 1 0 0112 13L12 15A1 1 0 0013 16L15 16A1 1 0 0016 15L16 13A1 1 0 0117 12L19 12A1 1 0 0020 11L20 9A1 1 0 0019 8L17 8A1 1 0 0016 9L16 11A1 1 0 0115 12L13 12A1 1 0 0112 11L12 9A1 1 0 0011 8L9 8A1 1 0 008 9L8 11A1 1 0 017 12L5 12A1 1 0 014 11L4 9A1 1 0 003 8ZM15 0 13 0A1 1 0 0012 1L12 3A1 1 0 0013 4L15 4A1 1 0 0016 3L16 1A1 1 0 0015 0Z",
        ),
      ),
    ),
  )
}

export const TY_INFO: TyInfoMap = Object.create(null) as any

TY_INFO.never = {
  name: "never",
  namePlural: "nevers",
  garbage: {
    js: "__never",
    glsl: "false",
  },
  glsl: "bool",
  coerce: new Proxy<TyCoerceMap<never>>(
    {},
    {
      get(_, prop) {
        return {
          js() {
            return TY_INFO[prop as TyName].garbage.js
          },
          glsl() {
            return TY_INFO[prop as TyName].garbage.glsl
          },
        }
      },
      has() {
        return true
      },
      ownKeys() {
        const keys = Object.keys(TY_INFO)
        const idx = keys.indexOf("never")
        if (idx != -1) keys.splice(idx, 1)
        return keys
      },
      getOwnPropertyDescriptor(_, prop) {
        return {
          configurable: true,
          enumerable: true,
          value: {
            js() {
              return TY_INFO[prop as TyName].garbage.js
            },
            glsl() {
              return TY_INFO[prop as TyName].garbage.glsl
            },
          },
        }
      },
    },
  ),
  write: {
    isApprox(_) {
      return false
    },
    display(_, props) {
      new CmdWord("undefined").insertAt(props.cursor, L)
    },
  },
  icon() {
    return h(
      "",
      h(
        "text-[theme(colors.slate.500)] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        h(
          "w-[30px] h-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[45deg] border-dashed",
        ),
      ),
    )
  },
}

export function tidyCoercions() {
  let go = true
  while (go) {
    go = false
    for (const [ty, info] of Object.entries(TY_INFO)) {
      for (const src in info.coerce) {
        for (const dst in TY_INFO[src as TyName].coerce) {
          if (!(dst in info.coerce)) {
            go = true
            ;((info.coerce as TyCoerceMap<any>)[dst as TyName] as TyCoerce<
              any,
              any
            >) = {
              js(self) {
                return TY_INFO[src as TyName].coerce[dst as TyName]!.js(
                  info.coerce[src as TyName]!.js(self as never) as never,
                )
              },
              glsl(self, ctx) {
                return TY_INFO[src as TyName].coerce[dst as TyName]!.glsl(
                  info.coerce[src as TyName]!.glsl(self as never, ctx) as never,
                  ctx,
                )
              },
            }
            console.warn(
              `[coerce], '${ty}' coerces to '${src}' but not '${dst}', but '${src}' coerces to '${dst}'; adding a relationship`,
            )
          }
        }
      }
    }
  }
}
