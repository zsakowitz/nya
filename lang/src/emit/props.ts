export type Lang =
  | "js:native" // uses JS's native floating-point numbers
  | "js:native-tests"
  | "glsl"

export class EmitProps {
  constructor(readonly lang: Lang) {}
}
