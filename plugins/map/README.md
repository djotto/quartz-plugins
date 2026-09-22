# Map

Quartz v5 transformer for the legacy `{{map}}` GeoJSON directive used by the Portsmouth notes.

The transformer keeps the v4 directive syntax and viewport data attributes. It accepts a caption
followed by one plain or autolinked GeoJSON URL, with `alpha`, `hexbin`, `hulls`, `legend`, `points`,
and `heatmap` boolean options. The browser runtime provides the existing Leaflet map, responsive
controls, search, layer toggles, popups, and figure-carousel integration.

Install from `https://github.com/djotto/quartz-plugins` with subdirectory
`plugins/map`. Configure it after the Obsidian Flavored Markdown transformer
and before the Figures plugin:

```yaml
- source:
    name: map
    repo: https://github.com/djotto/quartz-plugins
    subdir: plugins/map
  enabled: true
  options:
    cartoBasemapsApiKey: your-carto-basemaps-api-key
  order: 41
```

`cartoBasemapsApiKey` is required and is added to the light and dark CARTO raster tile URLs used by
Leaflet. Like any browser-side basemap key, it is visible in the published JavaScript and tile
requests.

The data URL is fetched by the browser, so it must be reachable from the published site and permit
the site's origin (the existing Portsmouth page uses `/portsmouth/addresses.json`).

The transformer is in `src/index.ts`; styles are in `src/styles.ts`. The browser code lives in
`src/runtime/`, with separate modules for data validation/search, geometry, popups, markers,
layers, controls, dependency loading, and lifecycle/carousel integration. GeoJSON enters as
`unknown` and is narrowed before use; Leaflet and its optional extensions have explicit types.

`npm run build` bundles `src/runtime/map.inline.ts` as minified browser JavaScript and
embeds it in the plugin's external resources. The generated `dist/` files are committed
for pinned installs. `npm run typecheck` checks the runtime.

`npm test` builds the plugin before running transformer and runtime unit tests.
The otton.org browser smoke test exercises the installed plugin with local Leaflet
and fixture GeoJSON, including search, layer and legend toggles, popups, theme
changes, carousel binding, failed dependencies, and SPA cleanup. It needs no
preview server or CDN access:

```sh
npm run install-plugins:locked
npx playwright test tests/smoke/map-runtime.spec.ts
```
