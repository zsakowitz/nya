import { Impl, type NyaApi, v } from "!/emit/api"
import { blue, dim, magenta, reset, yellow } from "./ansi"
import { AnyVector, fromScalars, scalars } from "./emit/broadcast"
import { performCall } from "./emit/emit"
import { issue } from "./emit/error"
import { Id, ident, type IdGlobal } from "./emit/id"
import { Tag } from "./emit/tag"
import { Any, Fn } from "./emit/type"
import { Value } from "./emit/value"

export function libNumBool(api: NyaApi) {
  const num = api.scalar("num", "float", true)
  const bool = api.scalar("bool", "bool", true)
  api.scalar("sym", "symint", true)
  api.opaque("void", { glsl: null, js: null })

  // Basic numeric operators
  for (const op of "+-*/")
    api.f1(op, { lhs: num, rhs: num }, num, v`${0}${op}${1}`)
  // @+ @- @* @/
  for (const op of ["==", "!=", "<", ">", "<=", ">="])
    api.f1(op, { lhs: num, rhs: num }, bool, v`${0}${op}${1}`)
  api.f1("-", { value: num }, num, v`-${0}`)
  // @-
  api.fn("^", { lhs: num, rhs: num }, num, {
    glsl: v`pow(${0},${1})`,
    js: v`${0}**${1}`,
  })
  api.fn("%", { lhs: num, rhs: num }, num, {
    glsl: v`mod(${0},${1})`,
    js: v`${"function %%(a,b){return((a%b)+b)%b}"}(${0},${1})`,
  })
  api.fn("rem", { lhs: num, rhs: num }, num, {
    glsl: v`rem(${0},${1})`,
    js: v`${0}%${1}`,
  })

  // Special functions
  for (const op of "sin cos tan asin acos atan sinh cosh tanh asinh acosh atanh exp abs cbrt sqrt ceil floor trunc sign log10".split(
    " ",
  )) {
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
    js: v`${`function %%(x){return x===1/0||x===-1/0}`}(${0})`,
  })
  api.fn("is_nan", { value: num }, bool, {
    glsl: v`isnan(${0})`,
    js: v`${`const %%=isNaN`}(${0})`,
  })
  api.fn("is_finite", { value: num }, bool, {
    glsl: v`${`bool %%(float x){return !(isinf(x)||isnan(x))}`}(${0})`,
    js: v`${`const %%=isFinite`}(${0})`,
  })

  // Boolean operators
  api.f1("&&", { v1: bool, v2: bool }, bool, v`${0}&&${1}`) // TODO: formalize short circuiting
  api.f1("||", { v1: bool, v2: bool }, bool, v`${0}||${1}`) // TODO: formalize short circuiting
  api.f1("==", { v1: bool, v2: bool }, bool, v`${0}==${1}`)
  api.f1("!=", { v1: bool, v2: bool }, bool, v`${0}!=${1}`)
  api.f1("!", { arg: bool }, bool, v`!${0}`)

  // @mix(vec<num>, vec<num>, num)
  // @clamp(vec<num>, vec<num>, vec<num>)
  // @fract(vec<num>)
  // @compiletimelog(any)
}

