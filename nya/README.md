Files whose name starts with `_` or who are in a directory starting with `_` are
ignored entirely.

After creating, deleting, or renaming a script, run the command below to ensure
`pkg/script-index.ts` is kept up-to-date.

```sh
bun make/script-index.ts
```

To check for errors while editing `.nya` files, run:

```sh
bun --watch make/check.ts
```
