import { Impl, jsFn, v, type NyaApi, type Plugin } from "!/emit/api"
import { AnyArray, Array, type Scalar } from "!/emit/type"
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
        `function %%(x){return x===null?'\\\\wordvar{undefined}':typeof x.z=='string'?x.z:x.z===null?\`\\\\surreal{\${x.x.map(%%).join(',')}}{\${x.y.map(%%).join(',')}}\`:${num}(x.z)}`,
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

    api.fn("+", { arg: S }, S, {
      glsl: v``,
      js: v`${0}`,
    })

    {
      const impl = new Impl()
      const neg = impl.cache(
        "function %%(x){return x&&{x:x.y.map(%%).reverse(),y:x.x.map(%%).reverse(),z:typeof x.z=='number'?-x.z:null}}",
      )
      const add = impl.cache(`function %%(a,b){return a&&b&&{
  x:a.x.map(x=>%%(x,b)).concat(b.x.map(x=>%%(x,a))),
  y:a.y.map(y=>%%(y,b)).concat(b.y.map(y=>%%(y,a))),
  z:null
}}`)

      api.fn("-", { arg: S }, S, {
        glsl: v``,
        js: impl.of`${neg}(${0})`,
      })

      api.fn("+", { lhs: S, rhs: S }, S, {
        glsl: v``,
        js: impl.of`${add}(${0},${1})`,
      })

      api.fn("-", { lhs: S, rhs: S }, S, {
        glsl: v``,
        js: impl.of`${add}(${0},${neg}(${1}))`,
      })
    }

    libGame(api, S)
  },
} satisfies Plugin

function libGame(api: NyaApi, S: Scalar) {
  const Player = api.opaque("Player", { glsl: "int", js: null }, true)
  api.fn("left", {}, Player, { glsl: v`1`, js: v`1` }, false) // apparently these don't serialize well
  api.fn("right", {}, Player, { glsl: v`-1`, js: v`-1` }, false) // apparently these don't serialize well
  api.fn("inv", { x: Player }, Player, { glsl: v`-${0}`, js: v`-${0}` })
  api.fn("%display", { x: Player }, api.lib.tyLatex, {
    glsl: v``,
    js: v`${0}==1?"\\\\wordvar{left}":"\\\\wordvar{right}"`,
  })

  const Game = api.opaque("Game", { glsl: null, js: null }, false)
  const GameEmpty = api.opaque("GameEmpty", { glsl: null, js: null }, false)
  const GameNim = api.opaque("GameNim", { glsl: null, js: null }, false)

  jsFn(api, libGameActual)
    .fn("empty", {}, GameEmpty)
    .fn("nim", { size: api.lib.tyNum }, GameNim)
    .fn("winner", { game: Game, player: Player }, Player)
    .fn("sign", { game: Game }, S)

  api.tcoercion(GameEmpty, Game)
  api.tcoercion(GameNim, Game)
}

function libGameActual() {
  type Player = -1 | 1

  interface Surreal {
    x: Surreal[]
    y: Surreal[]
    z: number | string | null
  }

  interface Game<T = unknown> {
    x(p: -1 | 1): T[]
    y(x: T): void
    z(x: T): void
  }

  function winner(game: Game, player: Player): Player {
    const opp = -player as Player
    const moves = game.x(player)
    if (moves.length == 0) {
      return opp
    }

    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i]!
      game.y(mv)
      const sign = winner(game, opp)
      game.z(mv)
      if (sign == player) {
        return player
      }
    }

    return opp
  }

  const Z: Surreal = { x: [], y: [], z: 0 }
  const P1: Surreal = { x: [Z], y: [], z: 1 }
  const N1: Surreal = { x: [], y: [Z], z: -1 }
  const STAR: Surreal = { x: [Z], y: [Z], z: "\\digit{∗}" }

  function sign(game: Game): Surreal {
    const wl = winner(game, -1) == -1
    const wr = winner(game, 1) == -1

    return (
      wl ?
        wr ? N1
        : STAR
      : wr ? Z
      : P1
    )
  }

  function nim(size: number): Game<number> {
    size = Math.floor(size)
    if (!Number.isSafeInteger(size)) {
      size = 0
    }
    if (size > 16) {
      size = 16
    }
    return {
      x() {
        const ret: number[] = []
        for (let i = 0; i < size; i++) {
          ret.push(i + 1)
        }
        return ret
      },
      y(x) {
        size -= x
      },
      z(x) {
        size += x
      },
    }
  }

  return {
    empty(): Game<void> {
      return {
        x: () => [],
        y() {},
        z() {},
      }
    },
    winner,
    sign,
    nim,
  }
}