export function libBroadcasting(api: NyaApi) {
  const num = api.lib.tyNum

  for (const c of "+-*/") {
    api.fb("@" + c, { lhs: "float", rhs: "float" }, "float", true, {
      js1: v`${0}${c}${1}`,
      glslN: v`${0}${c}${1}`,
    })
  }

  api.fb("@-", { value: "float" }, "float", true, {
    js1: v`-${0}`,
    glslN: v`-${0}`,
  })

  api.fu("@dot", { v1: "float", v2: "float" }, num, {
    glsl: v`dot(${0},${1})`,
    js2: v`${"function %%(x1,x2,y1,y2){return x1*y1+x2*y2}"}(${0},${1})`,
    js3: v`${"function %%(x1,x2,x3,y1,y2,y3){return x1*y1+x2*y2+x3*y3}"}(${0},${1},${2})`,
    js4: v`${"function %%(x1,x2,x3,x4,y1,y2,y3,y4){return x1*y1+x2*y2+x3*y3+x4*y4}"}(${0},${1},${2},${3})`,
  })

  api.fu("@length", { value: "float" }, num, {
    glsl: v`length(${0})`,
    js2: v`${"const %%=Math.hypot"}(${0},${1})`,
    js3: v`${"const %%=Math.hypot"}(${0},${1},${2})`,
    js4: v`${"const %%=Math.hypot"}(${0},${1},${2},${3})`,
  })

  /* @norm */ {
    const hypotId = new Id("Math.hypot").ident()
    const fNorm = new Fn(
      ident("@norm"),
      [{ name: "value", type: new AnyVector("float") }],
      new AnyVector("float"),
      (raw, block) => {
        const val = raw[0]!

        // const path
        if (val.const()) {
          const s0 = scalars(val, block)
          if (s0.every((x) => x.value === 0)) {
            return val
          }
          const hypot = Math.hypot(...s0.map((a) => a.value as number))
          return fromScalars(
            val.type,
            s0.map((a) => new Value((a.value as number) / hypot, num, true)),
          )
        }

        // glsl path
        if (block.lang == "glsl") {
          return new Value(`normalize(${val})`, val.type, false)
        }

        // js path
        const s0 = scalars(val, block)
        api.lib.global(`const ${hypotId}=Math.hypot;`)
        const hy = block.cache(
          new Value(`${hypotId}(${s0.join(",")})`, num, false),
          true,
        )
        return fromScalars(
          val.type,
          s0.map((x) => new Value(`(${x})/${hy}`, num, false)),
        )
      },
    )
    api.lib.fns.push(ident("@norm"), fNorm)
  }

  api.fn("@smoothstep", { edge0: num, edge1: num, at: num }, num, {
    glsl: v`smoothstep(${0},${1},${2})`,
    js: v`${"function %%(v0,v1,x){var t=(x-v0)/(v1-v0);if(t<0)t=0;if(t>1)t=1;return t*t*(3-2*t)}"}(${0},${1},${2})`,
  })

  api.fb("@mix", { edge0: "float", edge1: "float", at: num }, "float", false, {
    glslN: v`mix(${0},${1},${2})`,
    js1: v`${"function %%(v0,v1,x){return (1-x)*v0+x*v1}"}(${0},${1},${2})`,
  })

  api.lib.fns.push(
    ident("@debug"),
    new Fn(
      ident("@debug"),
      [{ name: "arg", type: Any }],
      Any,
      ([v], _, full) => {
        console.log(
          `${blue}[${_.lang}] ${yellow}${v}${reset}${dim}: ${reset}${magenta}${v!.type}${reset}${dim} in ${reset}${full}${reset}`,
        )
        return v!
      },
    ),
  )
}

export interface NyaCanvas {
  sx: number
  sy: number
  ox: number
  oy: number
  x0: number
  x1: number
  y0: number
  y1: number
  wx: number
  wy: number
}

export function libCanvas(api: NyaApi) {
  const num = api.lib.tyNum

  const Canvas = api.opaque("Canvas", { glsl: null, js: " " })
  const CanvasPoint = api.opaque("CanvasPoint", { glsl: null, js: " " })
  const CanvasDelta = api.opaque("CanvasDelta", { glsl: null, js: " " })

  api.fn("point_at", { cv: Canvas, x: num, y: num }, CanvasPoint, {
    glsl: null,
    js: v`${"function %%(cv,x,y){return {x:cv.sx*x+cv.ox,y:cv.sy*y+cv.oy}}"}(${0},${1},${2})`,
  })

  api.fn("delta_by", { cv: Canvas, d: num }, CanvasDelta, {
    glsl: null,
    js: v`${"function %%(cv,d){return {x:cv.sx*d,y:cv.sy*d}}"}(${0},${1})`,
  })

  api.fn("delta_by", { cv: Canvas, dx: num, dy: num }, CanvasDelta, {
    glsl: null,
    js: v`${"function %%(cv,x,y){return {x:cv.sx*x,y:cv.sy*y}}"}(${0},${1},${2})`,
  })

  // TODO: have a better glsl value
  api.fn("xmin", { cv: Canvas }, num, { glsl: v`0./0.`, js: v`${0}.x0` })
  api.fn("xmax", { cv: Canvas }, num, { glsl: v`0./0.`, js: v`${0}.x1` })
  api.fn("ymin", { cv: Canvas }, num, { glsl: v`0./0.`, js: v`${0}.y0` })
  api.fn("ymax", { cv: Canvas }, num, { glsl: v`0./0.`, js: v`${0}.y1` })

  const Path = api.opaque("Path", {
    glsl: null,
    js: "string",
  })

  api.fn("path", {}, Path, { glsl: null, js: v`new Path2D()` }, false)
  api.fn("move_to", { path: Path, to: CanvasPoint }, Path, {
    glsl: null,
    js: v`${"function %%(path,pt){path.moveTo(pt.x,pt.y);return path}"}(${0},${1})`,
  })
  api.fn("line_to", { path: Path, to: CanvasPoint }, Path, {
    glsl: null,
    js: v`${"function %%(path,pt){path.lineTo(pt.x,pt.y);return path}"}(${0},${1})`,
  })
  api.fn("circle", { path: Path, center: CanvasPoint, radius: num }, Path, {
    glsl: null,
    js: v`${`function %%(path,c,r){path.ellipse(c.x,c.y,r,r,0,0,${2 * Math.PI});return path}`}(${0},${1},${2})`,
  })
  api.fn(
    "ellipse",
    { path: Path, center: CanvasPoint, radii: CanvasDelta },
    Path,
    {
      glsl: null,
      js: v`${`function %%(path,c,r){path.ellipse(c.x,c.y,r.x,r.y,0,0,${2 * Math.PI});return path}`}(${0},${1},${2})`,
    },
  )
}

