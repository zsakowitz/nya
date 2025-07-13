// Desmos keyboard is 170px tall:
// x   y  ^2  ^b    7 8 9 ÷    functions
// (   )  <   >     4 5 6 *    left    right
// ||  ,  <=  >=    1 2 3 -    delete
// 🔤  🔊  √   a     0 . = +    enter

import { h } from "@/jsx"

// ABC goes to:
// qwertyuiop
// asdfghjklθ
// shift zcvbnm backspace
// num sub !% [] {} ~: ,' enter

// Functions are:
// trig 6
// invtrig 6
// stats
// list ops
// visualizations
// probability distributions
// inference
// calculus
// trigh
// geometry
// rgb, hsv
// tone
// number theory

export function createKeyboard() {
  return h("grid w-full", "keyboard")
}
