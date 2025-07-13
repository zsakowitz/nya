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

  const Sign = api.opaque("Sign", { glsl: "int", js: null }, true)
  api.fn("inv", { x: Sign }, Sign, {
    glsl: v`${"int %%(int x){return x==3?3:-x;}"}(${0})`,
    js: v`${"function %%(x){return x==3?3:x==0?0:-x;}"}(${0})`,
  })

  const Game = api.opaque("Game", { glsl: null, js: null }, false)
  const GameEmpty = api.opaque("GameEmpty", { glsl: null, js: null }, false)
  const GameNim = api.opaque("GameNim", { glsl: null, js: null }, false)
  const GameTree = api.opaque("GameTree", { glsl: null, js: null }, false)
  const GameConstantInteger = api.opaque(
    "GameConstantInteger",
    { glsl: null, js: null },
    false,
  )

  jsFn(api, libGameActual)
    .fn("empty", {}, GameEmpty)
    .fn("nim", { size: api.lib.tyNum }, GameNim)
    .fn("winner", { game: Game, player: Player }, Player)
    .fn("sign", { game: Game }, Sign)
    .fn("const_int", { size: api.lib.tyNum }, GameConstantInteger)
    .fa("sum", "+", { a: Game, b: Game }, Game)
    .fa("sub", "-", { a: Game, b: Game }, Game)
    .fa("neg", "-", { game: Game }, Game)
    .fa("eq", "==", { a: Game, b: Game }, api.lib.tyBool)
    .fa("display_sign", "%display", { a: Sign }, api.lib.tyLatex)
    .fn("eval", { game: Game }, S)
    .fn("tree", {}, GameTree)

  api.fn("+", { game: Game }, Game, { glsl: v`${0}`, js: v`${0}` }, false)

  api.fn(
    "%display",
    { game: Game },
    api.lib.tyLatex,
    { glsl: v``, js: v`${0}.w()` },
    false,
  )

  api.fn(
    "branch",
    {
      game: GameTree,
      src: api.lib.tyNum,
      dst: api.lib.tyNum,
    },
    GameTree,
    { glsl: v``, js: v`${0}.branch(${1},${2})` },
    false,
  )

  api.fn(
    "branch",
    {
      game: GameTree,
      src: api.lib.tyNum,
      dst: api.lib.tyNum,
      owner: Player,
    },
    GameTree,
    { glsl: v``, js: v`${0}.branch(${1},${2},${3})` },
    false,
  )

  api.tcoercion(GameEmpty, Game)
  api.tcoercion(GameNim, Game)
  api.tcoercion(GameConstantInteger, Game)
  api.tcoercion(GameTree, Game)
}

