export const mapStyles = `
  .directive-map {
    margin: 1rem 0;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .directive-map__viewport {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    position: relative;
    height: min(28rem, 70vh);
    min-height: 18rem;
    margin: 0;
    border: 1px solid var(--lightgray);
    border-radius: 0.4rem;
    overflow: hidden;
    background: var(--light);
  }

  .directive-map__viewport .leaflet-control-attribution {
    font-size: 0.7rem;
  }

  .directive-map__viewport .leaflet-top.leaflet-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .directive-map__viewport .leaflet-control-zoom {
    order: 30;
  }

  .directive-map__expand {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 700;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    font: inherit;
    line-height: 1.1;
    cursor: pointer;
  }

  .directive-map__expand:hover {
    background: rgba(0, 0, 0, 0.78);
  }

  .directive-map__expand:focus-visible {
    outline: 2px solid var(--secondary);
    outline-offset: 2px;
  }

  .figcaption-carousel__stage .directive-map {
    margin: 0;
    width: min(96vw, 72rem);
    max-width: 96vw;
  }

  .figcaption-carousel__stage .directive-map figcaption {
    display: none;
  }

  .figcaption-carousel__stage .directive-map__viewport {
    width: min(96vw, 72rem);
    max-width: 96vw;
    height: min(86vh, 56rem);
  }

  .figcaption-carousel__stage .directive-map__expand {
    display: none !important;
  }

  .directive-map__status {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    text-align: center;
    color: var(--darkgray);
    background: var(--light);
    z-index: 500;
  }

  .directive-map__status[hidden] {
    display: none !important;
  }

  .directive-map__viewport[data-map-state="ready"] .directive-map__status {
    display: none !important;
  }

  .directive-map__viewport[data-map-state="error"] .directive-map__status,
  .directive-map__viewport[data-map-state="empty"] .directive-map__status {
    color: var(--dark);
  }

  .directive-map__viewport .leaflet-popup-content-wrapper {
    color: var(--dark);
    background: var(--light);
    border: 1px solid var(--lightgray);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  }

  .directive-map__viewport .leaflet-popup-content {
    color: var(--dark);
  }

  .directive-map__viewport .leaflet-popup-tip {
    background: var(--light);
    border: 1px solid var(--lightgray);
    box-shadow: none;
  }

  .directive-map__viewport .leaflet-popup-close-button {
    color: var(--gray);
  }

  .directive-map__viewport .leaflet-popup-close-button:hover {
    color: var(--dark);
  }

  .leaflet-popup-content .directive-map__popup-note {
    margin-top: 0.25rem;
    color: var(--gray);
    font-size: 0.92em;
    line-height: 1.35;
  }

  .leaflet-popup-content .directive-map__popup {
    min-width: min(19rem, 70vw);
    color: var(--dark);
    line-height: 1.35;
  }

  .leaflet-popup-content .directive-map__popup-address {
    color: var(--dark);
  }

  .leaflet-popup-content .directive-map__popup-address-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .leaflet-popup-content .directive-map__popup-links {
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.6rem;
  }

  .leaflet-popup-content .directive-map__popup-address-line {
    min-width: 0;
    color: var(--dark);
    font-weight: 600;
  }

  .leaflet-popup-content .directive-map__popup-address-rest {
    margin-top: 0.12rem;
  }

  .leaflet-popup-content .directive-map__popup-link {
    flex: 0 0 auto;
    font-size: 0.84em;
    white-space: nowrap;
    color: var(--secondary);
  }

  .leaflet-popup-content .directive-map__popup-link:hover {
    color: var(--tertiary);
  }

  .leaflet-popup-content .directive-map__popup-link .external-icon {
    margin-left: 0.3em;
    margin-right: 0;
    vertical-align: -0.08em;
  }

  .leaflet-popup-content .directive-map__popup-section {
    margin-top: 0.55rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  .leaflet-popup-content .directive-map__popup-section-title {
    margin: 0 0 0.35rem;
    color: var(--darkgray);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .leaflet-popup-content .directive-map__popup-postcards {
    display: grid;
    gap: 0.45rem;
  }

  .leaflet-popup-content .directive-map__popup-postcard-group {
    display: grid;
    gap: 0.35rem;
  }

  .leaflet-popup-content .directive-map__popup-postcard-group-title {
    margin: 0;
    color: var(--darkgray);
    font-size: 0.74em;
    font-weight: 700;
  }

  .leaflet-popup-content .directive-map__popup-postcard {
    padding: 0.45rem 0.55rem;
    border-radius: 0.42rem;
    background: color-mix(in srgb, var(--dark) 7%, var(--light));
    border: 1px solid color-mix(in srgb, var(--dark) 10%, var(--lightgray));
  }

  .leaflet-popup-content .directive-map__popup-postcard-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.12rem;
  }

  .leaflet-popup-content .directive-map__popup-postcard-recipient {
    color: var(--dark);
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.93em;
    line-height: 1.3;
  }

  .leaflet-popup-content .directive-map__popup-postcard-year {
    color: var(--darkgray);
    flex: 0 0 auto;
    font-size: 0.82em;
    white-space: nowrap;
  }

  .leaflet-marker-icon.directive-map__point-icon {
    display: block;
    width: 14px !important;
    height: 14px !important;
    margin-left: -7px !important;
    margin-top: -7px !important;
    box-sizing: border-box;
    border: 2px solid var(--directive-map-point-stroke, #3388ff);
    border-radius: 999px;
    background: var(--directive-map-point-fill, rgba(51, 136, 255, 0.35));
    padding: 0;
    overflow: visible;
    transition:
      transform 140ms ease,
      opacity 140ms ease,
      box-shadow 140ms ease;
  }

  .leaflet-marker-icon.directive-map__point-icon.is-dimmed {
    transform: scale(0.92);
    opacity: 0.5;
  }

  .leaflet-marker-icon.directive-map__point-icon.is-highlighted {
    transform: scale(1.14);
  }

  .directive-map__viewport .leaflet-control-layers {
    border: 1px solid var(--lightgray);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
    order: 10;
  }

  .directive-map__viewport .leaflet-control-layers-expanded {
    padding: 0.26rem 0.36rem;
    min-width: 7.4rem;
    background: rgba(255, 255, 255, 0.94);
  }

  .directive-map__viewport .leaflet-control-layers-overlays {
    margin-top: 0.08rem;
  }

  .directive-map__viewport .leaflet-control-layers-overlays label {
    display: flex;
    align-items: center;
    gap: 0.36rem;
    margin: 0.12rem 0;
    padding-left: 0.12rem;
    white-space: nowrap;
  }

  .directive-map__viewport .leaflet-control-layers-selector {
    position: static;
    top: auto;
    margin: 0;
    flex: 0 0 auto;
  }

  .directive-map__search {
    background: rgba(255, 255, 255, 0.94);
    color: #4a4a4a;
    border: 1px solid var(--lightgray);
    border-radius: 0.4rem;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
    padding: 0.28rem;
    max-width: min(18rem, 76vw);
    font-size: 0.84rem;
    line-height: 1.15;
    order: 5;
  }

  .directive-map__search-input {
    width: 11rem;
    max-width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.24rem;
    background: #fff;
    color: #1a1a1a;
    font: inherit;
    padding: 0.24rem 0.34rem;
  }

  .directive-map__search-input:focus-visible {
    outline: 2px solid var(--secondary);
    outline-offset: 1px;
  }

  .directive-map__search-meta {
    margin-top: 0.2rem;
    color: #4a4a4a;
    font-size: 0.86em;
  }

  .directive-map__legend {
    background: rgba(255, 255, 255, 0.94);
    color: #4a4a4a;
    border: 1px solid var(--lightgray);
    border-radius: 0.4rem;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
    padding: 0.22rem;
    min-width: 10.5rem;
    max-width: min(17.5rem, 78vw);
    font-size: 0.84rem;
    line-height: 1.15;
  }

  .directive-map__legend.is-collapsed {
    min-width: 0;
  }

  .directive-map__legend-disclosure {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 0.18rem 0.28rem;
    margin: 0;
    border: 0;
    border-radius: 0.24rem;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 1.1;
    text-align: left;
    cursor: pointer;
  }

  .directive-map__legend-disclosure:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .directive-map__legend-disclosure:focus-visible {
    outline: 2px solid var(--secondary);
    outline-offset: 1px;
  }

  .directive-map__legend-disclosure-label {
    font-weight: 600;
    color: #1a1a1a;
  }

  .directive-map__legend-disclosure-meta {
    color: #4a4a4a;
    font-size: 0.86em;
  }

  .directive-map__legend.is-collapsed .directive-map__legend-list {
    display: none;
  }

  .directive-map__legend-list {
    margin: 0;
    margin-top: 0.14rem;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 0.12rem;
    row-gap: 0.06rem;
  }

  .directive-map__legend-toggle {
    display: flex;
    align-items: center;
    gap: 0.34rem;
    width: 100%;
    padding: 0.14rem 0.22rem;
    margin: 0;
    border: 0;
    border-radius: 0.22rem;
    background: transparent;
    color: #4a4a4a;
    font: inherit;
    line-height: 1.1;
    text-align: left;
    cursor: pointer;
  }

  .directive-map__legend-toggle:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .directive-map__legend-toggle:focus-visible {
    outline: 2px solid var(--secondary);
    outline-offset: 1px;
  }

  .directive-map__legend-toggle.is-off {
    opacity: 0.62;
  }

  .directive-map__legend-toggle.is-highlighted {
    background: rgba(0, 0, 0, 0.08);
  }

  .directive-map__legend-toggle.is-dimmed {
    opacity: 0.48;
  }

  .directive-map__legend-swatch {
    width: 0.78rem;
    height: 0.78rem;
    flex: 0 0 auto;
    border-radius: 999px;
    box-sizing: border-box;
    border: 2px solid var(--directive-map-legend-color, #3388ff);
    background: var(--directive-map-legend-color, #3388ff);
    opacity: 0.85;
  }

  .directive-map__legend-toggle.is-off .directive-map__legend-swatch {
    opacity: 0.2;
  }

  .directive-map__legend .directive-map__legend-toggle .directive-map__legend-label {
    min-width: 0;
    flex: 1 1 auto;
    color: #4a4a4a !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .directive-map__legend .directive-map__legend-count {
    flex: 0 0 auto;
    color: #4a4a4a !important;
    font-size: 0.8em;
  }
`;
