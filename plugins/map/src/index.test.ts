import assert from "node:assert/strict";
import test, { describe } from "node:test";
import type { Element, Root } from "hast";
import type { BuildCtx } from "@quartz-community/types";
import { VFile } from "vfile";
// @ts-expect-error The CI build produces JavaScript; source exports provide its types.
import * as builtMap from "../dist/index.js";

const { DirectiveMap, OttonMap } = builtMap as typeof import("./index.js");

const mapOptions = { cartoBasemapsApiKey: "test-carto-key" };

function paragraph(text: string): Element {
  return {
    type: "element",
    tagName: "p",
    properties: {},
    children: [{ type: "text", value: text }],
  };
}

function runMap(tree: Root): void {
  const plugin = DirectiveMap(mapOptions);
  const htmlPlugin = plugin.htmlPlugins?.({} as BuildCtx)?.[0];
  assert.ok(htmlPlugin);
  const transformer = htmlPlugin as unknown as () => (
    tree: Root,
    file: VFile,
  ) => void;
  const file = new VFile({ path: "content/test.md" });
  file.data.relativePath = "content/test.md" as never;
  transformer()(tree, file);
}

function getViewport(tree: Root): Element {
  const wrapper = tree.children[0] as Element;
  const figure = wrapper.children[0] as Element;
  return figure.children[0] as Element;
}

describe("OttonMap", () => {
  test("keeps the v4 defaults and emits the expected viewport contract", () => {
    const tree: Root = {
      type: "root",
      children: [
        paragraph("{{map}} Example places"),
        paragraph("/portsmouth/addresses.json"),
      ],
    };

    runMap(tree);

    const viewport = getViewport(tree);
    assert.equal(
      viewport.properties["data-map-geojson-url"],
      "/portsmouth/addresses.json",
    );
    assert.equal(viewport.properties["data-map-show-alpha"], "false");
    assert.equal(viewport.properties["data-map-show-hexbin"], "false");
    assert.equal(viewport.properties["data-map-show-points"], "true");
    assert.equal(viewport.properties["data-map-show-hulls"], "true");
    assert.equal(viewport.properties["data-map-show-legend"], "true");
    assert.equal(viewport.properties["data-map-show-heatmap"], "false");
    assert.equal(viewport.properties["data-map-state"], "loading");
  });

  test("supports every boolean option and rejects unknown options", () => {
    const tree: Root = {
      type: "root",
      children: [
        paragraph(
          "{{map alpha=on hexbin=on hulls=off points=no heatmap=true legend=0}} Places",
        ),
        paragraph("https://example.com/places.geojson"),
      ],
    };
    runMap(tree);
    const viewport = getViewport(tree);
    assert.equal(viewport.properties["data-map-show-alpha"], "true");
    assert.equal(viewport.properties["data-map-show-hexbin"], "true");
    assert.equal(viewport.properties["data-map-show-hulls"], "false");
    assert.equal(viewport.properties["data-map-show-points"], "false");
    assert.equal(viewport.properties["data-map-show-heatmap"], "true");
    assert.equal(viewport.properties["data-map-show-legend"], "false");

    const invalid: Root = {
      type: "root",
      children: [
        paragraph("{{map unknown=on}} Places"),
        paragraph("/places.json"),
      ],
    };
    assert.throws(() => runMap(invalid), /Unknown map option 'unknown'/);
  });

  test("requires the CARTO Basemaps API key", () => {
    assert.throws(() => OttonMap(), /cartoBasemapsApiKey option is required/);
    assert.throws(
      () => OttonMap({ cartoBasemapsApiKey: "  " }),
      /cartoBasemapsApiKey option is required/,
    );
  });

  test("accepts v5 OFM's one-paragraph line-break shape", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [
            { type: "text", value: "{{map}} Places" },
            { type: "element", tagName: "br", properties: {}, children: [] },
            { type: "text", value: "/places.json" },
          ],
        },
      ],
    };
    runMap(tree);
    assert.equal(
      getViewport(tree).properties["data-map-geojson-url"],
      "/places.json",
    );
  });
});
