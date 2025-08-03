import { issue } from "@/lib/error"
import { blue, cyan, dim, magenta, reset, yellow } from "../ansi"
import { type NyaApi, v } from "../emit/api"
import { AnyVector, fromScalars, scalars } from "../emit/broadcast"
import { Id, ident } from "../emit/id"
import { Tag } from "../emit/tag"
import { Any, Fn } from "../emit/type"
import { Value } from "../emit/value"

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
    js3: v`${"function %%(x1,x2,x3,y1,y2,y3){return x1*y1+x2*y2+x3*y3}"}(${0},${1})`,
    js4: v`${"function %%(x1,x2,x3,x4,y1,y2,y3,y4){return x1*y1+x2*y2+x3*y3+x4*y4}"}(${0},${1})`,
  })

  api.fu("@length", { value: "float" }, num, {
    glsl: v`length(${0})`,
    js2: v`${"const %%=Math.hypot"}(${0})`,
    js3: v`${"const %%=Math.hypot"}(${0})`,
    js4: v`${"const %%=Math.hypot"}(${0})`,
  })

  api.fn("@length", { v1: num, v2: num }, num, {
    glsl: v`length(vec2(${0},${1}))`,
    js: v`${"const %%=Math.hypot"}(${0},${1})`,
  })

  /* @norm */ {
    const hypotId = new Id("Math.hypot").ident()
    const fNorm = new Fn(ident("@norm"), [{ name: "value", type: new AnyVector("float") }], new AnyVector("float"), (raw, block) => {
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
          block,
        )
      }

      // glsl path
      if (block.lang == "glsl") {
        return new Value(`normalize(${val})`, val.type, false)
      }

      // js path
      const s0 = scalars(val, block)
      block.addGlobal(`const ${hypotId}=Math.hypot;`)
      const hy = block.cache(new Value(`${hypotId}(${s0.join(",")})`, num, false), true)
      return fromScalars(
        val.type,
        s0.map((x) => new Value(`(${x})/${hy}`, num, false)),
        block,
      )
    })
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
    new Fn(ident("@debug"), [{ name: "arg", type: Any }], Any, ([v], _, full) => {
      console.info(`${blue}[${_.lang.padEnd(4)}] ${yellow}${v}${reset}${dim}: ${reset}${magenta}${v!.type}${reset}${dim} in ${reset}${full}${reset}`)
      return v!
    }),
  )

  const Json = api.opaque("Json", { glsl: null, js: "" }, true)

  api.lib.tags.setOrThrow(
    ident("debug_fn"),
    new Tag(ident("debug_fn"), (text, interps, _, _1, _2, full) => {
      if (interps.length || text.length != 1) {
        issue(`debug_fn"..." should be called with no interpolations.`)
      }
      const id = ident(text[0]!)
      const fns = api.lib.fns.get(id)

      console.info(`${blue}[${api.lib.props.lang.padEnd(4)}] ${cyan}debug_fn"${id}"${reset}${dim} (in ${reset}${full}${dim})${reset}`)
      fns?.forEach((x) => {
        console.info(`  ${x.declarationANSI()}`)
        console.info(`    ${dim}${x.source ?? "<no source>"}${reset}`)
      })
      return api.lib.void()
    }),
  )

  api.lib.tags.setOrThrow(
    ident("json"),
    new Tag(ident("json"), (text, interps) => {
      if (interps.length || text.length != 1) {
        issue(`json"..." should be called with no interpolations.`)
      }
      return new Value("(" + JSON.stringify(JSON.parse(text[0]!)) + ")", Json, false)
    }),
  )

  api.lib.fns.push(
    ident("@debug_scalars"),
    new Fn(ident("@debug_scalars"), [{ name: "arg", type: Any }], Any, ([v], _, full) => {
      console.info(
        `${blue}[${_.lang.padEnd(4)}] ${yellow}${v!
          .toScalars()
          .map((x) => x.toRuntime())
          .join(reset + ", " + yellow)}${reset}${dim}: ${reset}${magenta}${v!.type}${reset}${dim} in ${reset}${full}${reset}`,
      )
      return v!
    }),
  )
}
