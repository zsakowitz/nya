import { Impl, v, type Plugin } from "!/emit/api"
import { AnyArray, Array } from "!/emit/type"
import { numToLatex } from "!/std"

export default {
  meta: {
    name: "surreal numbers",
    default: true,
  },
  load(api) {
    const S = api.opaque("Surreal", { glsl: null, js: "" }, true)

    api.fn("%surreal_join", {}, new Array(api.lib.props, S, 0), {
      glsl: v`[]`,
      js: v`[]`,
    })

    api.fn("%surreal_join", { arg1: S }, new Array(api.lib.props, S, 1), {
      glsl: v`[]`,
      js: v`[${0}]`,
    })

    api.fn("%surreal", { lhs: new AnyArray(S), rhs: new AnyArray(S) }, S, {
      glsl: v``,
      js: v`({x:${0},y:${1},z:null})`,
    })

    {
      const bool = api.lib.tyBool
      const cmp = new Impl()
      const lte = cmp.cache(
        "function %%(a,b){for(var i=0;i<a.x.length;i++)if(%%(b,a.x[i]))return false;for(var i=0;i<b.y.length;i++)if(%%(b.y[i],a))return false;return true;}",
      )
      const eq = cmp.cache(`function %%(a,b){return ${lte}(a,b)&&${lte}(b,a)}`)
      const lt = cmp.cache(`function %%(a,b){return ${lte}(a,b)&&!${lte}(b,a)}`)
      const gt = cmp.cache(`function %%(a,b){return !${lte}(a,b)&&${lte}(b,a)}`)
      const sides = { lhs: S, rhs: S }
      api.fn("<=", sides, bool, { glsl: v``, js: cmp.of`${lte}(${0},${1})` })
      api.fn(">=", sides, bool, { glsl: v``, js: cmp.of`${lte}(${1},${0})` })
      api.fn("<", sides, bool, { glsl: v``, js: cmp.of`${lt}(${0},${1})` })
      api.fn(">", sides, bool, { glsl: v``, js: cmp.of`${gt}(${0},${1})` })
      api.fn("==", sides, bool, { glsl: v``, js: cmp.of`${eq}(${0},${1})` })
      api.fn("!=", sides, bool, { glsl: v``, js: cmp.of`!${eq}(${0},${1})` })
    }

    {
      const impl = new Impl()
      const num = impl.cache(`const %%=${numToLatex};`)
      const fn = impl.cache(
        `function %%(x){return x.z===null?\`\\\\surreal{\${x.x.map(%%).join(',')}}{\${x.y.map(%%).join(',')}}\`:${num}(x.z)}`,
      )
      api.fn("%display", { value: S }, api.lib.tyLatex, {
        glsl: v``,
        js: impl.of`${fn}(${0})`,
      })
    }
  },
} satisfies Plugin
