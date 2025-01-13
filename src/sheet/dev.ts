import { OpEq } from "../field/cmd/leaf/cmp.js"
import { CmdColor } from "../field/cmd/leaf/color.js"
import { CmdWord } from "../field/cmd/leaf/word.js"
import { CmdPrompt } from "../field/cmd/util/prompt.js"
import { autoCmds, exts, options } from "../field/defaults.js"
import { FieldInert } from "../field/field-inert.js"
import { L, R } from "../field/model.js"
import { Expr, Sheet } from "./index.js"

const sheet = new Sheet(exts, { field: options })
document.body.appendChild(sheet.el)

new Expr(sheet).field.typeEach`rgb ( 2 5 5 , 2 5 5 , 2 5 5 )`
new Expr(sheet).field.typeEach`
r g b ( a [ 1 ] , a [ 2 ] , a [ 3 ] )
withseq list
  x = real a [ 4 ] ;
  y = imag a [ 4 ] ;
  z = real a [ 5 ] ;
  n = imag a [ 5 ] ;
  a = | [ x , y , z ] | / n ArrowRight ;
  a = ( 0 . 4 5 s i n 5 a + 0 . 5 ) 2 5 5
ArrowRight
with a = ( i t e r a t e ^ 5 0 ArrowRight a - > ( [ z , s , r , a [ 4 ] + d o t ( z - s , s - r ) + i d o t ( z - s , z - s ) , a [ 5 ] + d o t ( z - r , z - r ) + i ]
with z = a [ 1 ] ^ 2 + p
with s = a [ 1 ]
with r = a [ 2 ] ) w h i l e ( | ArrowLeft Backspace ArrowRight a [ 1 ] | < = 2 f r o m [ 0 i , 0 i , 0 i , 0 i , 0 i ] )`
new Expr(sheet).field
  .typeEach`a * ( valid a and y > 0 and 0 < x < 1 ) with a = oklch ( . 8 , y , 3 6 0 x )`
new Expr(sheet).field
  .typeEach`h s v ( 3 6 0 | i t e r a t e ^ 5 0 ArrowRight z - > z ^ 2 + p w h i l e ( | p | ArrowLeft ArrowLeft ArrowLeft Backspace ArrowRight ArrowRight ArrowRight < = 2 f r o m 0 i | , 1 , 1 )`
new Expr(sheet).field
  .typeEach`firstvalid ( oklch ( . 4 , y , 3 6 0 x ) , oklch ( . 5 , y , 3 6 0 x ) , oklch ( . 6 , y , 3 6 0 x ) , oklch ( . 7 , y , 3 6 0 x ) , oklch ( . 8 , y , 3 6 0 x ) , oklch ( . 9 , y , 3 6 0 x ) , oklch ( . 9 5 , y , 3 6 0 x ) )`
new Expr(sheet).field
  .typeEach`p i e c e s r g b ( 1 2 8 , 2 5 5 , 0 ) ArrowRight | p | < . 5 ArrowDown y < . 7 ; r g b ( 0 , 2 5 5 , 1 2 8 ) ArrowUp r g b ( 2 5 5 , 2 5 5 , 0 )`

