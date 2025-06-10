Broadcast operators like `@+` perform GLSL's automatic vector broadcasting
functionality. If one argument is a single value and the other has multiple
values, the single value gets distributed.

Structs are laid out according to this algorithm for now, but it should not be
relied on:

1. If all elements are ZSTs (zero-sized-types), the struct is a ZST.
2. If all elements are ZSTs except one, the struct's layout is equivalent to the
   non-ZST element.
3. If all non-ZST elements are vectors of the same type, where a plain scalar is
   a vector of length one, and the total length of the vectors is 2, 3, or 4,
   the layout is a `vecN`, where `N` is 2-4. When compiling to GLSL, this is the
   true representation; in JS, a struct is still created.
4. IN THE FUTURE, if there are exactly 2, 3, or 4 non-ZST elements which are
   vectors of the same scalar and same length of 2, 3, or 4, the layout will be
   a `matMxN`. When compiling to GLSL, this is the true representation; in JS, a
   struct is still created.
5. Otherwise, a struct is created.

Standards-breaking design decisions:

- Use of `^` instead of `**` for exponentiation is justified since this is
  primarily for maths, not bitwise operations.
- Use of `%` for `mod` instead of `rem` is justified since
- Use of `min(MAX, max(MIN, VAL))` for `clamp` is justified by its similarity to
  a standard CSS and JS implementation, where a minimum is usually more
  important on websites (since it is often used for styling) than a maximum,
  even though it could result in slightly longer runtimes for GLSL.