function libGameActual() {
  type Player = -1 | 1
  type Sign = -1 | 1 | 0 | 3

  interface Surreal {
    x: Surreal[]
    y: Surreal[]
    z: number | string | null
  }

  interface Game<T = unknown> {
    x(p: -1 | 1): T[]
    y(x: T): void
    z(x: T): void
    w(): string
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

  const ZERO: Surreal = { x: [], y: [], z: 0 }

  function lte(a: Surreal, b: Surreal) {
    if (a === null || b === null) return false
    for (var i = 0; i < a.x.length; i++) if (lte(b, a.x[i]!)) return false
    for (var i = 0; i < b.y.length; i++) if (lte(b.y[i]!, a)) return false
    return true
  }

  function sign(game: Game): Sign {
    const wl = winner(game, -1) == -1
    const wr = winner(game, 1) == -1

    return (
      wl ?
        wr ? -1
        : 3
      : wr ? 0
      : 1
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
      w() {
        return `\\wordprefix{nim}(${size})`
      },
    }
  }

  function const_int(size: number): Game<number> {
    size = Math.floor(size)
    if (!Number.isSafeInteger(size)) {
      size = 0
    }
    if (size > 16) {
      size = 16
    }
    if (size < -16) {
      size = -16
    }
    return {
      x(p) {
        return Math.sign(size) == p ? [p] : []
      },
      y(x) {
        size -= x
      },
      z(x) {
        size += x
      },
      w() {
        return `\\wordprefix{const_int}(${size})`
      },
    }
  }

  function sum(a: Game, b: Game): Game<{ x: Game; y: unknown }> {
    if (a == b) {
      throw new Error(
        `Adding games only works if the games are different. If both games come from a single variable, addition is undefined.`,
      )
    }

    return {
      x(p) {
        const ret = []
        for (const mv of a.x(p)) {
          ret.push({ x: a, y: mv })
        }
        for (const mv of b.x(p)) {
          ret.push({ x: b, y: mv })
        }
        return ret
      },
      y(x) {
        x.x.y(x.y)
      },
      z(x) {
        x.x.z(x.y)
      },
      w() {
        return `${a.w()}+${b.w()}`
      },
    }
  }

  function neg<T>(a: Game<T>): Game<T> {
    return {
      x(p) {
        return a.x(-p as Player)
      },
      y(x) {
        a.y(x)
      },
      z(x) {
        a.z(x)
      },
      w() {
        return `-${a.w()}`
      },
    }
  }

  function eq(a: Game, b: Game) {
    const val = evaluate(sum(a, b))
    return lte(val, ZERO) && lte(ZERO, val)
  }

  function evaluate(a: Game): Surreal {
    const lhs: Surreal[] = []
    for (const move of a.x(1)) {
      a.y(move)
      lhs.push(evaluate(a))
      a.z(move)
    }

    const rhs: Surreal[] = []
    for (const move of a.x(-1)) {
      a.y(move)
      rhs.push(evaluate(a))
      a.z(move)
    }

    return { x: lhs, y: rhs, z: null }
  }

  interface Branch {
    e0: number
    e1: number
    color: Player | void
    hacked: boolean
    grounded: boolean
  }

  class Tree implements Game<Branch> {
    readonly #edges: Branch[][] = []
    readonly edges: Branch[] = []

    branch(e0: number, e1: number, color: Player | void) {
      const self = this.#clone()
      const branch: Branch = { e0, e1, color, hacked: false, grounded: false }
      ;(self.#edges[e0] ??= []).push(branch)
      ;(self.#edges[e1] ??= []).push(branch)
      self.edges.push(branch)
      return self
    }

    #markGroundedFrom(vertex: number, marked: Set<number>) {
      if (marked.has(vertex)) return
      marked.add(vertex)
      const edges = this.#edges[vertex]
      if (!edges) return

      for (const edge of edges) {
        if (!(edge.hacked || edge.grounded)) {
          edge.grounded = true
          this.#markGroundedFrom(edge.e1 != vertex ? edge.e1 : edge.e0, marked)
        }
      }
    }

    checkAccess() {
      for (const edge of this.edges) {
        edge.grounded = false
      }

      this.#markGroundedFrom(0, new Set())
    }

    x(player: Player): Branch[] {
      this.checkAccess()

      return this.edges.filter(
        (x) =>
          (x.color === player || x.color === undefined) &&
          !x.hacked &&
          x.grounded,
      )
    }

    y(move: Branch): void {
      move.hacked = true
    }

    z(move: Branch): void {
      move.hacked = false
    }

    w(): string {
      return `\\wordprefix{tree}(${this.edges.map((x) => x.e0 + "\\to " + x.e1)})`
    }

    #clone() {
      const t = new Tree()
      const map = new Map()
      ;(t as any).edges = this.edges.map((x) => {
        const y = { ...x }
        map.set(x, y)
        return y
      })
      ;(t as any).#edges = this.#edges.map((x) => x.map((x) => map.get(x)!))
      return t
    }
  }

  function draw(tree: Tree) {
    const cv = document.createElement("canvas")
    cv.width = cv.height = 400
    document.body.appendChild(cv)
    const ctx = cv.getContext("2d")!

    for (let i = 0; i < 100; i++) {
      tree.edges.push({
        e0: Math.floor(100 * Math.random()),
        e1: Math.floor(100 * Math.random()),
      })
    }

    /*! From https://editor.p5js.org/JeromePaddick/sketches/bjA_UOPip */

    const nodes: { x: number; y: number; force?: { x: number; y: number } }[] =
      []
    for (const edge of tree.edges) {
      nodes[edge.e0] ??= { x: 0, y: 0 }
      nodes[edge.e1] ??= { x: 0, y: 0 }
    }

    const noNodes = 100
    const noConn = 50
    const gravityConstant = 1.1
    const forceConstant = 1000
    const physics = true

    const clicked = false
    const lerpValue = 0.2
    const startDisMultiplier = 10

    nodes.forEach((pos) => {
      pos.x = (2 * Math.random() - 1) * startDisMultiplier
      pos.y = (2 * Math.random() - 1) * startDisMultiplier
    })

    function update() {
      nodes.forEach((node) => {
        const gravity = {
          x: -gravityConstant * node.x,
          y: -gravityConstant * node.y,
        }
        node.force = gravity
      })

      for (let i = 0; i < nodes.length; i++) {
        if (!(i in nodes)) continue
        for (let j = i + 1; j < nodes.length; j++) {
          if (!(j in nodes)) continue
          const pos = nodes[i]!
          const dir = {
            x: nodes[j]!.x - nodes[i]!.x,
            y: nodes[j]!.y - nodes[i]!.y,
          }
          const mag = Math.hypot(dir.x, dir.y) ** 2
          const force = {
            x: (forceConstant * pos.x) / mag,
            y: (forceConstant * pos.y) / mag,
          }
          nodes[i]!.force!.x -= force.x
          nodes[i]!.force!.y -= force.y
          nodes[j]!.force!.x += force.x
          nodes[j]!.force!.y += force.y
        }
      }

      tree.edges.forEach((branch) => {
        const node1 = nodes[branch.e0]!
        const node2 = nodes[branch.e1]!
        let dis = { x: node1.x - node2.x, y: node1.y - node2.y }
        node1.force!.x -= dis.x
        node1.force!.y -= dis.y
        node2.force!.x += dis.x
        node2.force!.y += dis.y
      })

      nodes.forEach((node) => {
        const mass = (2 * Math.PI * 3) / 1.5
        node.x += node.force!.x / mass
        node.y += node.force!.y / mass
      })
    }

    function draw() {
      ctx.clearRect(0, 0, 400, 400)
      cv.style =
        "position:fixed;top:0;left:0;width:400px;height:400px;background:white;z-index:20"
      ctx.translate(200, 200)
      // ctx.scale(5, 5)

      nodes.forEach((node) => {
        ctx.beginPath()
        ctx.fillStyle = "black"
        ctx.ellipse(node.x, node.y, 1, 1, 0, 0, 2 * Math.PI)
        ctx.fill()
      })

      tree.edges.forEach((branch) => {
        ctx.beginPath()
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2
        const node1 = nodes[branch.e0]!
        const node2 = nodes[branch.e1]!
        ctx.moveTo(node1.x, node1.y)
        ctx.lineTo(node2.x, node2.y)
        ctx.stroke()
      })
    }

    setInterval(() => {
      update()
      draw()
    })

    draw()
  }

  Object.assign(globalThis, { Tree, draw })

  if (!globalThis.hi) {
    globalThis.hi = 2
    const t = new Tree()
      .branch(0, 1, -1)
      .branch(1, 2, 1)
      .branch(2, 0, 1)
      .branch(4, 5)
    draw(t)
  }

  return {
    empty(): Game<void> {
      return {
        x: () => [],
        y() {},
        z() {},
        w: () => `\\wordvar{empty}`,
      }
    },
    winner,
    sign,
    nim,
    sum,
    neg,
    eq,
    const_int,
    eval: evaluate,
    sub(a: Game, b: Game): Game {
      return sum(a, neg(b))
    },
    tree: () => new Tree(),
    display_sign(sign: Sign): string {
      return {
        [-1]: "\\wordvar{right}",
        [1]: "\\wordvar{left}",
        [0]: "0",
        [3]: "\\digit{∗}",
      }[sign]
    },
  }
}
