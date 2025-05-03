export type Lang =
  | "js:native" // for native javascript numbers and booleans
  | "glsl" // for glsl

export class EmitProps {
  constructor(readonly lang: Lang) {}
}
