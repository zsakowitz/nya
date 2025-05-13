export type Lang = "js" | "glsl"

export class EmitProps {
  constructor(readonly lang: Lang) {}
}
