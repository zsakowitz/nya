import { CmdColor } from "../field/cmd/leaf/color.js"
import { CmdPrompt } from "../field/cmd/util/prompt.js"
import { autos, options } from "../field/defaults.js"
import { FieldInert } from "../field/field-inert.js"
import { R } from "../field/model.js"
import { exts } from "./ext/defaults.js"
import { show } from "./ext/exts/03-shader.js"
import { Expr } from "./ui/expr/index.js"
import { Sheet } from "./ui/sheet/index.js"

const sheet = new Sheet(options, exts)
document.body.appendChild(sheet.el)

function expr(source: { raw: readonly string[] }) {
  const expr = new Expr(sheet)
  expr.field.typeLatex(source.raw[0]!)
  return expr
}

expr`A=0.665-0.149i`
expr`B=0+0i`
expr`C=.3+.4i`
show(
  expr`\operatorname{invertdark}\begin{cases}\operatorname{rgb}\left(255,128,128,.4\right)&\left|z-A\right|=q\\\operatorname{rgb}\left(128,255,128,.4\right)&\left|z-B\right|=q\\\operatorname{rgb}\left(128,128,255,.4\right)&\end{cases}\operatorname{with}q=\operatorname{min}\left(\left|z-A\right|,\left|z-B\right|,\left|z-C\right|\right)\operatorname{with}z=\operatorname{iterate}^{20}z\to z-\frac{\left(z-A\right)\cdot \left(z-B\right)\cdot \left(z-C\right)}{3z^{2}-2\cdot \left(A+B+C\right)z+\left(AB+BC+CA\right)}\operatorname{from}z=\frac{p}{1}`,
)
expr`q_2=0.1base2`
expr`q_4=0.\digit q\digit 5base36`
show(
  expr`a\cdot \left(\operatorname{valid}a\and y>0\and -1<x<0\right)\operatorname{with}a=\operatorname{oklch}\left(\frac{q_{2}+10}{20},y,360x\right)`,
)
show(
  expr`\operatorname{firstvalid}\operatorname{oklab}\left(C.x+.4,.5\cdot \left(x+0.5\right),0.5\cdot \left(y+0.5\right)\right)`,
)
expr`circle\left(\left(2,3\right),q_2+4\right)`
expr`rgb\left(a\left[1\right],a\left[2\right],a\left[3\right]\right)witha=255\cdot \left(0.45sin\frac{5\left|\left[a,b,c\right]\right|}{n}+0.5\right)withseqiterate^{50}\begin{list}r\to s\\s\to z\\z\to zz+p\\a\to a+dot\left(z-s,s-r\right)\\b\to b+dot\left(z-s,z-s\right)\\c\to c+dot\left(z-s,z-r\right)\\n\to n+1\end{list}whilez.realz.real+z.imagz.imag<4from\begin{list}r=0i\\s=0i\\z=0i\\a=\frac{0}{1}\\b=\frac{0}{1}\\c=\frac{0}{1}\end{list}`
expr`hsv\left(360\left|iterate^{20}z\to z^{2}+pwhile\left|z\right|\leq 2from\frac{0i}{1}\right|,1,1\right)`
expr`firstvalid\left(oklch\left(.4,y,360x\right),oklch\left(.5,y,360x\right),oklch\left(.6,y,360x\right),oklch\left(.7,y,360x\right),oklch\left(.8,y,360x\right),oklch\left(.9,y,360x\right),oklch\left(.95,y,360x\right)\right)`
expr`\begin{cases}rgb\left(128,255,0\right)&\left|p\right|<.5\\rgb\left(255,255,0\right)&y<.7\\rgb\left(0,255,128\right)&\end{cases}`
expr`2+3`
expr`\left(4-5\right)\odot \left(3+9i\right)`
expr`\frac{2}{3}i-\sqrt{4}`
expr`\left[2,3\right]\times \left[4,5\right]`
expr`\left(5mod6\right)^{7.3}`
expr`-2\cdot \pi mod6`
expr`73\cdot 4base15base2`
expr`73\cdot 4base15`
expr`z^2+c`.field.setPrefix((x) => x.latex`f\left(z,c\right)=`)
expr`z^2+c`.field.setPrefix((x) => x.latex`detail=`)
expr`y=2x^{2}-7z+3`
expr`polygon\left(\left(2,3\right),\left(7,-3\right),\left(1,0\right)\right)`
expr`sin\left(a+b\right)=sinacosb+sinbcosa`
expr`\neg 2=3+\neg 5\left(\neg 3\right)4\neg 4`
expr`\left(\sqrt{\int_{3}^{5k}\sqrt[\frac{\sum_{n=1}^{4}\prod_{n=2}^{6}8}{7}]{\begin{matrix}a&b\\c&\begin{cases}9&x<y\\0&\end{cases}\end{matrix}}}\right)`
expr`\begin{matrix}2sin3&2+sin+3&\left(2\right)sin\left(3\right)\\2with3&2with+3&\left(2\right)with\left(3\right)\\2height3&2+height+3&\left(2\right)height\left(3\right)\\&&3++3---4+++++5+-6\end{matrix}`
expr`\frac{\begin{matrix}\ux0&\ux1\uxv1&\ux2\uxv2&\ux3\uxv3\\\ux4\uxv4&\ux5\uxv5&\ux6\uxv6&\ux7\uxv7\\\ux8&\ux9&&\end{matrix}}{\frac{\frac{\ux0\ux1\ux2\ux3\ux4\ux5\ux6\ux7}{\uxv1\uxv2\uxv3\uxv4\uxv5\uxv6\uxv7}}{\ux8\ux9}}`
expr`2\cdot 3a_{4568}^{923^{9^{5}}}+\frac{0\sum_{n=23}^{49}4\int 2\left[x^{2}fori=\left[1...10\right]\right]n\begin{matrix}1&2\\3&4\end{matrix}^{\frac{4362}{\frac{2}{3}+4}}}{4321+\begin{cases}\begin{matrix}7&1&2\\8&\frac{5}{4}3&4\end{matrix}&y\geq 4\\27^{8^{\frac{9}{3}}}&x\nless 3\\5sin+3-cos2bx_{5}withx=5width-3&\\5+sin3-cos2bx_{5}withx=5-width36&\\\left(54\right)sin\left(36\right)with\left(78\right)widthheight\left(89\right)&\\2\cdot -3-3+-cos2-cos3&\\2÷-3---4++5+-6&\\log_{3}7&\\sin^{2}5+sin^{2}\left(5\right)\left[1...100\right]sin...4...sin.3&\\window.width+sin.h_{2}+\left[2,8,9\right].minwidth=width&\end{cases}+^{4}93425}3a_{2}`
expr`\sum_{n=\sum_{n=\sum_{n=\sum_{n=\sum_{n=11}^{}}^{\sum_{n=10}^{\sum_{n=9}^{}}}}^{\sum_{n=8}^{\sum_{n=7}^{}}}}^{\sum_{n=6}^{\sum_{n=5}^{}}}}^{\sum_{n=4}^{\sum_{n=3}^{\sum_{n=2}^{\sum_{n=1}^{}}}}}`
expr`\begin{matrix}2=3\\2\neq 3\\2<3\\2>3\\2\leq 3\\2\geq 3\\2\nless 3\\2\ngtr 3\\2\nleq 3\\2\ngeq 3\end{matrix}`
expr`\ux1\ux+\uxv2\ux-\ux3`

{
  const { field: finalField } = new Expr(sheet)
  const field = new FieldInert(finalField.options)

  finalField.onBeforeChange()
  const inits = finalField.options.inits
  for (const key of inits?.getAll() || []) {
    const ext = inits!.get(key)!
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
  const field = new FieldInert(finalField.options)

  finalField.onBeforeChange()
  for (const key of autos.getAll()) {
    const ext = autos.get(key)!
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
