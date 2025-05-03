export type Lang =
  | "js:native" // uses JS's native floating-point numbers
  | "dts"
  | "glsl"

export class EmitProps {
  constructor(readonly lang: Lang) {}
}
