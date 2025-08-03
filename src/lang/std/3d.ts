import { v, type NyaApi } from "../emit/api"

export type Object3D = unknown

export interface Canvas3D {
  sphere(x: number, y: number, z: number, r: number): Object3D
  point(x: number, y: number, z: number, r: number): Object3D
}

export function libPlot3D(api: NyaApi) {
  const Canvas3D = api.opaque("Canvas3D", { glsl: null, js: "" }, false)
  const Object3D = api.opaque("Canvas3DObject", { glsl: null, js: "" }, false)
  const num = api.lib.tyNum

  api.fn("sphere", { cv: Canvas3D, x: num, y: num, z: num, r: num }, Object3D, {
    glsl: null,
    js: v`${0}.sphere(${1},${2},${3},${4})`,
  })

  api.fn("point", { cv: Canvas3D, x: num, y: num, z: num, r: num }, Object3D, {
    glsl: null,
    js: v`${0}.point(${1},${2},${3},${4})`,
  })
}
