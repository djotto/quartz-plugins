import { defineConfig } from "tsup";
import type { Plugin } from "esbuild";
import path from "node:path";

const inlineResources: Plugin = {
  name: "toc-inline-resources",
  setup(build) {
    const workingDir = build.initialOptions.absWorkingDir ?? process.cwd();
    build.onLoad({ filter: /\.scss$/ }, async (args) => {
      const sass = await import("sass");
      return { contents: sass.compile(args.path).css, loader: "text" };
    });
    build.onLoad({ filter: /\.inline\.ts$/ }, async (args) => {
      const esbuild = await import("esbuild");
      const fs = await import("node:fs/promises");
      let source = await fs.readFile(args.path, "utf8");
      source = source
        .replace(/^export default /gm, "")
        .replace(/^export /gm, "");
      const result = await esbuild.build({
        stdin: {
          contents: source,
          loader: "ts",
          resolveDir: path.dirname(args.path),
          sourcefile: path.relative(workingDir, args.path),
        },
        bundle: true,
        write: false,
        minify: true,
        platform: "browser",
        format: "esm",
        target: "es2020",
      });
      return { contents: result.outputFiles[0]?.text ?? "", loader: "text" };
    });
  },
};

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "components/index": "src/components/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  bundle: true,
  target: "es2022",
  external: ["preact", "@quartz-community/types"],
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "preact";
  },
  esbuildPlugins: [inlineResources],
});
