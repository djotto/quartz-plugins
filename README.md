# Quartz plugins for otton.org

Custom Quartz plugins used by [otton.org](https://otton.org).

Each directory under `plugins/` is an independently buildable Quartz plugin. This allows Quartz
to install a single plugin from this repository using a `subdir` source.

Built `dist/` files are committed so Quartz can install a pinned Git revision without rebuilding
the package. CI verifies that those files match the TypeScript source.

For a sibling local checkout, point Quartz directly at the package directory. Quartz's runtime
loader does not currently apply `subdir` to local repository sources.

## Development

Requires Node 22 or newer and npm 10.9.2 or newer.

```sh
npm install
npm run check
npm run build
```

## Plugins

- `content-meta`: displays created and updated dates plus reading time below article titles.
- `explorer-override`: keeps Explorer navigation state consistent across mobile layout changes.
