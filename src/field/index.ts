import "../../index.css"
import { autoCmds, exts, options } from "./defaults"
import { Field } from "./field"
import { h } from "./jsx"

const latex = h("text-center block text-sm break-all px-8 text-balance mt-8")
const ascii = h("text-center block text-sm break-all px-8 text-balance mt-4")
const reader = h("text-center block text-xs break-all px-8 text-balance mt-4")

class MyField extends Field {
  onAfterChange(wasChangeCanceled: boolean): void {
    super.onAfterChange(wasChangeCanceled)
    latex.textContent = this.block.latex()
    ascii.textContent = this.block.ascii()
    reader.textContent = this.block.reader()
  }
}

const field = new MyField(exts, options)

const demos = {
  main: "2 * 3 a 4 5 6 8 ^ 9 2 3 ^ 9 ^ 5 ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight + 0 4 / 5 ArrowRight ArrowLeft ^ 2 ArrowRight ArrowRight 3 a 2 ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowRight ^ 4 3 6 ArrowRight / 2 / 3 ArrowRight + 4 ArrowLeft ArrowLeft ArrowLeft ArrowDown ArrowLeft ArrowUp ArrowDown ArrowUp ArrowDown ArrowDown ArrowDown 4 3 2 1 9 3 4 2 ArrowUp ArrowUp ArrowUp ArrowUp ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft \\sum 2 3 ArrowUp 4 9 ArrowRight ArrowRight m a t r i x 1 ArrowRight 2 ArrowDown 4 ArrowLeft ArrowLeft 3 ArrowLeft ArrowLeft ArrowLeft f o r b l o c k x ^ 2 Tab Tab i Tab [ 1 . . . 1 0 ] Tab n ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft i n t 2 ArrowDown ArrowRight ArrowRight ArrowRight ArrowRight + ^ 4 Tab ArrowLeft ArrowLeft ArrowLeft ArrowLeft + p i e c e w i s e m a t r i x 1 ArrowRight 2 ArrowDown 4 ArrowLeft ArrowLeft 3 ArrowLeft 5 / 4 ArrowLeft ArrowLeft ArrowLeft 8 ArrowUp 7 ArrowDown ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight y > = 4 ArrowDown ArrowLeft 2 7 ^ 8 ^ 9 / 3 Tab Tab Tab Tab x < / 3 ; 5 s i n + 3 - c o s 2 b x 5 w i t h x = 5 w i d t h - 3 ; 5 + s i n 3 - c o s 2 b x 5 w i t h x = 5 - w i d t h 3 6 ; ( 5 4 ) s i n ( 3 6 ) w i t h ( 7 8 ) w i d t h h e i g h t ( 8 9 ) ; 2 * - 3 - 3 + - c o s 2 - c o s 3 ; 2 ÷ - 3 - - - 4 + + 5 + - 6 ; l o g _ 3 ArrowRight 7 ; s i n ^ 2 ArrowRight 5 + s i n ^ 2 ArrowRight ( 5 ) [ 1 . . . 1 0 0 ] s i n . . . 4 . . . s i n . 3 ; w i n d o w . w i d t h + s i n . h 2 + [ 2 , 8 , 9 ] . m i n w i d t h = w i d t h",
  compare:
    "m a t r i x ArrowRight ArrowRight ArrowLeft 2 = 3 ; 2 = / 3 ; 2 < 3 ; 2 > 3 ; 2 < = 3 ; 2 > = 3 ; 2 < / 3 ; 2 > / 3 ; 2 < / = 3 ArrowDown 2 > = / 3",
  sigma:
    "s u m s u m s u m s u m s u m 1 1 ArrowRight ArrowLeft ArrowUp s u m 1 0 ArrowUp s u m 9 ArrowUp ArrowUp s u m 8 ArrowUp s u m 7 ArrowUp ArrowUp s u m 6 ArrowUp s u m 5 ArrowUp ArrowUp s u m 4 ArrowUp s u m 3 ArrowUp ArrowUp s u m 2 ArrowUp s u m 1",
  nested:
    "( ) ArrowLeft s q r t f o r b l o c k i n t _ 3 ArrowUp 5 ArrowRight n t h r o o t s u m 1 ArrowUp 4 ArrowRight p r o d 2 ArrowUp 6 ArrowRight 8 ) / 7 ArrowRight ArrowRight m a t r i x a ArrowRight b ArrowDown c a s e s 9 ArrowRight x < y ArrowDown ArrowLeft 0 ArrowLeft ArrowLeft ArrowLeft c ArrowDown ArrowDown [ 1 , 2 , 3 , . . . , 5 0 ] ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft k",
  uscript1:
    "m a t r i x u0 uv0 ArrowRight u1 uv1 ArrowRight u2 uv2 ArrowRight u3 uv3 ArrowDown ArrowDown ; u4 uv4 ArrowRight u5 uv5 ArrowRight u6 uv6 ArrowRight u7 uv7 ; u8 uv8 ArrowRight u9 uv9 ArrowRight ua uva ArrowRight ub uvb ; uc uvc ArrowRight ud uvd ArrowRight ue uve ArrowRight uf uvf Tab / ( u0 u1 u2 u3 u4 u5 u6 u7 ) / uv0 uv1 uv2 uv3 uv4 uv5 uv6 uv7 ArrowRight / ( u8 u9 ua ub uc ud ue uf ) / uv8 uv9 uva uvb uvc uvd uve uvf",
  uscript2: "u1 u+ uv2 u- u3",
  words:
    "m a t r i x ArrowRight Backspace 2 s i n 3 , 2 + s i n + 3 , ( 2 ) s i n ( 3 ) ; 2 w i t h 3 , 2 w i t h + 3 , ( 2 ) w i t h ( 3 ) ; 2 h e i g h t 3 , 2 + h e i g h t + 3 , ( 2 ) h e i g h t ( 3 ) ArrowDown 2+ 3 + + 3 - - - 4 + + + + + 5 + - 6",
}

// Set up field styles
document.body.className = "flex flex-col justify-center min-h-screen px-8"

document.body.append(
  h("block text-center mb-2", "mouse works now! finally lol"),
  h(
    "flex gap-1 justify-center",
    h("py-1 pr-1", "try:"),
    ...Object.getOwnPropertyNames(demos).map((name) => {
      const x = document.createElement("button")
      x.textContent = name
      x.className = "bg-gray-300 rounded px-2 py-1"
      x.onclick = () => field.typeEach(demos[name as keyof typeof demos])
      return x
    }),
  ),
)

document.body.appendChild(
  h(
    "[line-height:1] text-[2rem] text-center overflow-auto p-8 -mx-8",
    field.el,
  ),
)

field.typeEach(demos.main)

document.body.appendChild(latex)
document.body.appendChild(ascii)
document.body.appendChild(reader)

document.body.append(
  h("font-semibold mt-8", "Available keys to press:"),
  h(
    "grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] w-full ml-8",
    ...exts
      .getAll()
      .sort()
      .map((name) => h("", name))
      .filter((x) => x != null),
  ),
  h("font-semibold mt-8", "Additional typable commands:"),
  h(
    "grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] w-full ml-8",
    ...autoCmds
      .getAll()
      .sort()
      .map((name) => h("", name))
      .filter((x) => x != null),
  ),
)
