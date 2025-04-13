import type { Package } from "#/types"
import { PKG_POINT_3D } from "$/3d/point"
import { PKG_POINT_4D } from "$/4d/point"
import { PKG_BASE } from "$/base"
import { PKG_BOOL } from "$/bool"
import { PKG_CHEM_ELEMENTS } from "$/chem/elements"
import { PKG_COLOR_CORE } from "$/color/core"
import { PKG_COLOR_EXTRAS } from "$/color/extras"
import { PKG_CORE_CMP } from "$/core/cmp"
import { PKG_CORE_FN } from "$/core/fn"
import { PKG_CORE_OPS } from "$/core/ops"
import { PKG_DISTRIBUTIONS } from "$/data/distributions"
import { PKG_CORE_LIST } from "$/data/list"
import { PKG_LIST_EXTRAS } from "$/data/list-extras"
import { PKG_STATISTICS } from "$/data/statistics"
import { PKG_STATISTICS_COMPLEX } from "$/data/statistics-complex"
import { PKG_DEBUG } from "$/debug"
import { PKG_EVAL } from "$/eval"
import { PKG_FACTORIAL } from "$/factorial"
import { PKG_GEOMETRY } from "$/geo/dcg"
import { PKG_IMAGE_GEO } from "$/geo/image"
import { PKG_GEO_POINT } from "$/geo/point"
import { PKG_GRIDLINES } from "$/gridlines"
import { PKG_IMAGE } from "$/image"
import { PKG_DOCS_FN } from "$/item/docs-fn"
import { PKG_FOLDER } from "$/item/folder"
import { PKG_NOTES } from "$/item/note"
import { PKG_ITERATE } from "$/iterate"
import { PKG_ITHKUIL } from "$/ithkuil"
import { PKG_NUM_COMPLEX } from "$/num/complex"
import { PKG_NUM_QUATERNION } from "$/num/quaternion"
import { PKG_REAL } from "$/num/real"
import { PKG_NUMBER_THEORY } from "$/number-theory"
import { PKG_SHADER } from "$/shader"
import { PKG_SLIDER } from "$/slider"
import { PKG_SLOPE_FIELD } from "$/slope-field"
import { PKG_SPECIAL_FNS } from "$/special"
import { PKG_SYM_CORE } from "$/sym/core"
import { PKG_DERIV } from "$/sym/deriv"
import { PKG_SYM_EXTRAS } from "$/sym/extras"
import { PKG_TEXT } from "$/text"
import { PKG_TRIG_COMPLEX } from "$/trig/complex"
import { PKG_TRIG_HYPERBOLIC_REAL } from "$/trig/hyperbolic/real"
import { PKG_TRIG_REAL } from "$/trig/real"
import { PKG_UNITS } from "$/unit/pkg"
import { PKG_WITH } from "$/with"
import { PKG_WITH_SEQ } from "$/withseq"

export function allPackages(): Package[] {
  return [
    PKG_CORE_OPS,
    PKG_CORE_CMP,
    PKG_CORE_LIST,
    PKG_BOOL,
    PKG_REAL,
    PKG_TRIG_REAL,
    PKG_EVAL,
    PKG_SLIDER,
    PKG_COLOR_CORE,
    PKG_SHADER,
    PKG_GEO_POINT,
    PKG_NUM_COMPLEX,
    PKG_TRIG_COMPLEX,
    PKG_GEOMETRY,
    PKG_NUM_QUATERNION,
    PKG_TEXT,
    PKG_COLOR_EXTRAS,
    // TODO: reduce ithkuil root and affix data size (it's 56% of the bundle currently)
    PKG_ITHKUIL,
    PKG_TRIG_HYPERBOLIC_REAL,
    PKG_STATISTICS,
    PKG_NUMBER_THEORY,
    PKG_LIST_EXTRAS,
    PKG_DISTRIBUTIONS,
    PKG_ITERATE,
    PKG_GRIDLINES,
    PKG_WITH,
    PKG_WITH_SEQ,
    PKG_BASE,
    PKG_IMAGE,
    PKG_IMAGE_GEO,
    PKG_DOCS_FN,
    PKG_NOTES,
    PKG_FACTORIAL,
    PKG_CORE_FN,
    PKG_FOLDER,
    PKG_SYM_CORE,
    PKG_DERIV,
    PKG_SYM_EXTRAS,
    PKG_UNITS,
    PKG_CHEM_ELEMENTS,
    PKG_DEBUG,
    PKG_POINT_3D,
    PKG_SLOPE_FIELD,
    PKG_POINT_4D,
    PKG_STATISTICS_COMPLEX,
    PKG_SPECIAL_FNS,
  ]
}
