import type { SPoint, TyComponents, TyName, Tys } from "."
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h } from "../../jsx"
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
      h(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Symbola'] text-[120%]/[1]",
        "✨",
      ),
    ),
  )
}

export const TY_INFO: TyInfoMap = Object.create(null) as any
