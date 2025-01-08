import { OpEq } from "../field/cmd/leaf/cmp.js"
import { CmdWord } from "../field/cmd/leaf/word.js"
import { exts, options } from "../field/defaults.js"
import { L, R } from "../field/model.js"
import { Expr, Sheet } from "./index.js"

const sheet = new Sheet(exts, { field: options })
document.body.appendChild(sheet.el)

{
  const expr = new Expr(sheet)
  expr.field.setPrefix((field) => {
    field.typeEach("f ( z , c ) =")
  })
  expr.removable = false
  expr.field.typeEach("z ^ 2 + c")
}

{
  const expr = new Expr(sheet)
  expr.field.setPrefix(({ block, options }) => {
    const cursor = block.cursor(R)
    new CmdWord("var", "detail").insertAt(cursor, L)
    new OpEq(false).insertAt(cursor, L)
  })
  expr.removable = false
  expr.field.typeEach("5 0")
}

new Expr(sheet).field //
  .typeEach`y = 2 x ^ 2 - 7 z + 3`
new Expr(sheet).field
  .typeEach`p o l y g o n ( ( 2 , 3 ) , ( 7 , - 3 ) , ( 1 , 0 ) )`
new Expr(sheet).field
  .typeEach`s i n ( a + b ) = s i n a c o s b + s i n b c o s a`
new Expr(sheet).field.typeEach`n o t 2 = 3 + n o t 5 ( n o t 3 ) 4 n o t 4`
new Expr(sheet).field
  .typeEach`( ) ArrowLeft s q r t f o r b l o c k i n t _ 3 ArrowUp 5 ArrowRight n t h r o o t s u m 1 ArrowUp 4 ArrowRight p r o d 2 ArrowUp 6 ArrowRight 8 ) / 7 ArrowRight ArrowRight m a t r i x a ArrowRight b ArrowDown c a s e s 9 ArrowRight x < y ArrowDown ArrowLeft 0 ArrowLeft ArrowLeft ArrowLeft c ArrowDown ArrowDown [ 1 , 2 , 3 , . . . , 5 0 ] ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft k`
new Expr(sheet).field
  .typeEach`m a t r i x ArrowRight Backspace 2 s i n 3 , 2 + s i n + 3 , ( 2 ) s i n ( 3 ) ; 2 w i t h 3 , 2 w i t h + 3 , ( 2 ) w i t h ( 3 ) ; 2 h e i g h t 3 , 2 + h e i g h t + 3 , ( 2 ) h e i g h t ( 3 ) ArrowDown 2+ 3 + + 3 - - - 4 + + + + + 5 + - 6`
new Expr(sheet).field
  .typeEach`m a t r i x u0 uv0 ArrowRight u1 uv1 ArrowRight u2 uv2 ArrowRight u3 uv3 ArrowDown ArrowLeft ArrowLeft ArrowLeft u4 uv4 ArrowRight u5 uv5 ArrowRight u6 uv6 ArrowRight u7 uv7 ; u8 uv8 ArrowRight u9 uv9 ArrowRight ua uva ArrowRight ub uvb ; uc uvc ArrowRight ud uvd ArrowRight ue uve ArrowRight uf uvf Tab / ( u0 u1 u2 u3 u4 u5 u6 u7 ) / uv0 uv1 uv2 uv3 uv4 uv5 uv6 uv7 ArrowRight / ( u8 u9 ua ub uc ud ue uf ) / uv8 uv9 uva uvb uvc uvd uve uvf`
{
  const expr = new Expr(sheet)
  setTimeout(() => expr.field.el.focus())
  expr.field
    .typeEach`2 * 3 a 4 5 6 8 ^ 9 2 3 ^ 9 ^ 5 ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight + 0 4 / 5 ArrowRight ArrowLeft ^ 2 ArrowRight ArrowRight 3 a 2 ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowRight ^ 4 3 6 ArrowRight / 2 / 3 ArrowRight + 4 ArrowLeft ArrowLeft ArrowLeft ArrowDown ArrowLeft ArrowUp ArrowDown ArrowUp ArrowDown ArrowDown ArrowDown 4 3 2 1 9 3 4 2 ArrowUp ArrowUp ArrowUp ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft \\sum 2 3 ArrowUp 4 9 ArrowRight ArrowRight m a t r i x 1 ArrowRight 2 ArrowDown 4 ArrowLeft ArrowLeft 3 ArrowLeft ArrowLeft ArrowLeft f o r b l o c k x ^ 2 Tab Tab i Tab [ 1 . . . 1 0 ] Tab n ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft i n t 2 ArrowDown ArrowRight ArrowRight ArrowRight ArrowRight + ^ 4 Tab ArrowLeft ArrowLeft ArrowLeft ArrowLeft + p i e c e w i s e m a t r i x 1 ArrowRight 2 ArrowDown 4 ArrowLeft ArrowLeft 3 ArrowLeft 5 / 4 ArrowLeft ArrowLeft ArrowLeft 8 ArrowUp 7 ArrowDown ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight y > = 4 ArrowDown ArrowLeft 2 7 ^ 8 ^ 9 / 3 Tab Tab Tab Tab x < / 3 ; 5 s i n + 3 - c o s 2 b x 5 w i t h x = 5 w i d t h - 3 ; 5 + s i n 3 - c o s 2 b x 5 w i t h x = 5 - w i d t h 3 6 ; ( 5 4 ) s i n ( 3 6 ) w i t h ( 7 8 ) w i d t h h e i g h t ( 8 9 ) ; 2 * - 3 - 3 + - c o s 2 - c o s 3 ; 2 ÷ - 3 - - - 4 + + 5 + - 6 ; l o g _ 3 ArrowRight 7 ; s i n ^ 2 ArrowRight 5 + s i n ^ 2 ArrowRight ( 5 ) [ 1 . . . 1 0 0 ] s i n . . . 4 . . . s i n . 3 ; w i n d o w . w i d t h + s i n . h 2 + [ 2 , 8 , 9 ] . m i n w i d t h = w i d t h`
}

new Expr(sheet).field
  .typeEach`s u m s u m s u m s u m s u m 1 1 ArrowRight ArrowLeft ArrowUp s u m 1 0 ArrowUp s u m 9 ArrowUp ArrowUp s u m 8 ArrowUp s u m 7 ArrowUp ArrowUp s u m 6 ArrowUp s u m 5 ArrowUp ArrowUp s u m 4 ArrowUp s u m 3 ArrowUp ArrowUp s u m 2 ArrowUp s u m 1`
new Expr(sheet).field
  .typeEach`m a t r i x ArrowRight ArrowRight ArrowLeft 2 = 3 ; 2 = / 3 ; 2 < 3 ; 2 > 3 ; 2 < = 3 ; 2 > = 3 ; 2 < / 3 ; 2 > / 3 ; 2 < / = 3 ArrowDown 2 > = / 3`
new Expr(sheet).field.typeEach`u1 u+ uv2 u- u3`
