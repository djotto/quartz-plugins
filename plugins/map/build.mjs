import { build } from "esbuild";

const inlineResources = {
  name: "map-inline-runtime",
  setup(pluginBuild) {
    pluginBuild.onLoad({ filter: /\.inline\.ts$/ }, async ({ path }) => {
      const result = await build({
        entryPoints: [path],
        bundle: true,
        write: false,
        minify: true,
        platform: "browser",
        format: "iife",
        target: "es2020",
      });
      const output = result.outputFiles?.[0]?.text;
      if (!output)
        throw new Error(`No inline JavaScript was generated for ${path}`);
      return { contents: output, loader: "text" };
    });
  },
};

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node22",
  outfile: "dist/index.js",
  plugins: [inlineResources],
});
