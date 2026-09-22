import assert from "node:assert/strict";
import test from "node:test";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";
import { getFeaturePopupHtml, buildHexbinPopupHtml } from "./popups.js";
import type { Feature } from "./types.js";

const baseUrl = "https://otton.example/portsmouth/";

test("popups escape user text and only link to HTTP(S) sources", () => {
  const feature: Feature = {
    type: "Feature",
    properties: {
      address: { multiline: '<img src=x onerror="alert(1)">\nPortsmouth' },
      notes: "<script>bad()</script> & notes",
      nls_map_url: "javascript:alert(1)",
      source_url: "/sources/address",
      postcards: [
        {
          role: "destination",
          recipient: "Alice & Bob",
          year_summary: "1910",
          source_url: "https://archive.example/card",
        },
        {
          role: "source",
          notes: "No sender recorded",
          source_url: "data:text/html,bad",
        },
      ],
    },
  };
  const html = getFeaturePopupHtml(feature, baseUrl);
  assert.ok(html);
  const tree = fromHtml(html, { fragment: true });
  const links: string[] = [];
  const text: string[] = [];
  visit(tree, "element", (node) => {
    assert.notEqual(node.tagName, "script");
    assert.notEqual(node.tagName, "img");
    if (node.tagName === "a") {
      links.push(String(node.properties.href));
      assert.equal(node.properties.target, "_blank");
      assert.deepEqual(node.properties.rel, ["noopener", "noreferrer"]);
    }
  });
  visit(tree, "text", (node) => {
    text.push(node.value);
  });
  assert.deepEqual(links, [
    "https://otton.example/sources/address",
    "https://archive.example/card",
  ]);
  assert.ok(text.includes('<img src=x onerror="alert(1)">'));
  assert.ok(text.includes("<script>bad()</script> & notes"));
  assert.ok(text.includes("Alice & Bob"));
  assert.ok(text.includes("[sender unknown]"));
  assert.ok(text.includes("Postcards received at this address"));
  assert.ok(text.includes("Postcards sent from this address"));
  assert.equal(
    getFeaturePopupHtml({ type: "Feature", properties: {} }, baseUrl),
    null,
  );
});

test("hexbin popups display counts and safely escape district labels", () => {
  const html = buildHexbinPopupHtml({
    centerProjected: { x: 0, y: 0 },
    count: 4,
    mixes: [
      { color: "#123456", label: "<North>", count: 3 },
      { color: "invalid", label: "South", count: 1 },
    ],
  });
  assert.ok(html);
  const tree = fromHtml(html, { fragment: true });
  const text: string[] = [];
  visit(tree, "text", (node) => {
    text.push(node.value);
  });
  assert.ok(text.includes("4 points"));
  assert.ok(text.includes("<North> 75% (3 points)"));
  assert.ok(text.includes("South 25% (1 point)"));
});
