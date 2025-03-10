import type { Package } from "./pkg"
import { PKG_BASE } from "./pkg/base"
import { PKG_BOOL } from "./pkg/bool"
import { PKG_COLOR_CORE } from "./pkg/color-core"
import { PKG_COLOR_EXTRAS } from "./pkg/color-extras"
import { PKG_CORE_CMP } from "./pkg/core-cmp"
import { PKG_CORE_FN } from "./pkg/core-fn"
import { PKG_CORE_LIST } from "./pkg/core-list"
import { PKG_CORE_OPS } from "./pkg/core-ops"
import { PKG_DISTRIBUTIONS } from "./pkg/distributions"
import { PKG_DOCS_FN } from "./pkg/docs-fn"
import { PKG_EVAL } from "./pkg/eval"
import { PKG_FACTORIAL } from "./pkg/factorial"
import { PKG_FOLDER } from "./pkg/folder"
import { PKG_GEOMETRY } from "./pkg/geo"
import { PKG_IMAGE_GEO } from "./pkg/geo-image"
import { PKG_GEO_POINT } from "./pkg/geo-point"
import { PKG_GRIDLINES } from "./pkg/gridlines"
import { PKG_IMAGE } from "./pkg/image"
import { PKG_ITERATE } from "./pkg/iterate"
import { PKG_ITHKUIL } from "./pkg/ithkuil"
import { PKG_LIST_EXTRAS } from "./pkg/list-extras"
import { PKG_NOTES } from "./pkg/note"
import { PKG_NUM_COMPLEX } from "./pkg/num-complex"
import { PKG_NUM_QUATERNION } from "./pkg/num-quaternion"
import { PKG_REAL } from "./pkg/num-real"
import { PKG_NUMBER_THEORY } from "./pkg/number-theory"
import { PKG_SHADER } from "./pkg/shader"
import { PKG_SLIDER } from "./pkg/slider"
import { PKG_STATISTICS } from "./pkg/statistics"
import { PKG_SYM } from "./pkg/sym"
import { PKG_TEXT } from "./pkg/text"
import { PKG_TRIG_COMPLEX } from "./pkg/trig-complex"
import { PKG_TRIG_REAL } from "./pkg/trig-real"
import { PKG_TRIG_HYPERBOLIC_REAL } from "./pkg/trigh-real"
import { PKG_WITH } from "./pkg/with"
import { PKG_WITH_SEQ } from "./pkg/withseq"

export const ALL: Package[] = [
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
  PKG_SYM,
]
