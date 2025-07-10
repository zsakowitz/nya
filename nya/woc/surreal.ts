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

    const SN = (n: number) => new Array(api.lib.props, S, n)
    const S0 = SN(0)
    const S1 = SN(1)
    const SX = new AnyArray(S)

    api.fn("%surreal_join", {}, S0, {
      glsl: v`[]`,
      js: v`[]`,
    })

    api.fn("%surreal_join", { arg1: S }, S1, {
      glsl: v`[]`,
      js: v`[${0}]`,
    })

    api.fn("%surreal_join", { arg1: S, arg2: S }, SN(2), {
      glsl: v`[]`,
      js: v`[${0},${1}]`,
    })

    api.fn("%surreal_join", { arg1: S, arg2: S, arg3: S }, SN(3), {
      glsl: v`[]`,
      js: v`[${0},${1},${2}]`,
    })

    // {0|1} + {0|}
    // {{0|1}|{1|2}}

    {
      const bool = api.lib.tyBool
      const cmp = new Impl()
      const lte = cmp.cache(
        `function %%(a,b){
  if(a===null||b===null)return false;
  for(var i=0;i<a.x.length;i++)if(%%(b,a.x[i]))return false;
  for(var i=0;i<b.y.length;i++)if(%%(b.y[i],a))return false;
  return true;
}`,
      )
      const eq = cmp.cache(`function %%(a,b){return ${lte}(a,b)&&${lte}(b,a)}`)
      const lt = cmp.cache(`function %%(a,b){return ${lte}(a,b)&&!${lte}(b,a)}`)
      const cons = cmp.cache(
        `function %%(l,r){
  for(var i=0;i<l.length;i++){
    if (l[i]===null)return null;
    for(var j=0;j<r.length;j++){
      if(!${lt}(l[i],r[j]))return null;
    }
  }
  for(var j=0;j<r.length;j++){
    if (r[j]===null)return null;
  }
  return {x:l,y:r,z:null}
}`,
      )
      const sides = { lhs: S, rhs: S }
      api.fn("<=", sides, bool, { glsl: v``, js: cmp.of`${lte}(${0},${1})` })
      api.fn(">=", sides, bool, { glsl: v``, js: cmp.of`${lte}(${1},${0})` })
      api.fn("<", sides, bool, { glsl: v``, js: cmp.of`${lt}(${0},${1})` })
      api.fn(">", sides, bool, { glsl: v``, js: cmp.of`${lt}(${1},${0})` })
      api.fn("==", sides, bool, { glsl: v``, js: cmp.of`${eq}(${0},${1})` })
      api.fn("!=", sides, bool, { glsl: v``, js: cmp.of`!${eq}(${0},${1})` })
      api.fn("%surreal", { lhs: SX, rhs: SX }, S, {
        glsl: v``,
        js: cmp.of`${cons}(${0}??[],${1}??[])`,
      })
      api.fn("label", { value: S, lhs: S, rhs: api.lib.tyNum }, S, {
        glsl: v``,
        js: cmp.of`${`function %%(a,m,z){return m&&(${eq}(a,m)?{x:a.x,y:a.y,z:z}:{x:a.x.map(v=>%%(v,m,z)),y:a.y.map(v=>%%(v,m,z)),z:a.z})}`}(${0},${1},${2})`,
      })
    }

    {
      const impl = new Impl()
      const num = impl.cache(`const %%=${numToLatex};`)
      const fn = impl.cache(
        `function %%(x){return x===null?'\\\\wordvar{undefined}':x.z===null?\`\\\\surreal{\${x.x.map(%%).join(',')}}{\${x.y.map(%%).join(',')}}\`:${num}(x.z)}`,
      )
      api.fn("%display", { value: S }, api.lib.tyLatex, {
        glsl: v``,
        js: impl.of`${fn}(${0})`,
      })
    }

    api.fn("label", { lhs: S, rhs: api.lib.tyNum }, S, {
      glsl: v``,
      js: v`${"function %%(a,z){return a===null?null:{x:a.x,y:a.y,z:z}}"}(${0},${1})`,
    })

    api.fn("unlabel", { value: S }, S, {
      glsl: v``,
      js: v`${"function %%(a){return a&&{x:a.x.map(%%),y:a.y.map(%%),z:null}}"}(${0})`,
    })

    api.fn("-", { arg: S }, S, {
      glsl: v``,
      js: v`${"function %%(x){return x&&{x:x.y.map(%%).reverse(),y:x.x.map(%%).reverse(),z:x.z&&-x.z}}"}(${0})`,
    })

    api.fn("+", { arg: S }, S, {
      glsl: v``,
      js: v`${0}`,
    })

    // surreal +:
    // a + {   |   } = a
    // a + { 0 |   } = { a |   } =? { a + 0 | }
    //     api.fn("+", { a: S, b: S }, S, {
    //       glsl: v``,
    //       js: v`${`function %%(a,b,c){
    //   if(a===null||b===null)return null;
    //   var z=a.z===null||b.z===null?null:a.z+b.z;
    //   if(b.x.length==0&&b.y.length==0)return a;
    //   if(b.x.length==1&&b.y.length==0)return {x:[%%(a,b.x[0])],y:[],z:z};
    //   if(b.x.length==0&&b.y.length==1)return {x:[],y:[%%(a,b.y[0])],z:z};
    //   if(b.x.length==1&&b.y.length==1)return {x:[%%(a,b.x[0])],y:[%%(a,b.y[0])],z:z};
    //   if(c)return null;
    //   return %%(b,a,true);
    // }`}(${0},${1},false)`,
    //     })
  },
} satisfies Plugin
