import { Impl, type NyaApi, v } from "../emit/api"

export function libNumBool(api: NyaApi) {
  const num = api.scalar("num", "float", true)
  const bool = api.scalar("bool", "bool", true)
  api.scalar("sym", "symint", true)
  api.opaque("void", { glsl: null, js: null })

  // Boolean operators
  api.f1("&&", { v1: bool, v2: bool }, bool, v`${0}&&${1}`) // TODO: formalize short circuiting
  api.f1("||", { v1: bool, v2: bool }, bool, v`${0}||${1}`) // TODO: formalize short circuiting
  api.f1("==", { v1: bool, v2: bool }, bool, v`${0}==${1}`)
  api.f1("!=", { v1: bool, v2: bool }, bool, v`${0}!=${1}`)
  api.f1("!", { arg: bool }, bool, v`!${0}`)

  api.f1("+", { value: num }, num, v`${0}`)
  api.f1("-", { value: num }, num, v`-${0}`)
  // Basic numeric operators
  for (const op of "+-*/") api.f1(op, { lhs: num, rhs: num }, num, v`${0}${op}${1}`)
  // @+ @- @* @/
  for (const op of ["==", "!=", "<", ">", "<=", ">="]) api.f1(op, { lhs: num, rhs: num }, bool, v`${0}${op}${1}`)
  // @-
  api.fn("^", { lhs: num, rhs: num }, num, {
    glsl: v`${"float %%(float x,float y){return y==floor(y)?mod(y,2.)==0.?pow(abs(x),y):pow(abs(x),y)*sign(x):pow(x,y);}"}(${0},${1})`,
    js: v`${0}**${1}`,
  })
  api.fn("%", { lhs: num, rhs: num }, num, {
    glsl: v`mod(${0},${1})`,
    js: v`${"function %%(a,b){return((a%b)+b)%b}"}(${0},${1})`,
  })

  // Special functions
  for (const op of "sin cos tan asin acos atan sinh cosh tanh asinh acosh atanh exp abs cbrt sqrt ceil floor trunc sign log10".split(" ")) {
    api.fn(op, { value: num }, num, {
      glsl: v`${op}(${0})`,
      js: v`${`const %%=Math.${op}`}(${0})`,
    })
    api.fb("@" + op, { value: "float" }, "float", false, {
      glslN: v`${op}(${0})`,
      js1: v`${`const %%=Math.${op}`}(${0})`,
    })
  }
  api.fn("ln", { value: num }, num, {
    glsl: v`log(${0})`,
    js: v`${`const %%=Math.log`}(${0})`,
  })
  api.fn("round", { value: num }, num, {
    glsl: v`floor(${0}+0.5)`,
    js: v`${`const %%=Math.round`}(${0})`,
  })
  api.fn("inv", { value: num }, num, { glsl: v`1./${0}`, js: v`1/${0}` })
  /* fract */ {
    const fn = new Impl()
    const floor = fn.cache(`const %%=Math.floor`)
    const fract = fn.cache(`function %%(x){return x-${floor}(x)}`)
    api.fn("fract", { value: num }, num, {
      glsl: v`fract(${0})`,
      js: fn.of`${fract}(${0})`,
    })
  }
  /* @fract */ {
    const fn = new Impl()
    const floor = fn.cache(`const %%=Math.floor`)
    const fract = fn.cache(`function %%(x){return x-${floor}(x)}`)
    api.fb("@fract", { value: "float" }, "float", false, {
      glslN: v`fract(${0})`,
      js1: fn.of`${fract}(${0})`,
    })
  }
  api.fn("atan", { y: num, x: num }, num, {
    glsl: v`atan(${0},${1})`,
    js: v`${`const %%=Math.atan2`}(${0},${1})`,
  })
  api.fn("hypot", { v1: num, v2: num }, num, {
    glsl: v`length(vec2(${0},${1}))`,
    js: v`${`const %%=Math.hypot`}(${0},${1})`,
  })
  api.fn("min", { v1: num, v2: num }, num, {
    glsl: v`min(${0},${1})`,
    js: v`${`const %%=Math.min`}(${0},${1})`,
  })
  api.fn("max", { v1: num, v2: num }, num, {
    glsl: v`max(${0},${1})`,
    js: v`${`const %%=Math.max`}(${0},${1})`,
  })
  api.fn("clamp", { value: num, min: num, max: num }, num, {
    glsl: v`clamp(${0},${1},${2})`,
    js: v`${`const %%=Math.min`}(${`const %%=Math.max`}(${0},${1}),${2})`,
  })
  api.fb("@clamp", { value: "float", min: num, max: num }, "float", false, {
    glslN: v`clamp(${0},${1},${2})`,
    js1: v`${`const %%=Math.min`}(${`const %%=Math.max`}(${0},${1}),${2})`,
  })
  // ~=

  // Mathematical constants
  api.f1("pos_inf", {}, num, v`1./0.`)
  api.f1("neg_inf", {}, num, v`-1./0.`)
  api.f1("any_inf", {}, num, v`1./0.`)
  api.f1("unsigned_inf", {}, num, v`1./0.`) // TODO: replace with signed infinities
  api.f1("inf", {}, num, v`1./0.`) // TODO: replace with signed infinities
  api.f1("nan", {}, num, v`0./0.`)
  api.f1("pi", {}, num, v`${"" + Math.PI}`)
  api.f1("e", {}, num, v`${"" + Math.E}`)

  // Numeric checks
  api.fn("is_inf", { value: num }, bool, {
    glsl: v`isinf(${0})`,
    js: v`${`function %%(x){return x===1/0||x===-1/0;}`}(${0})`,
  })
  api.fn("is_nan", { value: num }, bool, {
    glsl: v`isnan(${0})`,
    js: v`${`const %%=isNaN`}(${0})`,
  })
  api.fn("is_finite", { value: num }, bool, {
    glsl: v`${`bool %%(float x){return !(isinf(x)||isnan(x));}`}(${0})`,
    js: v`${`const %%=isFinite`}(${0})`,
  })

  // @mix(vec<num>, vec<num>, num)
  // @clamp(vec<num>, vec<num>, vec<num>)
  // @fract(vec<num>)
  // @compiletimelog(any)
}
