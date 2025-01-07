export function group(...data: any[]): Disposable {
  console.group(...data)
  return {
    [Symbol.dispose]() {
      console.groupEnd()
    },
  }
}

function choose<T>(...f: T[]): T {
  if (f.length == 0) {
    throw new Error("Cannot choose from an empty list.")
  }

  return f[Math.floor(Math.random() * f.length)]!
}

function many1(f: () => string): string {
  const output = [wrap(f())]
  while (Math.random() < 0.5) {
    output.push(wrap(f()))
  }
  return output.join(" ")
}

function many(f: () => string): string {
  const output = []
  while (Math.random() < 0.5) {
    output.push(wrap(f()))
  }
  return output.join(" ")
}

let calls = 0
function opt(f: () => string): string {
  calls++
  if (calls > 5) {
    return ""
    setTimeout(() => (calls = 0))
  }
  return Math.random() < 0.5 ? wrap(f()) : ""
}

function wrap(x: string): string {
  if (x.wrapped) {
    return x
  }
  return Object.assign(new String("\\left(" + x + "\\right)"), {
    wrapped: true,
  })
}

export function genExp(): string {
  return wrap(
    choose(
      "2",
      "x",
      "x^3",
      "y",
      "y_5",
      "17!",
      "\\left[5,6\\right].\\operatorname{min}",
    ),
  )
}

export function genTerm(): string {
  return many1(genExp) + opt(() => choose(many(genFn), genSum()))
}

export function genProd(): string {
  return wrap(genTerm())
  // + many(() => choose("\\cdot ", "÷", "\\operatorname{mod}") + wrap(genTerm()))
}

export function genFn(): string {
  return (
    choose(
      "\\operatorname{sin}",
      "\\operatorname{cos}",
      "\\operatorname{tan}",
    ) + wrap(choose(genFn, () => many1(genProd))() + opt(genSum))
  )
}

export function genSum(): string {
  return (
    choose("\\sum ", "\\prod ") +
    wrap(many(() => choose(genProd, genFn, genSum)()))
  )
}

const t = genTerm()
copy(t.replaceAll("\\left(", "").replaceAll("\\right)", "") + "\n" + t)
