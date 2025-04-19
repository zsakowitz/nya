import { FnDist } from "@/eval/ops/dist"

export const FN_ARC = new FnDist(
  "arc",
  "constructs an arc from three points",
).add(
  ["point32", "point32", "point32"],
  "arc",
  (a, b, c) => [a.value, b.value, c.value],
  (_, a, b, c) => `mat3x2(${a.expr}, ${b.expr}, ${c.expr})`,
  "arc((2,3),(9,-10),(1,5))",
)
// TODO: arc from a circle, start angle, and end angle
// TODO: arc from segment
//   .add(
//     ["circle", "r32", "r32"],
//     "arc",
//     (ar, br, cr) => {
//       const d = (a: number, b: number) =>
//         (((a + b) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
//
//       const a1r = br.value.num()
//       const a3r = cr.value.num()
//       let a1 = a1r % (2 * Math.PI)
//       let a3 = a3r % (2 * Math.PI)
//       if (a1r < a3r) {
//         if (a1 > a3) {
//           a1 -= 2 * Math.PI
//         }
//       } else {
//         if (a1 < a3) {
//           a3 -= 2 * Math.PI
//         }
//       }
//       let a2 = a1 + (Math.min(d(a3, a1), d(a1, a3)) / 2) * Math.sign(a3 - a1)
//       const c = ar.value.center.ns()
//       const r = ar.value.radius.num()
//
//       return [
//         rept(px(Math.cos(a1) * r + c.x, Math.sin(a1) * r + c.y)),
//         rept(px(Math.cos(a2) * r + c.x, Math.sin(a2) * r + c.y)),
//         rept(px(Math.cos(a3) * r + c.x, Math.sin(a3) * r + c.y)),
//       ]
//     },
//     () => {
//       // TODO:
//       throw new Error("Cannot convert a circle into an arc in shaders yet.")
//     },
//   )
