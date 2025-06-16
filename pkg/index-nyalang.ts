export const NYALANG_PACKAGES_BUILTIN = {
  __proto__: null,
  "nya:point": ()=>Promise.resolve({default:{"name":"2D points","label":null,"category":"auto-generated (nyalang)","deps":[],"scripts":["point"]} as const}),
  "nya:3d/point": ()=>Promise.resolve({default:{"name":"3d points","label":"cross-products and basic arithmetic on three-dimensional points","category":"auto-generated (nyalang)","deps":[],"scripts":["3d/point"]} as const}),
} as const

export const NYALANG_PACKAGES_ADDONS = {
  __proto__: null,
  "nya:4d/point": ()=>Promise.resolve({default:{"name":"4d points","label":"basic operations on 4d points","category":"auto-generated (nyalang)","deps":[],"scripts":["4d/point"]} as const}),
} as const
