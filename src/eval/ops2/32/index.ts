import type { As, GlslContext } from "../../fn"
import type { FnDist } from "../../fn/dist"
import type { SExact, SPoint, SReal } from "../../ty"

export interface FnNumJs<T extends readonly unknown[]> {
  approx(values: As<T, number>, raw: As<T, SReal>): SReal
  exact?(...exacts: As<T, SExact>): SReal | null
  point(this: FnNumJsExt<T>, ...points: As<T, SPoint>): SPoint
}

/**
 * The {@linkcode FnNumJsExt.real} function is installed on every
 * {@linkcode FnNumJs} instance automatically; this interface declares that it
 * always exists, but stops the user from having to provide it.
 */
export interface FnNumJsExt<T extends readonly unknown[]> extends FnNumJs<T> {
  real(...values: As<T, SReal>): SReal
}

export interface FnNumGlsl<T extends readonly unknown[]> {
  real(ctx: GlslContext, ...inputs: As<T, string>): string
  complex(ctx: GlslContext, ...inputs: As<T, string>): string
}

/**
 * Creates a {@linkcode Fn} which operates on lists by distributing over them and
 * which is primarily used on real and complex values.
 */
export function fnNum<T extends readonly unknown[]>(
  name: string,
  js: FnNumJs<T>,
  glsl: FnNumGlsl<T>,
): FnDist {}
