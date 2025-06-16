Files whose name starts with `_` or who are in a directory starting with `_` are
ignored entirely.

After creating, deleting, or renaming a script, run `bun make/nya` to ensure all
files which rely on the nya script index are kept up to date. This also checks
for issues in files.

To check for errors while editing `.nya` files, run:

```sh
bun --watch make/nya
```

You will have to manually restart the command if you add, delete, rename, or
move a `.nya` file.
