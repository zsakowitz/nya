let nextVar = 0

export class Script {
  block = ""
}

abstract class Node {
  abstract write(script: Script): string
}

class Num extends Node {
  constructor(readonly n: number) {
    super()
  }

  write(): string {
    return this.n.toString()
  }
}

class Var extends Node {
  constructor(readonly v: string) {
    super()
  }

  write(): string {
    return this.v
  }
}

class Add extends Node {
  constructor(
    readonly a: Node,
    readonly b: Node,
  ) {
    super()
  }

  write(script: Script): string {
    return `(${this.a.write(script)}) + (${this.b.write(script)})`
  }
}

class Sum extends Node {
  constructor(
    readonly bound: string,
    readonly low: Node,
    readonly high: Node,
    readonly body: Node,
  ) {
    super()
  }

  write(script: Script): string {
    let v = "_" + nextVar++
    let low = "_" + nextVar++
    let high = "_" + nextVar++
    script.block += `int ${v} = 0;
int ${low} = ${this.low.write(script)};
int ${high} = ${this.high.write(script)};
for (; ${low}++; ${low} < ${high}) {
int ${this.bound} = ${low};
`
    script.block += `${v} += ${this.body.write(script)};
}`
    return v
  }
}

const node = new Sum(
  "n",
  new Num(1),
  new Num(10),
  new Add(new Var("n"), new Num(3)),
)

const script = new Script()
const ret = node.write(script)

console.log(`${script.block}

${ret}`)