// TODO: this should get shorter the deeper it is; 2.349834+3.3498734i takes up too much space in a displayed list
export const numToLatex = (x: number): string => {
  if (x != x) return "\\wordvar{undefined}"
  if (x == 1 / 0) return "\\infty"
  if (x == -1 / 0) return "-\\infty"
  let str = x.toPrecision(8)
  const expIndex = str.indexOf("e")
  let exp = ""
  if (expIndex != -1) {
    const power = str.slice(expIndex + 1).replace(/^\+/, "")
    str = str.slice(0, expIndex)
    exp = "\\times10^{" + power + "}"
  }
  if (str.includes(".")) {
    str = str.replace(/\.?0*$/, "")
  }
  return str + exp
}

export function libLatex(api: NyaApi) {
  const latex = api.opaque("latex", { glsl: null, js: "string" })
  latex.toRuntime = (v) => JSON.stringify(v as any as string)

  const decl = api.lib
  const num = decl.tyNum
  const bool = decl.tyBool
  const fns = decl.fns
  const lang = decl.props.lang

  const idDisplay = ident("%display")

  // `num` %display
  {
    const idLatexHelper = new Id("%display(x: num) -> latex").ident()
    const fnLatexHelper = `const ${idLatexHelper}=${numToLatex};` // TODO: Function.prototype.toString is scary

    fns.push(
      idDisplay,
      new Fn(
        idDisplay,
        [{ name: "value", type: num }],
        latex,
        lang == "glsl" ?
          () => new Value(0, latex, true)
        : ([v]) =>
            new Value(
              v!.const() ?
                numToLatex(v.value as number)
              : (decl.global(fnLatexHelper),
                `${idLatexHelper}(${v!.toRuntime()})`),
              latex,
              // @ts-expect-error
              v!.const(),
            ),
      ),
    )
  }

  // `bool` %display
  {
    const idLatexHelper = new Id("%display(x: bool) -> latex").ident()
    const fnLatexHelper = `function ${idLatexHelper}(v){return '\\\\wordvar{'+v+'}'}`
    // prettier-ignore
    function fLatexHelper(v: boolean)                  {return   '\\wordvar{'+v+'}'}

    const f =
      lang == "glsl" ?
        () => new Value(0, latex, true)
      : ([v]: Value[]) =>
          new Value(
            v!.const() ?
              fLatexHelper(v.value as boolean)
            : (decl.global(fnLatexHelper),
              `${idLatexHelper}(${v!.toRuntime()})`),
            latex,
            // @ts-expect-error
            v!.const(),
          )
    fns.push(
      idDisplay,
      new Fn(idDisplay, [{ name: "value", type: bool }], latex, f),
    )
  }

  // `latex` %display
  {
    fns.push(
      idDisplay,
      new Fn(idDisplay, [{ name: "value", type: latex }], latex, (x) => x[0]!),
    )
  }

  function createTag(tagIdent: IdGlobal, fnIdent: IdGlobal) {
    return new Tag(
      tagIdent,
      lang == "glsl" ?
        () => new Value(0, latex, true)
      : (text, interps, interpsPos, block) => {
          const results = interps.map((x, i) => {
            const result = performCall(
              fnIdent,
              block,
              [x],
              interpsPos[i]!,
              interpsPos[i]!,
            )
            if (result.type == latex) {
              return result
            }
            issue(
              `The '${tagIdent.label}' tag cannot be used if calling %display on any interpolation does not return LaTeX.`,
            )
          })

          if (results.every((x) => x.const())) {
            return new Value(
              text
                .map((x, i) =>
                  i == 0 ? x : (results[i - 1]!.value as string) + x,
                )
                .join(""),
              latex,
              true,
            )
          }

          return new Value(
            text
              .map((x, i) =>
                i == 0 ?
                  JSON.stringify(x)
                : results[i - 1]!.toRuntime()! + "+" + JSON.stringify(x),
              )
              .join("+"),
            latex,
            false,
          )
        },
    )
  }

  decl.tags.set(ident("display"), createTag(ident("display"), idDisplay))
}

/*

type json
tag json

type Path
stroke_width(Path, num)
color(Path, vec3)
stroke_opacity(Path, num)
fill_opacity(Path, num)

type latex
tag display
%display(num)
%display(bool)
%display(latex)

 */
