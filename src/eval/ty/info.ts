import type { SPoint, TyComponents, TyName, Tys } from "."
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h, p, svgx } from "../../jsx"
import type { Paper, Point } from "../../sheet/ui/paper"
import type { GlslContext } from "../lib/fn"
import type { Write } from "./display"

export interface Garbage<T> {
  js: T
  glsl: string
}

export interface TyInfo<T, U extends TyName> {
  name: string
  namePlural: string
  glsl: string
  garbage: Garbage<T>
  coerce: TyCoerceMap<T>
  write: Write<T>
  icon(): HTMLSpanElement
  glide?(props: GlideProps<T>): { value: number; precision: number }
  components?: TyComponentInfo<T, U>
}

export interface TyComponentInfo<T, U extends TyName> {
  ty: U
  at: [(val: T) => Tys[U], (val: string) => string][]
}

export interface GlideProps<T> {
  shape: T
  point: Point
  paper: Paper
}

export interface Plot<T> {
  canvas(value: T, paper: Paper): void
}

export type TyCoerceMap<T> = {
  [K in keyof Tys]?: TyCoerce<T, Tys[K]>
}

export interface TyCoerce<T, U> {
  js(self: T): U
  glsl(self: string, ctx: GlslContext): string
}

export type TyInfoMap = {
  [K in keyof Tys]: TyInfo<Tys[K], TyComponents[K]>
}

export const WRITE_POINT: Write<SPoint> = {
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
  [{ x: x1, y: y1 }, { x: x2, y: y2 }]: [Point, Point],
  { x, y }: Point,
  paper: Paper,
) {
  const B = Math.hypot(x1 - x, y1 - y)
  const A = Math.hypot(x2 - x, y2 - y)
  const C = Math.hypot(x1 - x2, y1 - y2)

  const a = (C * C + B * B - A * A) / (2 * C)

  return {
    value: a / C,
    precision:
      paper.canvasDistance({ x: x1, y: y1 }, { x: x2, y: y2 }) /
      Math.hypot(x1 - x2, y1 - y2),
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
        p(
          "M7 0 5 0A1 1 0 004 1L4 3A1 1 0 005 4L7 4A1 1 0 008 3L8 1A1 1 0 007 0ZM3 8 1 8A1 1 0 000 9L0 11A1 1 0 001 12L3 12A1 1 0 014 13L4 15A1 1 0 005 16L7 16 7 16A1 1 0 008 15L8 13A1 1 0 019 12L11 12A1 1 0 0112 13L12 15A1 1 0 0013 16L15 16A1 1 0 0016 15L16 13A1 1 0 0117 12L19 12A1 1 0 0020 11L20 9A1 1 0 0019 8L17 8A1 1 0 0016 9L16 11A1 1 0 0115 12L13 12A1 1 0 0112 11L12 9A1 1 0 0011 8L9 8A1 1 0 008 9L8 11A1 1 0 017 12L5 12A1 1 0 014 11L4 9A1 1 0 003 8ZM15 0 13 0A1 1 0 0012 1L12 3A1 1 0 0013 4L15 4A1 1 0 0016 3L16 1A1 1 0 0015 0Z",
        ),
      ),
    ),
  )
}

export const TY_INFO: TyInfoMap = Object.create(null) as any
