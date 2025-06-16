import { KFalse, KTrue, TFloat, TInt, TSym } from "../ast/kind"
import {
  AnyVector,
  createBinaryBroadcastingFn,
  createUnaryBroadcastingFn,
  fromScalars,
  scalars,
} from "./broadcast"
import { Declarations, PRECACHED, type Block } from "./decl"
import { performCall } from "./emit"
import { bug, issue } from "./error"
import { ident as g, Id, ident, IdGlobal } from "./id"
import type { EmitProps, Lang } from "./props"
import { Tag } from "./tag"
import {
  fn,
  Fn,
  invalidType,
  Scalar,
  type FnExec,
  type FnParam,
  type FnType,
  type Type,
} from "./type"
import { Value } from "./value"

export interface PathJs {
  x: Path2D
  y: [number, number, number]
  z: [number, number, number] // stroke width, stroke opacity, fill opacity
}

export interface CanvasJs {
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

function libPath(props: EmitProps, num: Scalar) {
  function vec(count: 2 | 3 | 4): FnType {
    function canConvertFrom(type: Type) {
      return (
        type.repr.type == "vec" &&
        type.repr.count == count &&
        type.repr.of == "float"
      )
    }

    const self: FnType = {
      canConvertFrom,
      convertFrom(value, pos) {
        if (!canConvertFrom(value.type)) {
          invalidType(`vec${count}<float>`, value.type, pos)
        }
        return value
      },
      toString() {
        return `vec${count}<float>`
      },
    }

    return self
  }

  interface PathJs {
    data: {
      x: string // svg path
      y: [number, number, number] // color
      z: [number, number, number] // stroke width, stroke opacity, fill opacity
    }
  }

  const lang = props.lang

  const path = new Scalar(
    "Path",
    lang == "glsl" ? "void" : "NyaPath", // TODO: generate appropriate ts signature
    lang == "glsl" ? { type: "void" } : { type: "struct", id: new Id("Path") },
    lang == "glsl" ?
      () => null
    : (v) => {
        const d = (v as PathJs).data
        return `({x:new Path2D(${JSON.stringify(d.x)}),y:${JSON.stringify(d.y)},z:${JSON.stringify(d.z)}})`
      },
    () => issue(`Cannot convert 'Path' into scalars.`),
    () => issue(`Cannot create 'Path' from scalars.`),
  )
  const canvas = new Scalar(
    "Canvas",
    lang == "glsl" ? "void" : "NyaCanvas", // TODO: generate appropriate ts signature
    lang == "glsl" ?
      { type: "void" }
    : { type: "struct", id: new Id("Canvas") },
    () =>
      bug(
        `Cannot convert 'Canvas' into a runtime value since it should never be created at compile time.`,
      ),
    () => issue(`Cannot convert 'Canvas' into scalars.`),
    () => issue(`Cannot create 'Canvas' from scalars.`),
  )

  const xpath = { name: "path", type: path }
  const vec2 = vec(2)
  const vec3 = vec(3)

  const pDest = { name: "destination", type: vec2 }
  const pCenter = { name: "center", type: vec2 }
  const pRadius = { name: "radius", type: num }
  const pRadiusX = { name: "radius_x", type: num }
  const pRadiusY = { name: "radius_y", type: num }
  const pRadii = { name: "radii", type: vec2 }
  const pColorRgb = { name: "color_rgb", type: vec3 }

  function canvasProp(nyaname: string, jsname: string) {
    return fn(
      g(nyaname),
      [{ name: "canvas", type: canvas }],
      num,
      lang == "glsl" ?
        () => new Value(NaN, num)
      : ([cv]) => new Value(`(${cv}).${jsname}`, num),
    )
  }

  return {
    types: [path, canvas],
    fns: [
      fn(
        g("to_cv_coords"),
        [
          { name: "point", type: vec2 },
          { name: "canvas", type: canvas },
        ],
        vec2,
        lang == "glsl" ?
          ([a]) => a!
        : ([pt, cv], block): Value => {
            const [x, y] = scalars(pt!, block)
            const c = block.cache(cv!, true).toRuntime()!
            return fromScalars(pt!.type, [
              new Value(`(${c}).sx*(${x})+(${c}).ox`, num),
              new Value(`(${c}).sy*(${y})+(${c}).oy`, num),
            ])
          },
      ), // to_cv_coords
      fn(
        g("to_cv_delta"),
        [
          { name: "point", type: vec2 },
          { name: "canvas", type: canvas },
        ],
        vec2,
        lang == "glsl" ?
          ([a]) => a!
        : ([pt, cv], block): Value => {
            const [x, y] = scalars(pt!, block)
            const c = block.cache(cv!, true).toRuntime()!
            return fromScalars(pt!.type, [
              new Value(`(${c}).sx*(${x})`, num),
              new Value(`-(${c}).sy*(${y})`, num),
            ])
          },
      ), // to_cv_delta
      fn(
        g("to_math_coords"),
        [
          { name: "point", type: vec2 },
          { name: "canvas", type: canvas },
        ],
        vec2,
        lang == "glsl" ?
          ([a]) => a!
        : ([pt, cv], block): Value => {
            const [x, y] = scalars(pt!, block)
            const c = block.cache(cv!, true).toRuntime()!
            return fromScalars(pt!.type, [
              new Value(`((${x})-(${c}).ox)/(${c}).sx`, num),
              new Value(`((${y})-(${c}).oy)/(${c}).sy`, num),
            ])
          },
      ), // to_math_coords
      canvasProp("xmin", "x0"),
      canvasProp("ymin", "y0"),
      canvasProp("xmax", "x1"),
      canvasProp("ymax", "y1"),

      pathFn(
        "path",
        [],
        () =>
          new Value(
            { data: { x: "", y: [0, 0, 0], z: [0, 0, 0] } } satisfies PathJs,
            path,
          ),
      ), // empty_path
      pathEditingFn(
        "move_to",
        [pDest],
        (d, [dest]) => {
          const [x, y] = dest!.type.toScalars(dest!)
          d.data.x += `M${x} ${y}`
        },
        (d, [dest], block) => {
          const [x, y] = scalars(dest!, block)
          block.source += `${d}.x.moveTo(${x},${y});`
        },
      ), // move_to
      pathEditingFn(
        "line_to",
        [pDest],
        (d, [dest]) => {
          const [x, y] = dest!.type.toScalars(dest!)
          d.data.x += `L${x} ${y}`
        },
        (d, [dest], block) => {
          const [x, y] = scalars(dest!, block)
          block.source += `${d}.x.lineTo(${x},${y});`
        },
      ), // line_to
      pathEditingFn(
        "circle",
        [pCenter, pRadius],
        null,
        (d, [center, radius], block) => {
          const [x, y] = scalars(center!, block)
          const r = block.cache(radius!, true)
          block.source += `${d}.x.ellipse(${x},${y},${r},${r},0,0,${2 * Math.PI});`
        },
      ), // circle
      pathEditingFn(
        "ellipse",
        [pCenter, pRadii],
        null,
        (d, [center, radii], block) => {
          const [x, y] = scalars(center!, block)
          const [rx, ry] = scalars(radii!, block)
          block.source += `${d}.x.ellipse(${x},${y},${rx},${ry},0,0,${2 * Math.PI});`
        },
      ), // ellipse(center, { rx, ry })
      pathEditingFn(
        "ellipse",
        [pCenter, pRadiusX, pRadiusY],
        null,
        (d, [center, rxraw, ryraw], block) => {
          const [x, y] = scalars(center!, block)
          block.source += `${d}.x.ellipse(${x},${y},${rxraw!},${ryraw!},0,0,${2 * Math.PI});`
        },
      ), // ellipse(center, rx, ry)
      // TODO: arc arcTo bezierCurveTo closePath ellipse quadraticCurveTo rect roundRect
      // https://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes

      pathEditingFn(
        "stroke_width",
        [{ name: "width", type: num }],
        (d, [a]) => (d.data.z[0] = a!.value as number),
        (d, [a], block) => (block.source += `${d}.z[0]=${a};`),
      ), // stroke_width
      pathEditingFn(
        "color",
        [pColorRgb],
        (d, [c]) => {
          const [r, g, b] = c!.toScalars()
          d.data.y = [
            r!.value as number,
            g!.value as number,
            b!.value as number,
          ]
        },
        (d, [c], block) => {
          const [r, g, b] = scalars(c!, block)
          block.source += `${d}.y=[${r},${g},${b},1];`
        },
      ), // color(rgb)
      pathEditingFn(
        "stroke_opacity",
        [{ name: "opacity", type: num }],
        (d, [a]) => (d.data.z[1] = a!.value as number),
        (d, [a], block) => (block.source += `${d}.z[1]=${a};`),
      ), // stroke_opacity
      pathEditingFn(
        "fill_opacity",
        [{ name: "opacity", type: num }],
        (d, [a]) => (d.data.z[2] = a!.value as number),
        (d, [a], block) => (block.source += `${d}.z[2]=${a};`),
      ), // fill_opacity
    ],
  }

  function pathFn(name: string, params: FnParam[], exec: FnExec) {
    return new Fn(
      g(name),
      params,
      path,
      lang == "glsl" ? () => new Value(null, path) : exec,
    )
  }

  function pathEditingFn(
    name: string,
    params: FnParam[],
    execConst: ((d: PathJs, args: Value[]) => void) | null,
    execRuntime: (d: string, args: Value[], block: Block) => void,
  ) {
    return new Fn(
      g(name),
      [xpath, ...params],
      path,
      lang == "glsl" ?
        () => new Value(null, path)
      : (args, block): Value => {
          if (execConst && args.every((x) => x.const())) {
            execConst(args[0]!.value as PathJs, args.slice(1))
            return args[0]!
          } else {
            let runtime = args[0]!.toRuntime()!
            if (!PRECACHED.test(runtime)) {
              const id = new Id("cached path").ident()
              block.source += `${id}=${runtime};`
              runtime = id
            }
            execRuntime(runtime, args.slice(1), block)
            return new Value(runtime, path)
          }
        },
    )
  }
}

function libLatexScalar(lang: Lang) {
  return new Scalar(
    "latex",
    lang == "glsl" ? "void" : "string",
    lang == "glsl" ? { type: "void" } : { type: "struct", id: new Id("latex") },
    lang == "glsl" ?
      () => null
    : (v) => JSON.stringify((v as { data: string }).data),
    () => issue(`Cannot convert LaTeX text to a set of scalars.`),
    () => issue(`Cannot create LaTeX text from a set of scalars.`),
  )
}

function libLatex(decl: Declarations, num: Scalar, bool: Scalar) {
  const fns = decl.fns
  const lang = decl.props.lang

  const idDisplay = g("%display")

  const latex = decl.tyLatex

  // `num` %display
  {
    // TODO: this should get shorter the deeper it is; 2.349834+3.3498734i takes up too much space in a displayed list
    const fLatexHelper = (x: number): string => {
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

    const idLatexHelper = new Id("%display(x: num) -> latex").ident()
    const fnLatexHelper = `const ${idLatexHelper}=${fLatexHelper};` // TODO: Function.prototype.toString is scary

    fns.push(
      idDisplay,
      new Fn(
        idDisplay,
        [{ name: "value", type: num }],
        latex,
        lang == "glsl" ?
          () => new Value(0, latex)
        : ([v]) =>
            new Value(
              v!.const() ?
                { data: fLatexHelper(v.value as number) }
              : (decl.global(fnLatexHelper),
                `${idLatexHelper}(${v!.toRuntime()})`),
              latex,
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
        () => new Value(0, latex)
      : ([v]: Value[]) =>
          new Value(
            v!.const() ?
              { data: fLatexHelper(v.value as boolean) }
            : (decl.global(fnLatexHelper),
              `${idLatexHelper}(${v!.toRuntime()})`),
            latex,
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
        () => new Value(0, latex)
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
              {
                data: text
                  .map((x, i) =>
                    i == 0 ? x : (
                      (results[i - 1]!.value as { data: string }).data + x
                    ),
                  )
                  .join(""),
              },
              latex,
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
          )
        },
    )
  }

  decl.tags.set(g("display"), createTag(g("display"), idDisplay))
  decl.types.set(g("latex"), latex)
}

export function createStdlib(props: EmitProps) {
  const lang = props.lang
  const epsilon = lang == "glsl" ? 1.1920928955078125e-7 : Number.EPSILON

  const num = new Scalar(
    "num",
    lang == "glsl" ? "float" : "number",
    { type: "vec", count: 1, of: "float" },
    (v) => {
      if (Number.isNaN(v)) {
        return `(0./0.)`
      } else if (v == 1 / 0) {
        return `(1./0.)`
      } else if (v == -1 / 0) {
        return `(-1./0.)`
      }
      const name = (v as number).toString()
      if (name.includes(".") || name.includes("e")) {
        return name
      } else {
        return name + "."
      }
    },
    (v) => [v],
    (v) => v.pop()!,
  )
  const bool = new Scalar(
    "bool",
    lang == "glsl" ? "bool" : "boolean",
    { type: "vec", count: 1, of: "bool" },
    (v) => "" + (v as boolean),
    (v) => [v],
    (v) => v.pop()!,
  )
  const sym = new Scalar(
    "sym",
    lang == "glsl" ? "uint" : "number",
    { type: "vec", count: 1, of: "symint" },
    (v) => "" + (v as number),
    (v) => [v],
    (v) => v.pop()!,
  )
  const void_: Scalar = new Scalar(
    "void",
    "void",
    { type: "void" },
    () => null,
    () => [],
    () => new Value(0, void_),
  )

  const decl = new Declarations(
    props,
    null,
    void_,
    bool,
    (literal) => {
      switch (literal.value.kind) {
        case KTrue:
        case KFalse:
          return new Value(literal.value.val === "true", bool)

        case TFloat:
        case TInt:
          return new Value(+literal.value.val, num)

        case TSym:
          return new Value(g(literal.value.val).value, sym)
      }
    },
    (value) => {
      if (
        value.type == num &&
        typeof value.value == "number" &&
        Number.isSafeInteger(value.value)
      ) {
        return value.value
      }

      return null
    },
    libLatexScalar(lang),
    num,
  )

  const pathLib = libPath(props, num)
  libLatex(decl, num, bool)
  for (const v of [num, bool, ...pathLib.types]) {
    decl.types.set(g(v.name), v)
  }

  const lnum = { name: "lhs", type: num }
  const rnum = { name: "rhs", type: num }
  const anum = { name: "a", type: num }
  const bnum = { name: "b", type: num }
  const xnum = { name: "x", type: num }
  const ynum = { name: "y", type: num }

  const lbool = { name: "lhs", type: bool }
  const rbool = { name: "rhs", type: bool }
  const xbool = { name: "x", type: bool }

  const bxl = { name: "lhs", type: "float" as const }
  const bxr = { name: "rhs", type: "float" as const }
  const bxx = { name: "x", type: "float" as const }

  function numBinOpArith(
    op: "+" | "-" | "*" | "/",
    of: (a: number, b: number) => number,
  ) {
    return [
      new Fn(g(op), [lnum, rnum], num, ([a, b]) => {
        if (a!.const() && b!.const()) {
          return new Value(of(a.value as number, b.value as number), num)
        }
        return new Value(`(${a})${op}(${b})`, num)
      }),
      createBinaryBroadcastingFn(props, g("@" + op), bxl, bxr, num, {
        glsl1: (a, b) => `(${a})${op}(${b})`,
        glslVec: (a, b) => `(${a})${op}(${b})`,
        js1: (a, b) => `(${a})${op}(${b})`,
        const: of as any,
      }),
    ]
  }

  function numBinOpBool(
    op: "<" | ">" | "==" | "!=" | "<=" | ">=",
    ret: Scalar,
    of: (a: number, b: number) => number | boolean,
  ) {
    return new Fn(g(op), [lnum, rnum], ret, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value(of(a.value as number, b.value as number), ret)
      }
      return new Value(`(${a})${op}(${b})`, ret)
    })
  }

  function boolBinOp(
    op: "&&" | "||" | "==" | "!=",
    of: (a: boolean, b: boolean) => boolean,
  ) {
    return new Fn(g(op), [lbool, rbool], bool, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value(of(a.value as boolean, b.value as boolean), bool)
      }
      return new Value(`(${a})${op}(${b})`, bool)
    })
  }

  function numMathOp(fnName: string, name = fnName) {
    const op = Math[name as keyof typeof Math] as (x: number) => number
    const id = new Id(fnName).ident()
    return new Fn(g(fnName), [xnum], num, ([a]) => {
      if (a!.const()) {
        return new Value(op(a.value as number), num)
      }
      if (props.lang == "glsl") {
        return new Value(`${name}(${a})`, num)
      }
      decl.global(`const ${id}=Math.${name};`)
      return new Value(`${id}(${a})`, num)
    })
  }

  const atanId = new Id("Math.atan2").ident()
  const hypotId = new Id("Math.hypot").ident()
  const absId = new Id("Math.abs").ident()
  const isFiniteId = new Id("is_finite").ident()
  const minId = new Id("Math.min").ident()
  const maxId = new Id("Math.max").ident()
  const fractId = new Id("fract").ident()
  const modId = new Id("mod").ident()
  const roundId = new Id("Math.round").ident()
  const modFn = `function ${modId}(a,b){return ((a%b)+b)%b}`
  const fractFn = () =>
    decl.global(`function ${fractId}(x){return x-Math.floor(x)}`)

  const fns: Fn[] = [
    // Easy numeric operators
    ...numBinOpArith("+", (a, b) => a + b),
    ...numBinOpArith("-", (a, b) => a - b),
    ...numBinOpArith("*", (a, b) => a * b),
    ...numBinOpArith("/", (a, b) => a / b),
    numBinOpBool("<", bool, (a, b) => a < b),
    numBinOpBool(">", bool, (a, b) => a > b),
    numBinOpBool("<=", bool, (a, b) => a <= b),
    numBinOpBool(">=", bool, (a, b) => a >= b),
    numBinOpBool("==", bool, (a, b) => a == b),
    numBinOpBool("!=", bool, (a, b) => a != b),

    // Annoying numeric operators
    new Fn(g("-"), [xnum], num, ([a]) => {
      if (a!.const()) {
        return new Value(-(a.value as number), num)
      }
      return new Value(`-(${a})`, num)
    }),
    createUnaryBroadcastingFn(props, g("@-"), bxx, num, {
      glsl1: (a) => `-(${a})`,
      glslVec: (a) => `-(${a})`,
      js1: (a) => `-(${a})`,
      const: (a) => -(a as number),
    }),
    new Fn(g("^"), [lnum, rnum], num, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value((a.value as number) ** (b.value as number), num)
      }
      return new Value(
        lang == "glsl" ? `pow(${a},${b})` : `(${a})**(${b})`,
        num,
      )
    }),
    // % is used for true modulo, which matches the sign of the divisor
    new Fn(g("%"), [lnum, rnum], num, ([a, b]) => {
      if (a!.const() && b!.const()) {
        const av = a.value as number
        const bv = b.value as number
        return new Value(((av % bv) + bv) % bv, num)
      }
      if (props.lang == "glsl") {
        // Love it when programming languages implement `mod` as `mod` and not `rem`.
        return new Value(`mod(${a},${b})`, num)
      }
      decl.global(modFn)
      return new Value(`${modId}(${a},${b})`, num)
    }),
    new Fn(g("rem"), [lnum, rnum], num, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value((a.value as number) % (b.value as number), num)
      }
      return new Value(lang == "glsl" ? `mod(${a},${b})` : `(${a})%(${b})`, num)
    }),

    // Easy numeric functions
    ..."sin cos tan asin acos atan sinh cosh tanh asinh acosh atanh exp abs cbrt sqrt ceil floor trunc sign log10"
      .split(" ")
      .map((x) => numMathOp(x)),
    numMathOp("ln", "log"),

    // Annoying numeric functions
    new Fn(g("round"), [xnum], num, ([a]) => {
      if (a!.const()) {
        return new Value(Math.round(a.value as number), num)
      }
      if (props.lang == "glsl") {
        return new Value(`floor(${a}+0.5)`, num)
      }
      decl.global(`const ${roundId}=Math.round;`)
      return new Value(`${roundId}(${a})`, num)
    }),
    new Fn(g("fract"), [{ name: "value", type: num }], num, (raw, block) => {
      const a = raw[0]!

      // const path
      if (a.const()) {
        return new Value(
          (a.value as number) - Math.floor(a.value as number),
          num,
        )
      }

      // glsl path
      if (block.lang == "glsl") {
        return new Value(`fract(${a})`, num)
      }

      // js path
      fractFn()
      return new Value(`${fractId}(${a})`, num)
    }),
    new Fn(g("atan"), [ynum, xnum], num, ([y, x]) => {
      if (y!.const() && x!.const()) {
        return new Value(Math.atan2(y.value as number, x.value as number), num)
      }
      if (props.lang != "glsl") {
        decl.global(`const ${atanId}=Math.atan2;`)
      }
      return new Value(
        props.lang == "glsl" ? `atan(${y},${x})` : `${atanId}(${y},${x})`,
        num,
      )
    }),
    new Fn(g("hypot"), [anum, bnum], num, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value(Math.hypot(a.value as number, b.value as number), num)
      }
      if (props.lang != "glsl") {
        decl.global(`const ${hypotId}=Math.hypot;`)
      }
      return new Value(
        props.lang == "glsl" ?
          `length(vec2(${a!},${b!}))`
        : `${hypotId}(${a!},${b!})`,
        num,
      )
    }),
    new Fn(g("min"), [anum, bnum], num, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value(Math.min(a.value as number, b.value as number), num)
      }
      if (props.lang != "glsl") {
        decl.global(`const ${minId}=Math.min;`)
      }
      return new Value(
        props.lang == "glsl" ? `min(${a},${b})` : `${minId}(${a},${b})`,
        num,
      )
    }),
    new Fn(g("max"), [anum, bnum], num, ([a, b]) => {
      if (a!.const() && b!.const()) {
        return new Value(Math.max(a.value as number, b.value as number), num)
      }
      if (props.lang != "glsl") {
        decl.global(`const ${maxId}=Math.max;`)
      }
      return new Value(
        props.lang == "glsl" ? `max(${a},${b})` : `${maxId}(${a},${b})`,
        num,
      )
    }),
    // clamp currently outputs `max` if `min>max`; this should not be considered
    // defined behavior, and may change in the future to match the CSS spec
    // instead of the GLSL spec.
    new Fn(
      g("clamp"),
      [
        { name: "value", type: num },
        { name: "min", type: num },
        { name: "max", type: num },
      ],
      num,
      ([a, min, max]) => {
        if (a!.const() && min!.const() && max!.const()) {
          return new Value(
            Math.min(
              Math.max(a.value as number, min.value as number),
              max.value as number,
            ),
            num,
          )
        }
        if (props.lang == "glsl") {
          return new Value(`clamp(${a},${min},${max})`, num)
        }

        decl.global(`const ${minId}=Math.min;`)
        decl.global(`const ${maxId}=Math.max;`)
        return new Value(`${minId}(${maxId}(${a},${min}),${max})`, num)
      },
    ),
    new Fn(g("~="), [lnum, rnum], bool, ([l, r]) => {
      if (l!.const() && r!.const()) {
        return new Value(
          Math.abs((l.value as number) - (r.value as number)) < epsilon,
          bool,
        )
      }
      if (props.lang != "glsl") {
        decl.global(`const ${absId}=Math.abs;`)
      }
      return new Value(
        props.lang == "glsl" ?
          `abs((${l!})-(${r!}))<${epsilon}`
        : `${absId}((${l!})-(${r!}))<${epsilon}`,
        bool,
      )
    }),

    // Numeric constants
    new Fn(g("inf"), [], num, () => new Value(1 / 0, num)),
    // `inf_unsigned` is a signal to the reader, but is equal to `inf`
    new Fn(g("inf_unsigned"), [], num, () => new Value(1 / 0, num)),
    new Fn(g("nan"), [], num, () => new Value(0 / 0, num)),
    new Fn(g("pi"), [], num, () => new Value(Math.PI, num)),
    new Fn(g("e"), [], num, () => new Value(Math.E, num)),
    new Fn(g("epsilon"), [], num, () => new Value(epsilon, num)),

    // Numeric checks
    new Fn(g("is_inf"), [xnum], bool, ([a]) => {
      if (a!.const()) {
        return new Value(1 / (a.value as number) == 0, bool)
      }
      return new Value(
        props.lang == "glsl" ? `isinf(${a})` : `1.0/(${a})==0.0`,
        bool,
      )
    }),
    new Fn(g("is_nan"), [xnum], bool, ([a]) => {
      if (a!.const()) {
        return new Value(isNaN(a.value as number), bool)
      }
      return new Value(
        props.lang == "glsl" ? `isnan(${a})` : `isNaN(${a})`,
        bool,
      )
    }),
    new Fn(g("is_finite"), [xnum], bool, ([a]) => {
      if (a!.const()) {
        return new Value(isFinite(a.value as number), bool)
      }
      if (props.lang == "glsl") {
        decl.global(`bool ${isFiniteId}(float x){return!isnan(x)&&!isinf(x);}`)
      }
      return new Value(
        props.lang == "glsl" ? `${isFiniteId}(${a})` : `isFinite(${a})`,
        bool,
      )
    }),

    // Easy boolean operators
    boolBinOp("&&", (a, b) => a && b),
    boolBinOp("||", (a, b) => a || b),
    boolBinOp("==", (a, b) => a == b),
    boolBinOp("!=", (a, b) => a != b),

    // Annoying boolean operators
    new Fn(g("!"), [xbool], bool, ([a]) => {
      if (a!.const()) {
        return new Value(!(a.value as boolean), bool)
      }
      return new Value(`!(${a})`, bool)
    }),

    // @-style builtins
    new Fn(
      g("@mix"),
      [
        { name: "start", type: new AnyVector("float") },
        { name: "end", type: new AnyVector("float") },
        { name: "at", type: num },
      ],
      new AnyVector("float"),
      (raw, block) => {
        const [v0, v1, at] = raw as [Value, Value, Value]

        if (v0.type != v1.type) {
          issue(`The first two arguments to @mix must be the same type.`)
        }

        // const path
        if (v0.const() && v1.const() && at.const()) {
          const s0 = scalars(v0, block)
          const s1 = scalars(v1, block)

          const mixval = at.value as number
          return fromScalars(
            v0.type,
            s0.map(
              (a, i) =>
                new Value(
                  (a.value as number) * (1 - mixval) +
                    (s1[i]!.value as number) * mixval,
                  num,
                ),
            ),
          )
        }

        // glsl path
        if (block.lang == "glsl") {
          return new Value(`mix(${v0},${v1},${at})`, v0.type)
        }

        // js path
        {
          const s0 = scalars(v0, block)
          const s1 = scalars(v1, block)
          const mv = block.cache(at, true)
          return fromScalars(
            v0.type,
            s0.map(
              (a, i) => new Value(`(${a})*(1.-${mv})+(${s1[i]!}*(${mv}))`, num),
            ),
          )
        }
      },
    ),
    // Note: @clamp currently follows GLSL rules where if min>max, the result is
    // `max`. This is the opposite of CSS's result, which would give `min`
    // instead. This should be considered temporarily undefined behavior, and
    // leaving min>max may give different results in the future.
    new Fn(
      g("@clamp"),
      [
        { name: "value", type: new AnyVector("float") },
        { name: "min", type: new AnyVector("float") },
        { name: "max", type: new AnyVector("float") },
      ],
      new AnyVector("float"),
      (raw, block) => {
        const [val, min, max] = raw as [Value, Value, Value]

        if (min.type == num && max.type == num) {
          // const path
          if (min.const() && max.const() && val.const()) {
            const sval = scalars(val, block)

            return fromScalars(
              val.type,
              sval.map(
                (a) =>
                  new Value(
                    Math.min(
                      Math.max(a.value as number, min.value as number),
                      max.value as number,
                    ),
                    num,
                  ),
              ),
            )
          }

          // glsl path
          if (block.lang == "glsl") {
            return new Value(`clamp(${val},${min},${max})`, val.type)
          }

          // js path
          {
            const s0 = block.cache(min, true)
            const s1 = block.cache(max, true)
            const s2 = scalars(val, block)
            decl.global(`const ${minId}=Math.min;`)
            decl.global(`const ${maxId}=Math.max;`)
            return fromScalars(
              val.type,
              s2.map(
                (a) => new Value(`${minId}(${maxId}(${a},${s0}),${s1})`, num),
              ),
            )
          }
        }

        if (min.type != max.type || max.type != val.type) {
          issue(`All arguments to @clamp must be the same type.`)
        }

        // const path
        if (min.const() && max.const() && val.const()) {
          const smin = scalars(min, block)
          const smax = scalars(max, block)
          const sval = scalars(val, block)

          return fromScalars(
            min.type,
            sval.map(
              (a, i) =>
                new Value(
                  Math.min(
                    Math.max(a.value as number, smin[i]!.value as number),
                    smax[i]!.value as number,
                  ),
                  num,
                ),
            ),
          )
        }

        // glsl path
        if (block.lang == "glsl") {
          return new Value(`clamp(${min},${max},${val})`, min.type)
        }

        // js path
        {
          const s0 = scalars(min, block)
          const s1 = scalars(max, block)
          const s2 = scalars(val, block)
          decl.global(`const ${minId}=Math.min;`)
          decl.global(`const ${maxId}=Math.max;`)
          return fromScalars(
            min.type,
            s2.map(
              (a, i) =>
                new Value(`${minId}(${maxId}(${a},${s0[i]}),${s1[i]})`, num),
            ),
          )
        }
      },
    ),
    new Fn(
      g("@length"),
      [{ name: "value", type: new AnyVector("float") }],
      num,
      (raw, block) => {
        const val = raw[0]!

        // const path
        if (val.const()) {
          const s0 = scalars(val, block)
          return new Value(Math.hypot(...s0.map((a) => a.value as number)), num)
        }

        // glsl path
        if (block.lang == "glsl") {
          return new Value(`length(${val})`, num)
        }

        // js path
        const s0 = scalars(val, block)
        decl.global(`const ${hypotId}=Math.hypot;`)
        return new Value(`${hypotId}(${s0.join(",")})`, num)
      },
    ),
    new Fn(
      g("@dot"),
      [
        { name: "a", type: new AnyVector("float") },
        { name: "b", type: new AnyVector("float") },
      ],
      num,
      (raw, block) => {
        const val1 = raw[0]!
        const val2 = raw[1]!

        // const path
        if (val1.const() && val2.const()) {
          const s1 = scalars(val1, block)
          const s2 = scalars(val2, block)
          return new Value(
            s1.reduce(
              (a, b, i) => a + (b.value as number) * (s2[i]!.value as number),
              0,
            ),
            num,
          )
        }

        // glsl path
        if (block.lang == "glsl") {
          return new Value(`dot(${val1},${val2})`, num)
        }

        // js path
        const s1 = scalars(val1, block)
        const s2 = scalars(val2, block)
        return new Value(
          `(${s1.map((a, i) => `${a}*${s2[i]!}`).join("+")})`,
          num,
        )
      },
    ),
    new Fn(
      g("@norm"),
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
            s0.map((a) => new Value((a.value as number) / hypot, num)),
          )
        }

        // glsl path
        if (block.lang == "glsl") {
          return new Value(`normalize(${val})`, val.type)
        }

        // js path
        const s0 = scalars(val, block)
        decl.global(`const ${hypotId}=Math.hypot;`)
        const hy = block.cache(
          new Value(`${hypotId}(${s0.join(",")})`, num),
          true,
        )
        return fromScalars(
          val.type,
          s0.map((x) => new Value(`(${x})/${hy}`, num)),
        )
      },
    ),
    new Fn(
      g("@abs"),
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
          return fromScalars(
            val.type,
            s0.map((a) => new Value(Math.abs(a.value as number), num)),
          )
        }

        // glsl path
        if (block.lang == "glsl") {
          return new Value(`abs(${val})`, val.type)
        }

        // js path
        const s0 = scalars(val, block)
        decl.global(`const ${absId}=Math.abs;`)
        return fromScalars(
          val.type,
          s0.map((x) => new Value(`${absId}(${x})`, num)),
        )
      },
    ),
    new Fn(
      g("@fract"),
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
          return fromScalars(
            val.type,
            s0.map(
              (a) =>
                new Value(
                  (a.value as number) - Math.floor(a.value as number),
                  num,
                ),
            ),
          )
        }

        // glsl path
        if (block.lang == "glsl") {
          return new Value(`fract(${val})`, val.type)
        }

        // js path
        const s0 = scalars(val, block)
        fractFn()
        return fromScalars(
          val.type,
          s0.map((x) => new Value(`${fractId}(${x})`, num)),
        )
      },
    ),

    ...pathLib.fns,
  ]

  for (const f of fns) {
    decl.fns.push(f.id as IdGlobal, f)
  }

  const json = new Scalar(
    "json",
    lang == "glsl" ? "void" : "string",
    lang == "glsl" ? { type: "void" } : { type: "struct", id: new Id("Json") },
    (v) => `(${JSON.stringify((v as { data: unknown }).data)})`,
    () => issue(`Cannot convert raw JSON data into scalars.`),
    () => issue(`Cannot convert scalars into raw JSON data.`),
  )
  decl.types.set(ident("json"), json)
  decl.tags.set(
    ident("json"),
    new Tag(ident("json"), (text) => {
      if (text.length != 1) {
        issue(`The 'json' tag accepts a single string.`)
      }
      try {
        return new Value({ data: JSON.parse(text[0]!) }, json)
      } catch {
        issue(`Malformed JSON was passed to the 'json' tag.`)
      }
    }),
  )

  return decl
}
