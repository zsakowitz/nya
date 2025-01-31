import type { SExact } from "../../ty"

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz"

function write({ n, d }: SExact, base: number) {
  return ((n - (n % d)) / d).toString(base)

  const rank = Math.floor(Math.log(n / d) / Math.log(base))

  let ret = ""
  for (let i = 0; i < 16; i++) {
    const exp = rank - i

    if (exp == -1) {
      ret += "."
    }

    const digit = Math.round((n / (d * base ** exp)) % base)
    ret += DIGITS[digit]
  }

  if (ret.indexOf(".") != -1) {
    while (ret[ret.length - 1]! == "0") {
      ret = ret.slice(0, -1)
    }
    if (ret.endsWith(".")) {
      ret = ret.slice(0, -1)
    }
    return ret
  }

  return ret
}

console.log(write({ type: "exact", n: 9007199254740991, d: 1 }, 10))
console.log(write({ type: "exact", n: 1, d: 9007199254740991 }, 10))