new Expr(sheet).field.typeEach`e ^ i p i + 1`
new Expr(sheet).field.typeEach`2 + 3`
new Expr(sheet).field.typeEach`( 4 - 5 ) \\odot Enter ( 3 + 9 i )`
new Expr(sheet).field.typeEach`2 / 3 ArrowRight i - s q r t 4`
new Expr(sheet).field.typeEach`[ 2 , 3 ] \\times Enter [ 4 , 5 ]`
new Expr(sheet).field.typeEach`( 5 m o d 6 ) ^ 7 . 3`
new Expr(sheet).field.typeEach`- 2 * p i m o d 6`
new Expr(sheet).field.typeEach`7 3 * 4 b a s e 1 5 b a s e 2`
new Expr(sheet).field.typeEach`7 3 * 4 b a s e 1 5`

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
  expr.field.setPrefix(({ block }) => {
    const cursor = block.cursor(R)
    new CmdWord("detail").insertAt(cursor, L)
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
  .typeEach`( ) ArrowLeft s q r t f o r b l o c k i n t 3 ArrowUp 5 ArrowRight n t h r o o t s u m 1 ArrowUp 4 ArrowRight p r o d 2 ArrowUp 6 ArrowRight 8 ) / 7 ArrowRight ArrowRight m a t r i x a ArrowRight b ArrowDown c a s e s 9 ArrowRight x < y ArrowDown ArrowLeft 0 ArrowLeft ArrowLeft ArrowLeft c ArrowDown ArrowDown [ 1 , 2 , 3 , . . . , 5 0 ] ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft k`
new Expr(sheet).field
  .typeEach`m a t r i x ArrowRight Backspace 2 s i n 3 , 2 + s i n + 3 , ( 2 ) s i n ( 3 ) ; 2 w i t h 3 , 2 w i t h + 3 , ( 2 ) w i t h ( 3 ) ; 2 h e i g h t 3 , 2 + h e i g h t + 3 , ( 2 ) h e i g h t ( 3 ) ArrowDown 2+ 3 + + 3 - - - 4 + + + + + 5 + - 6`
new Expr(sheet).field
  .typeEach`m a t r i x u0 uv0 ArrowRight u1 uv1 ArrowRight u2 uv2 ArrowRight u3 uv3 ArrowDown ArrowLeft ArrowLeft ArrowLeft u4 uv4 ArrowRight u5 uv5 ArrowRight u6 uv6 ArrowRight u7 uv7 ; u8 uv8 ArrowRight u9 uv9 ArrowRight ua uva ArrowRight ub uvb ; uc uvc ArrowRight ud uvd ArrowRight ue uve ArrowRight uf uvf Tab / ( u0 u1 u2 u3 u4 u5 u6 u7 ) / uv0 uv1 uv2 uv3 uv4 uv5 uv6 uv7 ArrowRight / ( u8 u9 ua ub uc ud ue uf ) / uv8 uv9 uva uvb uvc uvd uve uvf`
new Expr(sheet).field
  .typeEach`2 * 3 a 4 5 6 8 ^ 9 2 3 ^ 9 ^ 5 ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight + 0 4 / 5 ArrowRight ArrowLeft ^ 2 ArrowRight ArrowRight 3 a 2 ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowRight ^ 4 3 6 ArrowRight / 2 / 3 ArrowRight + 4 ArrowLeft ArrowLeft ArrowLeft ArrowDown ArrowLeft ArrowUp ArrowDown ArrowUp ArrowDown ArrowDown ArrowDown 4 3 2 1 9 3 4 2 ArrowUp ArrowUp ArrowUp ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft \\sum 2 3 ArrowUp 4 9 ArrowRight ArrowRight m a t r i x 1 ArrowRight 2 ArrowDown 4 ArrowLeft ArrowLeft 3 ArrowLeft ArrowLeft ArrowLeft f o r b l o c k x ^ 2 Tab Tab i Tab [ 1 . . . 1 0 ] Tab n ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft i n t Backspace 2 ArrowDown ArrowRight ArrowRight ArrowRight ArrowRight + ^ 4 Tab ArrowLeft ArrowLeft ArrowLeft ArrowLeft + p i e c e w i s e m a t r i x 1 ArrowRight 2 ArrowDown 4 ArrowLeft ArrowLeft 3 ArrowLeft 5 / 4 ArrowLeft ArrowLeft ArrowLeft 8 ArrowUp 7 ArrowDown ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight y > = 4 ArrowDown ArrowLeft 2 7 ^ 8 ^ 9 / 3 Tab Tab Tab Tab x < / 3 ; 5 s i n + 3 - c o s 2 b x 5 w i t h x = 5 w i d t h - 3 ; 5 + s i n 3 - c o s 2 b x 5 w i t h x = 5 - w i d t h 3 6 ; ( 5 4 ) s i n ( 3 6 ) w i t h ( 7 8 ) w i d t h h e i g h t ( 8 9 ) ; 2 * - 3 - 3 + - c o s 2 - c o s 3 ; 2 ÷ - 3 - - - 4 + + 5 + - 6 ; l o g _ 3 ArrowRight 7 ; s i n ^ 2 ArrowRight 5 + s i n ^ 2 ArrowRight ( 5 ) [ 1 . . . 1 0 0 ] s i n . . . 4 . . . s i n . 3 ; w i n d o w . w i d t h + s i n . h 2 + [ 2 , 8 , 9 ] . m i n w i d t h = w i d t h`
new Expr(sheet).field
  .typeEach`s u m s u m s u m s u m s u m 1 1 ArrowRight ArrowLeft ArrowUp s u m 1 0 ArrowUp s u m 9 ArrowUp ArrowUp s u m 8 ArrowUp s u m 7 ArrowUp ArrowUp s u m 6 ArrowUp s u m 5 ArrowUp ArrowUp s u m 4 ArrowUp s u m 3 ArrowUp ArrowUp s u m 2 ArrowUp s u m 1`
new Expr(sheet).field
  .typeEach`m a t r i x ArrowRight ArrowRight ArrowLeft 2 = 3 ; 2 = / 3 ; 2 < 3 ; 2 > 3 ; 2 < = 3 ; 2 > = 3 ; 2 < / 3 ; 2 > / 3 ; 2 < / = 3 ArrowDown 2 > = / 3`
new Expr(sheet).field.typeEach`u1 u+ uv2 u- u3`

{
  const { field: finalField } = new Expr(sheet)
  const field = new FieldInert(finalField.exts, finalField.options)

  finalField.onBeforeChange()
  const { exts } = finalField
  for (const key of exts.getAll()) {
    const ext = exts.get(key)!
    if (ext == CmdColor || ext == CmdPrompt) continue
    field.sel = field.block.cursor(R).selection()
    field.init(ext, key, { skipChangeHandlers: true })

    finalField.block.insert(
      field.block.splice(),
      finalField.block.ends[R],
      null,
    )
  }
  finalField.sel = finalField.block.cursor(R).selection()
  finalField.onAfterChange(false)
}

{
  const { field: finalField } = new Expr(sheet)
  const field = new FieldInert(finalField.exts, finalField.options)

  finalField.onBeforeChange()
  for (const key of autoCmds.getAll()) {
    const ext = autoCmds.get(key)!
    if (ext == CmdColor || ext == CmdPrompt) continue
    field.sel = field.block.cursor(R).selection()
    field.init(ext, "\\" + key, { skipChangeHandlers: true })

    finalField.block.insert(
      field.block.splice(),
      finalField.block.ends[R],
      null,
    )
  }
  finalField.sel = finalField.block.cursor(R).selection()
  finalField.onAfterChange(false)
}

sheet.exprs[0]!.field.el.focus()
