import { options } from "../field/defaults.js"
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

expr`\operatorname{vector}\left(\left(-1,-.5\right),\left(-.5,1\right)\right)`
expr`J=\operatorname{line}\left(\left(0,0\right),\left(2,3\right)\right)`
expr`\operatorname{perpendicular}\left(J,\left(2,3\right)\right)`
expr`A=0.665-0.149i`
expr`B=0+0i`
expr`C=.3+.4i`
show(
  expr`\operatorname{invertdark}\begin{cases}\operatorname{rgb}\left(255,128,128,.4\right)&\left|z-A\right|=q\\\operatorname{rgb}\left(128,255,128,.4\right)&\left|z-B\right|=q\\\operatorname{rgb}\left(128,128,255,.4\right)&\end{cases}\operatorname{with}q=\operatorname{min}\left(\left|z-A\right|,\left|z-B\right|,\left|z-C\right|\right)\operatorname{with}z=\operatorname{iterate}^{20}z\to z-\frac{\left(z-A\right)\cdot \left(z-B\right)\cdot \left(z-C\right)}{3z^{2}-2\cdot \left(A+B+C\right)z+\left(AB+BC+CA\right)}\operatorname{from}z=\frac{p}{1}`,
)
expr`F=\operatorname{line}\left(A.\operatorname{point},C.\operatorname{point}\right)`
expr`\operatorname{glider}\left(F,.3\right)`
expr`q_{2}=0.1\operatorname{base}2`
expr`q_{4}=0.\digit{q}5\operatorname{base}36`
show(
  expr`a\cdot \left(\operatorname{valid}a\and y>0\and -8<x<0\right)\operatorname{with}a=\operatorname{oklch}\left(\frac{q_{2}+10}{20},\frac{y}{8},\frac{360x}{8}\right)`,
)
show(
  expr`\operatorname{firstvalid}\operatorname{oklab}\left(C.x+.4,.5\cdot \frac{x}{5}+0.25,0.5\cdot \frac{y}{5}+0.25\right)`,
)
expr`D=\operatorname{circle}\left(\left(2,3\right),q_{2}+4\right)`
expr`E=\operatorname{glider}\left(D,-.367\right)`
expr`G=\operatorname{circle}\left(E,\left(0,0\right)\right)`
expr`\operatorname{intersection}\left(D,G\right)`
expr`\operatorname{rgb}\left(a\left[1\right],a\left[2\right],a\left[3\right]\right)\operatorname{with}a=255\cdot \left(0.45\operatorname{sin}\frac{5\left|\left[a,b,c\right]\right|}{n}+0.5\right)\operatorname{withseq}\operatorname{iterate}^{50}\begin{list}r\to s\\s\to z\\z\to zz+p\\a\to a+\operatorname{dot}\left(z-s,s-r\right)\\b\to b+\operatorname{dot}\left(z-s,z-s\right)\\c\to c+\operatorname{dot}\left(z-s,z-r\right)\\n\to n+1\end{list}\operatorname{while}z.\operatorname{real}z.\operatorname{real}+z.\operatorname{imag}z.\operatorname{imag}<4\operatorname{from}\begin{list}r=0i\\s=0i\\z=0i\\a=\frac{0}{1}\\b=\frac{0}{1}\\c=\frac{0}{1}\end{list}`
expr`\operatorname{hsv}\left(360\left|\operatorname{iterate}^{20}z\to z^{2}+p\operatorname{while}\left|z\right|\leq 2\operatorname{from}\frac{0i}{1}\right|,1,1\right)`
expr`\operatorname{firstvalid}\left(\operatorname{oklch}\left(.4,y,360x\right),\operatorname{oklch}\left(.5,y,360x\right),\operatorname{oklch}\left(.6,y,360x\right),\operatorname{oklch}\left(.7,y,360x\right),\operatorname{oklch}\left(.8,y,360x\right),\operatorname{oklch}\left(.9,y,360x\right),\operatorname{oklch}\left(.95,y,360x\right)\right)`
expr`\begin{cases}\operatorname{rgb}\left(128,255,0\right)&\left|p\right|<.5\\\operatorname{rgb}\left(255,255,0\right)&y<.7\\\operatorname{rgb}\left(0,255,128\right)&\end{cases}`
expr`2+3`
expr`\left(4-5\right)\odot \left(3+9i\right)`
expr`\frac{2}{3}i-\sqrt{4}`
expr`\left[2,3\right]\times \left[4,5\right]`
expr`\left(5\operatorname{mod}6\right)^{7.3}`
expr`-2\cdot \pi \operatorname{mod}6`
expr`73\cdot 4\operatorname{base}15\operatorname{base}2`
expr`73\cdot 4\operatorname{base}15`
expr`z^{2}+c`
expr`z^{2}+c`
expr`y=2x^{2}-7z+3`
expr`\operatorname{polygon}\left(\left(2,3\right),\left(7,-3\right),\left(1,0\right)\right)`
expr`\operatorname{sin}\left(a+b\right)=\operatorname{sin}a\operatorname{cos}b+\operatorname{sin}b\operatorname{cos}a`
expr`\neg 2=3+\neg 5\left(\neg 3\right)4\neg 4`
expr`\left(\sqrt{\int_{3}^{5k}\sqrt[\frac{\sum_{n=1}^{4}\prod_{n=2}^{6}8}{7}]{\begin{matrix}a&b\\c&\begin{cases}9&x<y\\0&\end{cases}\end{matrix}}}\right)`
expr`\begin{matrix}2\operatorname{sin}3&2+\operatorname{sin}+3&\left(2\right)\operatorname{sin}\left(3\right)\\2\operatorname{with}3&2\operatorname{with}+3&\left(2\right)\operatorname{with}\left(3\right)\\2\operatorname{height}3&2+\operatorname{height}+3&\left(2\right)\operatorname{height}\left(3\right)\\&&3++3---4+++++5+-6\end{matrix}`
expr`\frac{\begin{matrix}\ux0&\ux1\uxv1&\ux2\uxv2&\ux3\uxv3\\\ux4\uxv4&\ux5\uxv5&\ux6\uxv6&\ux7\uxv7\\\ux8&\ux9&&\end{matrix}}{\frac{\frac{\ux0\ux1\ux2\ux3\ux4\ux5\ux6\ux7}{\uxv1\uxv2\uxv3\uxv4\uxv5\uxv6\uxv7}}{\ux8\ux9}}`
expr`2\cdot 3a_{4568}^{923^{9^{5}}}+\frac{0\sum_{n=23}^{49}4\int 2\left[x^{2}\operatorname{for}i=\left[1...10\right]\right]n\begin{matrix}1&2\\3&4\end{matrix}^{\frac{4362}{\frac{2}{3}+4}}}{4321+\begin{cases}\begin{matrix}7&1&2\\8&\frac{5}{4}3&4\end{matrix}&y\geq 4\\27^{8^{\frac{9}{3}}}&x\nless 3\\5\operatorname{sin}+3-\operatorname{cos}2bx_{5}\operatorname{with}x=5\operatorname{width}-3&\\5+\operatorname{sin}3-\operatorname{cos}2bx_{5}\operatorname{with}x=5-\operatorname{width}36&\\\left(54\right)\operatorname{sin}\left(36\right)\operatorname{with}\left(78\right)\operatorname{width}\operatorname{height}\left(89\right)&\\2\cdot -3-3+-\operatorname{cos}2-\operatorname{cos}3&\\2÷-3---4++5+-6&\\\operatorname{log}_{3}7&\\\operatorname{sin}^{2}5+\operatorname{sin}^{2}\left(5\right)\left[1...100\right]\operatorname{sin}...4...\operatorname{sin}.3&\\window.\operatorname{width}+\operatorname{sin}.h_{2}+\left[2,8,9\right].\operatorname{min}\operatorname{width}=\operatorname{width}&\end{cases}+^{4}93425}3a_{2}`
expr`\sum_{n=\sum_{n=\sum_{n=\sum_{n=\sum_{n=11}^{}}^{\sum_{n=10}^{\sum_{n=9}^{}}}}^{\sum_{n=8}^{\sum_{n=7}^{}}}}^{\sum_{n=6}^{\sum_{n=5}^{}}}}^{\sum_{n=4}^{\sum_{n=3}^{\sum_{n=2}^{\sum_{n=1}^{}}}}}`
expr`\begin{matrix}2=3\\2\neq 3\\2<3\\2>3\\2\leq 3\\2\geq 3\\2\nless 3\\2\ngtr 3\\2\nleq 3\\2\ngeq 3\end{matrix}`
expr`\ux1\ux+\uxv2\ux-\ux3`
expr`+-\cdot ÷=~<>\frac{}{}_{}^{}\sum_{n=}^{}\prod_{n=}^{}\coprod_{n=}^{}\sum_{n=}^{}\prod_{n=}^{}\coprod_{n=}^{}\int_{}^{},.!\left¡\right!\pm \mp \frac{}{}\cdot \times \odot \otimes \and \and \or \or \neg \neg \uparrow \to \Rightarrow \to `
expr`\sum_{n=}^{}\prod_{n=}^{}\coprod_{n=}^{}\int_{}^{}\begin{matrix}&\\&\end{matrix}\sqrt{}\sqrt[]{}\begin{list}\end{list}\begin{cases}&\\&\end{cases}\begin{cases}&\\&\end{cases}\begin{cases}&\\&\end{cases}\begin{cases}&\\&\end{cases}\neg \neg \and \and \or \or \uparrow \pm \mp \times \pi \tau \infinity `
