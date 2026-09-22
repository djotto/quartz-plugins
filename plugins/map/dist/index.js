// src/styles.ts
var mapStyles = `
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

// src/runtime/map.inline.ts
var map_inline_default = `"use strict";(()=>{var ne=".directive-map__viewport[data-map-geojson-url]",He=".directive-map__status",Fe=".directive-map__expand",Z="mapBound",re="[DirectiveMap]";function z(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)}function oe(e){return z(e)&&e.type==="Feature"&&(e.properties==null||z(e.properties))&&(e.geometry==null||z(e.geometry)&&typeof e.geometry.type=="string")}var Oe=new Set(["Point","MultiPoint"]),mt=e=>{let t=e?.geometry?.type;return typeof t=="string"&&Oe.has(t)},yt=e=>{let t=z(e)?e.type:void 0;return typeof t=="string"&&Oe.has(t)},fe=e=>{let t=e?.properties;if(!t||typeof t!="object")return null;let n=z(t.district)?t.district.name:null,c=[t.group,n,t.district,t.area,t.label];for(let s of c)if(typeof s=="string"&&s.trim())return s.trim();return null},Ne=e=>e===!0?!0:typeof e!="string"?!1:e.trim().toLowerCase()==="true",de=e=>{let t=e?.properties;return!t||typeof t!="object"?!1:Ne(t.exclude)||Ne(t.exclude_from_hulls)},Q=(e,t=!0)=>{if(typeof e!="string")return t;let n=e.trim().toLowerCase();return["on","true","1","yes"].includes(n)?!0:["off","false","0","no"].includes(n)?!1:t},se=e=>typeof e=="string"?e.trim().toLowerCase():"",pe=(e,t)=>{if(t){if(typeof e=="string"){let n=e.trim();n.length>0&&t.push(n);return}if(Array.isArray(e)){e.forEach(n=>pe(n,t));return}!e||typeof e!="object"||Object.values(e).forEach(n=>pe(n,t))}},Te=(e,t)=>{if(!t)return!0;let n=[];return pe(e?.properties,n),typeof e?.id=="string"&&n.push(e.id),n.some(c=>c.toLowerCase().includes(t))},je=(e,t)=>t?z(e)&&e.type==="FeatureCollection"&&Array.isArray(e.features)?{...e,features:e.features.filter(n=>oe(n)&&Te(n,t))}:oe(e)?Te(e,t)?e:{type:"FeatureCollection",features:[]}:{type:"FeatureCollection",features:[]}:e,ie=(e,t,n)=>{if(!Array.isArray(n)||n.length<2)return;let c=Number(n[0]),s=Number(n[1]);!Number.isFinite(s)||!Number.isFinite(c)||e.push({feature:t,latlng:[s,c]})},me=e=>{let t=[],n=c=>{if(!oe(c)||!mt(c))return;let s=c?.geometry;if(!(!s||typeof s!="object")){if(s.type==="Point"){ie(t,c,s.coordinates);return}s.type==="MultiPoint"&&Array.isArray(s.coordinates)&&s.coordinates.forEach(p=>{ie(t,c,p)})}};if(z(e)&&e.type==="FeatureCollection"&&Array.isArray(e.features))return e.features.forEach(n),t;if(oe(e))return n(e),t;if(yt(e))return e.type==="Point"?ie(t,null,e.coordinates):Array.isArray(e.coordinates)&&e.coordinates.forEach(c=>{ie(t,null,c)}),t;throw new Error("GeoJSON must be a Feature/FeatureCollection with Point features")};var W=e=>typeof e=="string"&&/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(e.trim()),ye=e=>{let t=e?.properties;if(!t||typeof t!="object")return null;let n=z(t.district)?t.district.color:null,c=[t["marker-color"],t.markerColor,t.color,n];for(let s of c)if(W(s))return s.trim();return null},he=e=>{if(!W(e))return null;let t=e.trim().slice(1),n=t.length===3?t.split("").map(s=>s+s).join(""):t,c=Number.parseInt(n,16);return Number.isFinite(c)?{r:c>>16&255,g:c>>8&255,b:c&255}:null},ht=e=>{if(!e||typeof e!="object")return null;let t=n=>$(Math.round(Number(n)||0),0,255).toString(16).padStart(2,"0");return"#"+t(e.r)+t(e.g)+t(e.b)},Ge=e=>{if(!Array.isArray(e)||e.length===0)return null;let t=0,n=0,c=0,s=0;return e.forEach(p=>{let d=Number(p?.count),u=he(p?.color);!Number.isFinite(d)||d<=0||!u||(t+=d,n+=u.r*d,c+=u.g*d,s+=u.b*d)}),t<=0?null:ht({r:n/t,g:c/t,b:s/t})},De=e=>{let t=he(e);return t?{.25:"rgba("+t.r+","+t.g+","+t.b+",0)",.6:"rgba("+t.r+","+t.g+","+t.b+",0.55)",1:"rgb("+t.r+","+t.g+","+t.b+")"}:null},Re=(e,t)=>{let n=he(e);if(!n)return null;let c=$(Number(t)||0,0,1);return"rgba("+n.r+","+n.g+","+n.b+","+c+")"},$=(e,t,n)=>Math.min(n,Math.max(t,e));var gt=(e,t)=>{!e||typeof e!="object"||(W(t)?e.__directiveMapColor=t.trim():delete e.__directiveMapColor)},Lt=e=>{let t=e?.__directiveMapColor;return W(t)?t.trim():"#3388ff"},Be=e=>{Array.isArray(e)&&e.forEach(t=>{let n=t?._omsData?.leg;!n||typeof n.setStyle!="function"||n.setStyle({color:Lt(t)})})},Ve=(e,t,n)=>{let c=W(n)?n.trim():"#3388ff",s=Re(c,.35)||"rgba(51, 136, 255, 0.35)",p=e.marker(t,{keyboard:!0,riseOnHover:!0,icon:e.divIcon({className:"directive-map__point-icon",html:"",iconSize:[14,14],iconAnchor:[7,7],popupAnchor:[0,-7]})});return typeof p.on=="function"&&p.on("add",()=>{let d=typeof p.getElement=="function"?p.getElement():null;d instanceof HTMLElement&&(d.style.setProperty("--directive-map-point-stroke",c),d.style.setProperty("--directive-map-point-fill",s))}),gt(p,c),p},Ie=(e,t)=>{!e||typeof e!="object"||(typeof t=="string"&&t.length>0?e.__directiveMapPopupHtml=t:delete e.__directiveMapPopupHtml)},qe=e=>{let t=e?.__directiveMapPopupHtml;return typeof t=="string"&&t.length>0?t:null};var Y=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),ze=(e,t=window.location.href)=>{let n=e?.properties;if(!n||typeof n!="object")return null;let c='<svg aria-hidden="true" class="external-icon" style="max-width:0.8em;max-height:0.8em;" viewBox="0 0 512 512"><path d="M320 0H288V64h32 82.7L201.4 265.4 178.7 288 224 333.3l22.6-22.6L448 109.3V192v32h64V192 32 0H480 320zM32 32H0V64 480v32H32 456h32V480 352 320H424v32 96H64V96h96 32V32H160 32z"></path></svg>',s=o=>{if(typeof o!="string")return null;let m=o.trim();if(m.length===0)return null;try{let f=new URL(m,t);return f.protocol!=="http:"&&f.protocol!=="https:"?null:f.href}catch{return null}},p=()=>Array.isArray(n.postcards)?n.postcards.filter(o=>z(o)):[],d=o=>{if(typeof o!="string")return"other";let m=o.trim().toLowerCase();return m==="destination"?"to":m==="source"?"from":"other"},u=o=>{if(typeof o!="string")return"[person unknown]";let m=o.trim().toLowerCase();return m==="destination"?"[recipient unknown]":m==="source"?"[sender unknown]":"[person unknown]"},y=typeof n.address=="string"?n.address.trim():z(n.address)&&typeof n.address.multiline=="string"?n.address.multiline.trim():"",k=typeof n.notes=="string"?n.notes.trim():"",w=s(n.nls_map_url),S=p(),H=y?y.split(/\\n+/).map(o=>o.trim()).filter(o=>o.length>0):[],T=H[0]??"",j=H.slice(1),E=k?Y(k).replace(/\\n+/g,"<br>"):"",O=(o,m)=>!o||!m?"":'<a class="external directive-map__popup-link" href="'+Y(o)+'" target="_blank" rel="noopener noreferrer">'+Y(m)+c+"</a>",D=s(n.source_url),N=[O(w,"Historic map")].concat([O(D,"Source")]).filter(o=>o.length>0).join(""),l=(()=>{if(!T&&j.length===0)return"";let o=T||N?'<div class="directive-map__popup-address-head"><div class="directive-map__popup-address-line">'+Y(T)+"</div>"+(N?'<div class="directive-map__popup-links">'+N+"</div>":"")+"</div>":"",m=j.length>0?'<div class="directive-map__popup-address-rest">'+Y(j.join(\`
\`)).replace(/\\n+/g,"<br>")+"</div>":"";return o+m})(),A=(()=>{let o={to:[],from:[],other:[]};for(let i of S)o[d(i.role)].push(i);let m=i=>{let h=typeof i.year_summary=="string"?i.year_summary.trim():"",r=Y(h||"[date unknown]"),a=typeof i.recipient=="string"?i.recipient.trim():"",C=u(i.role),x='<div class="directive-map__popup-postcard-recipient">'+Y(a||C)+"</div>",M=typeof i.notes=="string"?i.notes.trim():"",b=s(i.source_url),v=M?'<div class="directive-map__popup-note">'+Y(M).replace(/\\n+/g,"<br>")+"</div>":"",g=b?'<div class="directive-map__popup-note">'+O(b,"Source")+"</div>":"";return'<div class="directive-map__popup-postcard"><div class="directive-map__popup-postcard-head">'+x+'<div class="directive-map__popup-postcard-year">'+r+"</div></div>"+g+v+"</div>"},f=(i,h)=>h.length===0?"":'<div class="directive-map__popup-postcard-group"><div class="directive-map__popup-postcard-group-title">'+Y(i)+"</div>"+h.map(r=>m(r)).join("")+"</div>";return[f("Postcards received at this address",o.to),f("Postcards sent from this address",o.from),f("Other",o.other)].join("")})(),P=[];return l&&P.push('<div class="directive-map__popup-address">'+l+"</div>"),E&&P.push('<div class="directive-map__popup-note">'+E+"</div>"),A&&P.push('<div class="directive-map__popup-section"><div class="directive-map__popup-postcards">'+A+"</div></div>"),P.length?'<div class="directive-map__popup">'+P.join("")+"</div>":null},Je=e=>{if(!e||typeof e!="object")return null;let t=Number(e.count),n=Array.isArray(e.mixes)?e.mixes:[];if(!Number.isFinite(t)||t<=0||n.length===0)return null;let c=t+(t===1?" point":" points"),s=n.map(p=>{let d=typeof p?.label=="string"&&p.label.trim().length>0?p.label.trim():"Points",u=Number(p?.count),y=$(Math.round(u/t*100),0,100);return'<div class="directive-map__popup-note"><span style="display:inline-block;width:0.72rem;height:0.72rem;margin-right:0.42rem;border-radius:999px;vertical-align:-0.08rem;background:'+(W(p?.color)?p.color.trim():"#3388ff")+';"></span>'+Y(d)+" "+y+"% ("+u+(u===1?" point":" points")+")</div>"});return"<strong>"+c+"</strong>"+s.join("")};var Xe=111132,bt=e=>Number.isFinite(e)?Math.max(Math.abs(Math.cos(e*Math.PI/180)*111320),1e-6):1e-6,xt=e=>{if(!Array.isArray(e)||e.length===0)return null;let t=1/0,n=-1/0,c=1/0,s=-1/0,p=0;if(e.forEach(k=>{if(!Array.isArray(k)||k.length<2)return;let w=Number(k[0]),S=Number(k[1]);!Number.isFinite(w)||!Number.isFinite(S)||(t=Math.min(t,w),n=Math.max(n,w),c=Math.min(c,S),s=Math.max(s,S),p+=1)}),p===0)return null;let d=(t+n)/2,u=(c+s)/2,y=bt(d);return{referenceLat:d,referenceLon:u,project(k){if(!Array.isArray(k)||k.length<2)return null;let w=Number(k[0]),S=Number(k[1]);return!Number.isFinite(w)||!Number.isFinite(S)?null:{x:(S-u)*y,y:(w-d)*Xe}},unproject(k){if(!k||typeof k!="object")return null;let w=Number(k.x),S=Number(k.y);return!Number.isFinite(w)||!Number.isFinite(S)?null:[d+S/Xe,u+w/y]}}},Mt=(e,t)=>{let n=e,c=t,s=-n-c,p=Math.round(n),d=Math.round(s),u=Math.round(c),y=Math.abs(p-n),k=Math.abs(d-s),w=Math.abs(u-c);return y>k&&y>w?p=-d-u:k>w?d=-p-u:u=-p-d,{q:p,r:u}},Ye=e=>{if(!Array.isArray(e)||e.length===0)return{bins:[],radius:null,projection:null};let t=xt(e.map(E=>E?.latlng));if(!t)return{bins:[],radius:null,projection:null};let n=1/0,c=-1/0,s=1/0,p=-1/0,d=[];if(e.forEach(E=>{let O=t.project(E?.latlng);if(!O)return;let D=Number(O.x),N=Number(O.y);!Number.isFinite(D)||!Number.isFinite(N)||(d.push({key:typeof E?.key=="string"?E.key:"__ungrouped__",label:typeof E?.label=="string"?E.label:"",color:typeof E?.color=="string"?E.color:"",x:D,y:N}),n=Math.min(n,D),c=Math.max(c,D),s=Math.min(s,N),p=Math.max(p,N))}),d.length===0)return{bins:[],radius:null,projection:null};let u=Math.max(c-n,0),y=Math.max(p-s,0),k=Math.max(u,y,1),w=$(Math.round(Math.sqrt(d.length)*.9),4,11),S=k/(Math.max(1,w)*Math.sqrt(3)),H=Math.max(Math.max(S,k/120,1)*.5,.5),T=new Map;return d.forEach(E=>{let O=(Math.sqrt(3)/3*E.x-E.y/3)/H,D=2/3*E.y/H,N=Mt(O,D),l=N.q+":"+N.r,A=T.get(l);if(!A){let o={x:H*Math.sqrt(3)*(N.q+N.r/2),y:H*1.5*N.r},m=t.unproject(o);if(!m)return;A={key:l,q:N.q,r:N.r,count:0,center:m,centerProjected:o,mixes:new Map},T.set(l,A)}A.count+=1;let P=A.mixes.get(E.key);P||(P={key:E.key,label:E.label,color:E.color,count:0},A.mixes.set(E.key,P)),P.count+=1}),{bins:Array.from(T.values()).map(E=>({key:E.key,q:E.q,r:E.r,count:E.count,center:E.center,centerProjected:E.centerProjected,mixes:Array.from(E.mixes.values()).sort((O,D)=>D.count-O.count)})),radius:H,projection:t}},Ke=(e,t,n)=>{if(!e||typeof e!="object"||!n)return null;let c=Number(e.x),s=Number(e.y);if(!Number.isFinite(c)||!Number.isFinite(s)||!Number.isFinite(t)||t<=0)return null;let p=[];for(let d=0;d<6;d+=1){let u=(60*d-30)*Math.PI/180,y=n.unproject({x:c+t*Math.cos(u),y:s+t*Math.sin(u)});if(!y)return null;p.push(y)}return p},ge=e=>{if(!Array.isArray(e)||e.length<3)return 0;let t=0;for(let n=0;n<e.length;n+=1){let c=e[n],s=e[(n+1)%e.length];if(!Array.isArray(c)||!Array.isArray(s))continue;let p=Number(c[1]),d=Number(c[0]),u=Number(s[1]),y=Number(s[0]);!Number.isFinite(p)||!Number.isFinite(d)||!Number.isFinite(u)||!Number.isFinite(y)||(t+=p*y-u*d)}return t/2},te=e=>{if(!Array.isArray(e))return null;let t=new Map;e.forEach(u=>{if(!Array.isArray(u)||u.length<2)return;let y=Number(u[0]),k=Number(u[1]);!Number.isFinite(y)||!Number.isFinite(k)||t.set(k+","+y,{lat:y,lon:k})});let n=Array.from(t.values());if(n.length<3)return null;n.sort((u,y)=>u.lon!==y.lon?u.lon-y.lon:u.lat-y.lat);let c=(u,y,k)=>(y.lon-u.lon)*(k.lat-u.lat)-(y.lat-u.lat)*(k.lon-u.lon),s=[];n.forEach(u=>{for(;s.length>=2&&c(s[s.length-2],s[s.length-1],u)<=0;)s.pop();s.push(u)});let p=[];for(let u=n.length-1;u>=0;u-=1){let y=n[u];for(;p.length>=2&&c(p[p.length-2],p[p.length-1],y)<=0;)p.pop();p.push(y)}let d=s.slice(0,-1).concat(p.slice(0,-1));return d.length<3?null:d.map(u=>[u.lat,u.lon])},Ue=e=>{if(!Array.isArray(e))return[];let t=new Map;e.forEach(i=>{if(!Array.isArray(i)||i.length<2)return;let h=Number(i[0]),r=Number(i[1]);!Number.isFinite(h)||!Number.isFinite(r)||t.set(r+","+h,{lat:h,lon:r})});let n=Array.from(t.values());if(n.length<3)return[];if(n.length===3){let i=te(e);return i?[i]:[]}let c=1/0,s=-1/0,p=1/0,d=-1/0;n.forEach(i=>{c=Math.min(c,i.lon),s=Math.max(s,i.lon),p=Math.min(p,i.lat),d=Math.max(d,i.lat)});let u=Math.max(s-c,d-p,1),y=Math.max(1e-12,u*u*1e-12),k=u*20,w=(c+s)/2,S=(p+d)/2,H=n.length,T=n.concat([{lon:w-k,lat:S-u},{lon:w,lat:S+k},{lon:w+k,lat:S-u}]),j=(i,h)=>i<h?i+":"+h:h+":"+i,E=(i,h,r)=>{let a=T[i],C=T[h],x=T[r];if(!a||!C||!x)return null;let M=(C.lon-a.lon)*(x.lat-a.lat)-(C.lat-a.lat)*(x.lon-a.lon);if(Math.abs(M)<=y)return null;let b=M>0?[i,h,r]:[i,r,h],v=T[b[0]],g=T[b[1]],L=T[b[2]],R=2*(v.lon*(g.lat-L.lat)+g.lon*(L.lat-v.lat)+L.lon*(v.lat-g.lat));if(!Number.isFinite(R)||Math.abs(R)<=y)return null;let G=(v.lon*v.lon+v.lat*v.lat)*(g.lat-L.lat)+(g.lon*g.lon+g.lat*g.lat)*(L.lat-v.lat)+(L.lon*L.lon+L.lat*L.lat)*(v.lat-g.lat),V=(v.lon*v.lon+v.lat*v.lat)*(L.lon-g.lon)+(g.lon*g.lon+g.lat*g.lat)*(v.lon-L.lon)+(L.lon*L.lon+L.lat*L.lat)*(g.lon-v.lon),I={lon:G/R,lat:V/R},J=I.lon-v.lon,q=I.lat-v.lat,X=J*J+q*q;return Number.isFinite(X)?{a:b[0],b:b[1],c:b[2],circumcenter:I,circumradius2:X}:null},O=[],D=E(H,H+1,H+2);if(!D){let i=te(e);return i?[i]:[]}O.push(D);for(let i=0;i<H;i+=1){let h=T[i],r=[];if(O.forEach((x,M)=>{let b=h.lon-x.circumcenter.lon,v=h.lat-x.circumcenter.lat;b*b+v*v<=x.circumradius2+y&&r.push(M)}),r.length===0)continue;let a=new Map,C=new Set(r);r.forEach(x=>{let M=O[x];M&&[[M.a,M.b],[M.b,M.c],[M.c,M.a]].forEach(([b,v])=>{let g=j(b,v);a.has(g)?a.delete(g):a.set(g,[b,v])})}),O=O.filter((x,M)=>!C.has(M)),a.forEach(([x,M])=>{let b=E(x,M,i);b&&O.push(b)})}let N=O.filter(i=>i.a<H&&i.b<H&&i.c<H);if(N.length===0){let i=te(e);return i?[i]:[]}let l=(i,h)=>{if(!Array.isArray(i)||i.length===0)return null;let r=i.filter(b=>Number.isFinite(b)).slice().sort((b,v)=>b-v);if(r.length===0)return null;if(r.length===1)return r[0];let a=Math.min(r.length-1,Math.max(0,(r.length-1)*h)),C=Math.floor(a),x=Math.ceil(a);if(C===x)return r[C];let M=a-C;return r[C]*(1-M)+r[x]*M},A=n.map((i,h)=>{let r=1/0;for(let a=0;a<n.length;a+=1){if(a===h)continue;let C=n[a],x=C.lon-i.lon,M=C.lat-i.lat,b=x*x+M*M;b<r&&(r=b)}return Number.isFinite(r)&&r>y?Math.sqrt(r):null}).filter(i=>i!==null&&Number.isFinite(i)),P=l(A,.92)??l(N.map(i=>Math.sqrt(i.circumradius2)),.75)??null,o=i=>{let h=Number.isFinite(i)&&i>0?i*i:1/0,r=new Map;if(N.forEach(g=>{g.circumradius2>h+y||[[g.a,g.b],[g.b,g.c],[g.c,g.a]].forEach(([L,R])=>{let G=j(L,R);r.has(G)?r.delete(G):r.set(G,[L,R])})}),r.size===0)return[];let a=new Map,C=(g,L)=>{let R=a.get(g)??[];R.includes(L)||R.push(L),a.set(g,R)};r.forEach(([g,L])=>{C(g,L),C(L,g)});let x=new Set,M=[],b=Array.from(r.values()),v=g=>{let L=g.map(R=>{let G=T[R];return[G.lat,G.lon]});return Math.abs(ge(L))>y?L:null};return b.forEach(([g,L])=>{let R=j(g,L);if(x.has(R))return;let G=[g],V=g,I=L,J=0;for(;J<b.length+4;){x.add(j(V,I)),G.push(I);let q=a.get(I)??[];if(q.length===0)break;if(I===g){G.pop();let U=v(G);U&&M.push(U);break}let X=q.filter(U=>U!==V),K=X.find(U=>!x.has(j(I,U)))??null;if(K==null&&X.length>0&&(K=X[0]),K==null)break;V=I,I=K,J+=1}}),M.slice().sort((g,L)=>Math.abs(ge(L))-Math.abs(ge(g)))},m=P!==null&&Number.isFinite(P)&&P>0?[P*2.1,P*3,P*4.2,1/0]:[1/0];for(let i of m){let h=o(i);if(h.length>0)return h}let f=te(e);return f?[f]:[]};var Ze=(e,t,n=null)=>{let c=!(n&&n.showPoints===!1),s=!(n&&n.showAlpha===!1),p=!(n&&n.showHexbin===!1),d=!(n&&n.showHulls===!1),u=n&&typeof n.heatPaneName=="string"&&n.heatPaneName.trim().length>0?n.heatPaneName.trim():"",y=n&&n.spiderfier&&typeof n.spiderfier.addMarker=="function"?n.spiderfier:null,k=!(n&&n.showHeat===!1)&&e&&typeof e.heatLayer=="function",w=e.featureGroup(),S=e.featureGroup(),H=e.featureGroup(),T=e.featureGroup(),j=e.featureGroup(),E=e.featureGroup(),O=new Map,D=new Map,N=[],l=0,A=0;k&&w.addLayer(E),p&&w.addLayer(H),d&&w.addLayer(j),s&&w.addLayer(T),c&&w.addLayer(S);let P=me(t),o=P.length>0?e.latLngBounds(P.map(r=>r.latlng)):null;n&&n.hullData&&me(n.hullData).forEach(({feature:r,latlng:a})=>{if(de(r))return;let C=ye(r)||"#3388ff",M=(fe(r)||""||"__ungrouped__")+"\\0"+C,b=D.get(M)??[];b.push(a),D.set(M,b)}),P.forEach(({feature:r,latlng:a})=>{l+=1;let C=ye(r)||"#3388ff",x=fe(r)||"",M=(x||"__ungrouped__")+"\\0"+C,b=D.get(M),v=O.get(M);if(v||(v={key:M,label:x,color:C,count:0,points:[],hullPoints:Array.isArray(b)?b.slice():[],alphaPoints:[],hexbinLayer:p?e.featureGroup():null,pointLayer:c?e.featureGroup():null,alphaLayer:s?e.featureGroup():null,hullLayer:d?e.featureGroup():null,heatLayer:k?e.featureGroup():null},O.set(M,v)),c){let g=Ve(e,a,C),L=ze(r);L&&!y&&typeof g.bindPopup=="function"&&g.bindPopup(L),L&&y&&Ie(g,L),v.pointLayer&&((typeof S.hasLayer!="function"||!S.hasLayer(v.pointLayer))&&S.addLayer(v.pointLayer),v.pointLayer.addLayer(g),y&&y.addMarker(g),A+=1)}v.points.push(a),de(r)||(b||v.hullPoints.push(a),v.alphaPoints.push(a)),v.count+=1,N.push({key:M,label:x,color:C,latlng:a})});let m=Array.from(O.values());if(p){let r=e.featureGroup(),{bins:a,radius:C,projection:x}=Ye(N);if(Array.isArray(a)&&a.length>0&&C!==null&&Number.isFinite(C)&&x){let M=a.reduce((b,v)=>Math.max(b,Number(v?.count)||0),0);M>0&&(a.forEach(b=>{let v=Ke(b.centerProjected,C,x);if(!v)return;let g=Ge(b.mixes)||"#3388ff",R=.14+$(b.count/M,0,1)*.42,G=e.polygon(v,{color:g,weight:1.2,opacity:.75,fillColor:g,fillOpacity:R}),V=Je(b);V&&typeof G.bindPopup=="function"&&G.bindPopup(V),r.addLayer(G),A+=1}),(typeof H.hasLayer!="function"||!H.hasLayer(r))&&H.addLayer(r))}}d&&m.forEach(r=>{let a=te(r.hullPoints);if(!a)return;let C=e.polygon(a,{color:r.color,weight:2,opacity:1,fill:!1});r.hullLayer&&((typeof j.hasLayer!="function"||!j.hasLayer(r.hullLayer))&&j.addLayer(r.hullLayer),r.hullLayer.addLayer(C),A+=1),typeof C.bringToBack=="function"&&C.bringToBack()}),s&&m.forEach(r=>{if(!r.alphaLayer)return;let a=Ue(r.alphaPoints);a.length!==0&&((typeof T.hasLayer!="function"||!T.hasLayer(r.alphaLayer))&&T.addLayer(r.alphaLayer),a.forEach(C=>{let x=e.polygon(C,{color:r.color,weight:2.4,opacity:.95,fillColor:r.color,fillOpacity:.08,dashArray:"6 4"});r.alphaLayer?.addLayer(x),A+=1}))});let f=e.heatLayer;k&&f&&m.forEach(r=>{if(!Array.isArray(r.points)||r.points.length===0)return;let a=De(r.color),C=f(r.points.map(x=>[x[0],x[1],.7]),{radius:22,blur:16,maxZoom:18,minOpacity:.2,...u?{pane:u}:{},...a?{gradient:a}:{}});r.heatLayer&&((typeof E.hasLayer!="function"||!E.hasLayer(r.heatLayer))&&E.addLayer(r.heatLayer),r.heatLayer.addLayer(C),A+=1)});let i=[];c&&typeof S.getLayers=="function"&&S.getLayers().length>0&&i.push({key:"points",label:"Points",layer:S}),p&&typeof H.getLayers=="function"&&H.getLayers().length>0&&i.push({key:"hexbin",label:"Hexbin",layer:H}),d&&typeof j.getLayers=="function"&&j.getLayers().length>0&&i.push({key:"hulls",label:"Hulls",layer:j}),s&&typeof T.getLayers=="function"&&T.getLayers().length>0&&i.push({key:"alpha",label:"\\u03B1-shape",layer:T}),k&&typeof E.getLayers=="function"&&E.getLayers().length>0&&i.push({key:"heat",label:"Heat",layer:E});let h=m.map(r=>{let a=[];return r.hexbinLayer&&typeof r.hexbinLayer.getLayers=="function"&&r.hexbinLayer.getLayers().length>0&&a.push({type:"hexbin",layer:r.hexbinLayer,root:H}),r.pointLayer&&typeof r.pointLayer.getLayers=="function"&&r.pointLayer.getLayers().length>0&&a.push({type:"points",layer:r.pointLayer,root:S}),r.alphaLayer&&typeof r.alphaLayer.getLayers=="function"&&r.alphaLayer.getLayers().length>0&&a.push({type:"alpha",layer:r.alphaLayer,root:T}),r.hullLayer&&typeof r.hullLayer.getLayers=="function"&&r.hullLayer.getLayers().length>0&&a.push({type:"hulls",layer:r.hullLayer,root:j}),r.heatLayer&&typeof r.heatLayer.getLayers=="function"&&r.heatLayer.getLayers().length>0&&a.push({type:"heat",layer:r.heatLayer,root:E}),{key:r.key,label:r.label,color:r.color,count:r.count,memberLayers:a}});return{layer:w,sourcePointCount:l,renderedGeometryCount:A,fitBounds:o,legendEntries:h,layerToggleEntries:i}};var $e=e=>{if(e){if(typeof e.eachLayer=="function"){e.eachLayer(t=>{$e(t)});return}if(typeof e.bringToFront=="function")try{e.bringToFront()}catch{}}},Qe=e=>{if(e){if(typeof e.eachLayer=="function"){e.eachLayer(t=>{Qe(t)});return}if(typeof e.bringToBack=="function")try{e.bringToBack()}catch{}}},We=e=>{let t=e?.type;return t==="heat"?0:t==="hexbin"?1:t==="hulls"?2:t==="alpha"?3:4},et=e=>Array.isArray(e)?e.filter(t=>!!t&&!!t.layer&&!!t.root).slice().sort((t,n)=>We(t)-We(n)):[],tt=(e,t)=>!(!e||!t||!t.layer||!t.root||typeof t.root.hasLayer=="function"&&!t.root.hasLayer(t.layer)||typeof e.hasLayer=="function"&&!e.hasLayer(t.root)),le=(e,t)=>{!e||!Array.isArray(t)||t.forEach(n=>{et(n?.memberLayers).forEach(s=>{if(tt(e,s)){if(s.type==="heat"){Qe(s.layer);return}$e(s.layer)}})})},nt=(e,t,n,c=null)=>{let s=Array.isArray(n)?n.filter(o=>o&&typeof o.label=="string"&&o.label.trim().length>0&&Array.isArray(o.memberLayers)&&o.memberLayers.length>0):[];if(s.length<2)return()=>{};let p=!!(c&&c.collapsedByDefault),d=new e.Control({position:"bottomleft"}),u=new Map(s.map(o=>[o.key,!0])),y=new Map,k=new WeakMap,w=null,S=(o,m)=>{let f=y.get(o.key);f&&(f.button.classList.toggle("is-off",!m),f.button.setAttribute("aria-pressed",m?"true":"false"),f.button.title=(m?"Hide ":"Show ")+o.label)},H=o=>{let m=Number(o);return Number.isFinite(m)?m:null},T=o=>{if(!o||typeof o!="object"&&typeof o!="function")return null;if(k.has(o))return k.get(o);let m=o.options||{},f;return typeof o.setStyle=="function"?f={kind:"path",opacity:H(m.opacity)??1,fillOpacity:H(m.fillOpacity)??null,weight:H(m.weight)??null,radius:typeof o.getRadius=="function"?H(o.getRadius()):null}:typeof o.setOptions=="function"&&Object.prototype.hasOwnProperty.call(m,"minOpacity")?f={kind:"heat",minOpacity:H(m.minOpacity)??.2}:typeof o.setOpacity=="function"&&typeof o.getElement=="function"?f={kind:"marker",opacity:H(m.opacity)??1}:f={kind:"none"},k.set(o,f),f},j=(o,m)=>{let f=T(o);if(!f||f.kind==="none")return;let i=m==="dimmed",h=m==="highlighted";if(f.kind==="path"&&typeof o.setStyle=="function"){let r={};if(f.opacity!=null&&(r.opacity=i?Math.max(.06,f.opacity*.2):h?Math.min(1,Math.max(f.opacity,.98)):f.opacity),f.fillOpacity!=null&&(r.fillOpacity=i?Math.max(.03,f.fillOpacity*.18):h?Math.min(1,Math.max(f.fillOpacity,.52)):f.fillOpacity),f.weight!=null&&(r.weight=i?Math.max(1,f.weight*.88):h?f.weight+.9:f.weight),Object.keys(r).length>0&&o.setStyle(r),f.radius!=null&&typeof o.setRadius=="function"){let a=i?Math.max(2,f.radius*.88):h?f.radius+1.2:f.radius;o.setRadius(a)}return}if(f.kind==="heat"&&typeof o.setOptions=="function"){if(!t.hasLayer(o))return;let r=i?Math.max(.03,f.minOpacity*.35):h?Math.min(.95,Math.max(f.minOpacity+.08,.28)):f.minOpacity;try{o.setOptions({minOpacity:r}),typeof o.redraw=="function"&&o.redraw()}catch{}}if(f.kind==="marker"&&typeof o.setOpacity=="function"){let r=i?Math.max(.18,f.opacity*.42):h?1:f.opacity;o.setOpacity(r);let a=typeof o.getElement=="function"?o.getElement():null;a instanceof HTMLElement&&(a.classList.toggle("is-dimmed",!!i),a.classList.toggle("is-highlighted",!!h))}},E=(o,m)=>{if(o){if(typeof o.eachLayer=="function"){o.eachLayer(f=>{E(f,m)});return}j(o,m)}},O=o=>tt(t,o),D=(o,m)=>{o.memberLayers.forEach(f=>{O(f)&&E(f.layer,m)})},N=o=>{if(!o)return;et(o.memberLayers).forEach(f=>{if(!O(f))return;let{layer:i,root:h}=f;if(typeof i.bringToFront=="function")try{i.bringToFront();return}catch{}typeof h.removeLayer=="function"&&typeof h.addLayer=="function"&&(h.removeLayer(i),h.addLayer(i))})},l=()=>{let o=typeof w=="string"&&w.length>0;if(s.forEach(f=>{let i=y.get(f.key),h=u.get(f.key)!==!1,r=o&&w===f.key,a=o&&!r&&h;if(i&&(i.button.classList.toggle("is-highlighted",!!r),i.button.classList.toggle("is-dimmed",!!a)),!h)return;D(f,a?"dimmed":r?"highlighted":"normal")}),!o){le(t,s);return}let m=s.find(f=>f.key===w);!m||u.get(m.key)===!1||N(m)},A=o=>{let m=typeof o=="string"&&o.length>0?o:null;w!==m&&(w=m,l())},P=o=>{let f=!(u.get(o.key)!==!1);o.memberLayers.forEach(i=>{if(!i||!i.layer||!i.root)return;let{layer:h,root:r}=i;f?(typeof r.hasLayer!="function"||!r.hasLayer(h))&&r.addLayer(h):(typeof r.hasLayer!="function"||r.hasLayer(h))&&r.removeLayer(h)}),u.set(o.key,f),S(o,f),l()};return d.onAdd=()=>{let o=document.createElement("div");o.className="directive-map__legend",o.setAttribute("role","group"),o.setAttribute("aria-label","Map legend"),o.addEventListener("mouseleave",()=>{A(null)}),o.addEventListener("focusout",x=>{let M=x.relatedTarget;(!(M instanceof Node)||!o.contains(M))&&A(null)});let m=document.createElement("button");m.type="button",m.className="directive-map__legend-disclosure";let f=document.createElement("span");f.className="directive-map__legend-disclosure-label",f.textContent="Key";let i=document.createElement("span");i.className="directive-map__legend-disclosure-meta";let h=document.createElement("ul");h.className="directive-map__legend-list";let r="directive-map-legend-"+Math.random().toString(36).slice(2,10);h.id=r;let a=p,C=()=>{o.classList.toggle("is-collapsed",a),h.hidden=a,m.setAttribute("aria-expanded",a?"false":"true"),m.setAttribute("aria-controls",r),i.textContent=a?String(s.length)+" districts":"Hide"};return s.forEach(x=>{let M=document.createElement("li"),b=document.createElement("button");b.type="button",b.className="directive-map__legend-toggle";let v=document.createElement("span");v.className="directive-map__legend-swatch",v.style.setProperty("--directive-map-legend-color",x.color),v.setAttribute("aria-hidden","true");let g=document.createElement("span");if(g.className="directive-map__legend-label",g.textContent=x.label,b.appendChild(v),b.appendChild(g),x.count>0){let L=document.createElement("span");L.className="directive-map__legend-count",L.textContent=String(x.count),L.setAttribute("aria-hidden","true"),b.appendChild(L)}b.addEventListener("click",L=>{L.preventDefault(),L.stopPropagation(),P(x)}),b.addEventListener("mouseenter",()=>{A(x.key)}),b.addEventListener("focus",()=>{A(x.key)}),y.set(x.key,{button:b}),S(x,u.get(x.key)!==!1),M.appendChild(b),h.appendChild(M)}),m.appendChild(f),m.appendChild(i),m.addEventListener("click",x=>{x.preventDefault(),x.stopPropagation(),a=!a,C()}),C(),l(),o.appendChild(m),o.appendChild(h),e?.DomEvent&&(typeof e.DomEvent.disableClickPropagation=="function"&&e.DomEvent.disableClickPropagation(o),typeof e.DomEvent.disableScrollPropagation=="function"&&e.DomEvent.disableScrollPropagation(o)),o},d.addTo(t),()=>{A(null);try{d.remove()}catch{}}},rt=(e,t,n,c=null)=>{let s=Array.isArray(n)?n.filter(u=>u&&typeof u.label=="string"&&u.label.trim().length>0&&u.layer&&typeof u.layer.addTo=="function"):[];if(s.length<2)return()=>{};let p={};s.forEach(u=>{p[u.label]=u.layer});let d=e.control.layers(void 0,p,{position:"topleft",collapsed:!!(c&&c.collapsedByDefault)});return d.addTo(t),()=>{try{d.remove()}catch{}}},ot=(e,t,n)=>{if(!e||!t||typeof n!="function")return()=>{};let c=new e.Control({position:"topleft"}),s=null,p=null,d="",u=()=>{let y=s instanceof HTMLInputElement?s.value:"",k=se(y);if(k===d)return;let w=n(y)||{};d=k,p instanceof HTMLElement&&(p.textContent=typeof w.message=="string"&&w.message.length>0?w.message:"",p.hidden=p.textContent.length===0)};return c.onAdd=()=>{let y=document.createElement("div");return y.className="directive-map__search",y.setAttribute("role","search"),y.setAttribute("aria-label","Search map points"),s=document.createElement("input"),s.type="search",s.className="directive-map__search-input",s.placeholder="Search points",s.autocomplete="off",s.setAttribute("aria-label","Search map points"),p=document.createElement("div"),p.className="directive-map__search-meta",p.hidden=!0,y.appendChild(s),y.appendChild(p),s.addEventListener("input",k=>{k.stopPropagation(),u()}),e?.DomEvent&&(typeof e.DomEvent.disableClickPropagation=="function"&&e.DomEvent.disableClickPropagation(y),typeof e.DomEvent.disableScrollPropagation=="function"&&e.DomEvent.disableScrollPropagation(y)),y},c.addTo(t),()=>{try{c.remove()}catch{}}};var vt="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",kt="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",Et="https://cdn.jsdelivr.net/npm/leaflet.heat@0.2.0/dist/leaflet-heat.js",Ct="https://cdnjs.cloudflare.com/ajax/libs/OverlappingMarkerSpiderfier-Leaflet/0.2.6/oms.min.js",at="data-directive-map-leaflet-css",wt="data-directive-map-leaflet-js",At="data-directive-map-leaflet-heat-js",Pt="data-directive-map-leaflet-spiderfier-js",Le=null,be=null,xe=null;function Me(e,t,n){return new Promise((c,s)=>{if(!document.head){s(new Error("document.head is unavailable"));return}let p=document.querySelector(\`script[\${t}="true"]\`),d=p instanceof HTMLScriptElement?p:document.createElement("script"),u=()=>{d.removeEventListener("load",k),d.removeEventListener("error",w)},y=()=>{u(),d.remove(),s(new Error("Map dependency failed to load: "+e))},k=()=>{let S=n();if(S===null){y();return}u(),c(S)},w=()=>y();d.addEventListener("load",k,{once:!0}),d.addEventListener("error",w,{once:!0}),p||(d.src=e,d.async=!0,d.setAttribute(t,"true"),document.head.appendChild(d))})}async function it(){if(!document.querySelector(\`link[\${at}="true"]\`)&&document.head){let n=document.createElement("link");n.rel="stylesheet",n.href=vt,n.setAttribute(at,"true"),document.head.appendChild(n)}let e=()=>{let n=window.L;return n&&typeof n.map=="function"?n:null},t=e();return t||(Le??(Le=Me(kt,wt,e).catch(n=>{throw Le=null,n})),Le)}async function st(e){let t=()=>typeof e.heatLayer=="function"?!0:null;return t()?!0:(be??(be=Me(Et,At,t).catch(n=>{throw be=null,n})),be)}async function lt(){let e=()=>{let n=window.OverlappingMarkerSpiderfier;return typeof n=="function"?n:null},t=e();return t||(xe??(xe=Me(Ct,Pt,e).catch(n=>{throw xe=null,n})),xe)}function ct(e){let t=0,n='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',c=(l,A,P)=>{if(!(l instanceof HTMLElement))return;l.dataset.mapState=A,A==="loading"?l.setAttribute("aria-busy","true"):l.removeAttribute("aria-busy");let o=l.querySelector(He);o instanceof HTMLElement&&(typeof P=="string"&&(o.textContent=P),o.hidden=A==="ready",o.style.display=A==="ready"?"none":"")},s=()=>document.documentElement?.getAttribute("saved-theme")==="dark"?"dark":"light",p=l=>l==="dark"?{url:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key="+encodeURIComponent(e),options:{attribution:n,subdomains:"abcd",maxZoom:20}}:{url:"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key="+encodeURIComponent(e),options:{attribution:n,subdomains:"abcd",maxZoom:20}},d=(l,A)=>{let P=p(A);return l.tileLayer(P.url,P.options)},u=()=>typeof window.addCleanup=="function",y=()=>{if(u()){N();return}if(t)return;let l=()=>{if(t=0,!u()){t=requestAnimationFrame(l);return}N()};t=requestAnimationFrame(l)},k=()=>{let l=window.__figcaptionCarouselRuntime;return!l||typeof l.openFigure!="function"?null:l},w=l=>l instanceof HTMLElement&&l.matches("figure.directive-map"),S=()=>{let l=document.createElement("div");return l.className="directive-map__status",l.setAttribute("aria-live","polite"),l.textContent="Loading map...",l},H=l=>{l instanceof HTMLElement&&(Array.from(l.classList).forEach(A=>{A.startsWith("leaflet-")&&l.classList.remove(A)}),l.replaceChildren(),delete l.dataset[Z],l.dataset.mapState="loading",l.setAttribute("aria-busy","true"),l.appendChild(S()))},T=l=>{if(!w(l))return!1;l.classList.add("directive-map--carousel");let A=l.querySelector("figcaption");return A&&A.remove(),Array.from(l.querySelectorAll(ne)).forEach(P=>{H(P)}),!0},j=l=>{if(!(l instanceof HTMLElement))return()=>{};let A=[];return Array.from(l.querySelectorAll(ne)).forEach(o=>{A.push(D(o))}),()=>A.forEach(o=>o())},E=l=>l instanceof HTMLElement?Array.from(l.querySelectorAll(ne)).some(P=>{let o=P?.__directiveMapConsumeEscape;return typeof o=="function"&&o()===!0}):!1,O=l=>l instanceof HTMLElement?l.closest(".figcaption-carousel__stage")instanceof HTMLElement:!1,D=l=>{if(!(l instanceof HTMLElement))return()=>{};if(l.dataset?.[Z]==="true")return()=>{};l.dataset&&(l.dataset[Z]="true");let A=l.dataset.mapGeojsonUrl;if(!A)return c(l,"error","Map URL missing."),()=>{l.dataset?.[Z]==="true"&&delete l.dataset[Z]};let P=Q(l.dataset.mapShowHulls,!0),o=Q(l.dataset.mapShowHexbin,!1),m=Q(l.dataset.mapShowLegend,!0),f=Q(l.dataset.mapShowPoints,!0),i=Q(l.dataset.mapShowAlpha,!1),h=Q(l.dataset.mapShowHeatmap,!1),r=null,a=null,C=null,x="",M=!1,b=()=>{},v=()=>{},g=()=>{},L=null,R=typeof AbortController=="function"?new AbortController:null,G=l.querySelector(Fe),V=O(l),I=V?30:20,J=null,q=null,X="",K=null,U="",ce=null;c(l,"loading","Loading map..."),l.__directiveMapConsumeEscape=()=>{let _=a?._popup;return!_||typeof a?.closePopup!="function"||!(typeof _.isOpen=="function"?_.isOpen():typeof a?.hasLayer=="function"?a.hasLayer(_):!0)?!1:(a.closePopup(),!0)};let ve=["click","dblclick","mousedown","mouseup","pointerdown","touchstart"],ee=null,ae=null;G instanceof HTMLButtonElement&&(ee=_=>{_.stopPropagation()},ve.forEach(_=>{ee&&G.addEventListener(_,ee)}),ae=_=>{_.preventDefault(),_.stopPropagation();let F=l.closest("figure"),B=k();B&&w(F)&&B.openFigure(F)},G.addEventListener("click",ae));let ke=_=>{!_||typeof _.isValid!="function"||!_.isValid()||a?.fitBounds(_,{padding:[24,24],maxZoom:15})},Ee=()=>{if(!r||!a)return;let _=s();if(C&&x===_)return;let F=d(r,_);F.addTo(a),C&&typeof a.removeLayer=="function"&&a.removeLayer(C),C=F,x=_},Ce=()=>{q&&typeof a?.off=="function"&&(a.off("overlayadd",q),a.off("overlayremove",q),q=null);try{v(),b()}catch{}v=()=>{},b=()=>{},typeof a?.closePopup=="function"&&a.closePopup();try{L?.clearMarkers?.()}catch{}K&&typeof a?.removeLayer=="function"&&a.removeLayer(K),K=null},we=(_,F)=>{if(!_)return"";let B=Number.isFinite(F)?F:0;return B===0?"No matching points":"Showing "+B+" matching "+(B===1?"point":"points")},Ae=_=>{if(!r||!a||M)return{message:""};let F=se(_),B=F.length>0;U=F,Ce();let pt=je(ce,F),{layer:Pe,sourcePointCount:_e,renderedGeometryCount:ft,fitBounds:Se,legendEntries:ue,layerToggleEntries:dt}=Ze(r,pt,{showAlpha:i,showHexbin:o,showHulls:P,showPoints:f,showHeat:h,heatPaneName:X,spiderfier:L,hullData:B?ce:null});return ft?(Pe.addTo(a),K=Pe,le(a,ue),typeof a.on=="function"&&(q=()=>{le(a,ue)},a.on("overlayadd",q),a.on("overlayremove",q)),v=rt(r,a,dt,{collapsedByDefault:!V}),m?b=nt(r,a,ue,{collapsedByDefault:!V}):b=()=>{},ke(Se),requestAnimationFrame(()=>{M||(a?.invalidateSize(!1),ke(Se))}),c(l,"ready"),{message:we(F,_e)}):B?(c(l,"ready"),{message:we(F,0)}):(c(l,"empty",_e?"No renderable map features for current map options.":"No point features found in GeoJSON."),{message:""})},ut=async()=>{try{let _=await fetch(A,{signal:R?.signal});if(!_.ok)throw new Error("HTTP "+_.status);let F=await _.json();if(M||!r||!a)return;ce=F,g=ot(r,a,B=>Ae(B)),Ae(U)}catch(_){if(M||_ instanceof Error&&_.name==="AbortError")return;console.error(re,"load failed",_),c(l,"error","Failed to load GeoJSON map data.")}};return(async()=>{try{r=await it()}catch(F){if(M)return;console.error(re,"Leaflet load failed",F),c(l,"error","Leaflet failed to load.");return}if(h)try{await st(r)}catch(F){console.warn(re,"Leaflet.heat failed to load",F)}let _=null;if(f)try{_=await lt()}catch(F){console.warn(re,"OverlappingMarkerSpiderfier failed to load",F)}if(!M){try{if(a=r.map(l,{scrollWheelZoom:V}),_&&(L=new _(a,{keepSpiderfied:!0,nearbyDistance:I}),L.legColors&&typeof L.legColors=="object"&&(L.legColors.highlighted=L.legColors.usual),typeof L.addListener=="function"&&(L.addListener("click",F=>{let B=qe(F);!B||!a||typeof F?.getLatLng!="function"||a.openPopup(B,F.getLatLng())}),L.addListener("spiderfy",F=>{typeof a?.closePopup=="function"&&a.closePopup(),Be(F)}))),h&&typeof a.createPane=="function"){X="directive-map-heat-pane-"+Math.random().toString(36).slice(2,10);let F=a.createPane(X);F instanceof HTMLElement&&(F.style.zIndex="390",F.style.pointerEvents="none")}Ee(),a.setView([0,0],1),J=()=>{M||Ee()},document.addEventListener("themechange",J)}catch{if(M)return;c(l,"error","Failed to initialize map.");return}ut()}})(),()=>{M=!0,G instanceof HTMLButtonElement&&(ae&&G.removeEventListener("click",ae),ee&&ve.forEach(_=>{ee&&G.removeEventListener(_,ee)})),R?.abort();try{L?.clearListeners?.("click"),L?.clearListeners?.("spiderfy"),L?.clearMarkers?.()}catch{}J&&document.removeEventListener("themechange",J);try{Ce(),g(),a?.remove?.()}finally{delete l.__directiveMapConsumeEscape,l.dataset?.[Z]==="true"&&delete l.dataset[Z]}}},N=()=>{if(!u()){y();return}t&&(cancelAnimationFrame(t),t=0);let l=[];Array.from(document.querySelectorAll(ne)).forEach(P=>{l.push(D(P))}),typeof window.addCleanup=="function"&&window.addCleanup(()=>l.forEach(P=>P()))};window.__directiveMapRuntime={isMapFigure:w,prepareFigureForCarousel:T,bindFigure:j,consumeEscape:E},document.addEventListener("nav",N),document.readyState!=="loading"?N():document.addEventListener("DOMContentLoaded",N,{once:!0})}ct(cartoBasemapsApiKey);})();
`;

// src/index.ts
import { visit } from "unist-util-visit";
var directiveRegex = /^\s*\{\{map(?:\s+([^}]+?))?\}\}\s*/i;
var defaultMapDirectiveOptions = {
  alpha: false,
  hexbin: false,
  hulls: true,
  legend: true,
  points: true,
  heatmap: false
};
function isParagraph(node) {
  return node?.type === "element" && node.tagName === "p";
}
function splitLines(nodes) {
  const lines = [[]];
  nodes.forEach((child) => {
    if (child.type === "element" && child.tagName === "br") {
      lines.push([]);
      return;
    }
    lines[lines.length - 1].push(child);
  });
  return lines;
}
function isBlankLine(nodes) {
  return nodes.every(
    (child) => child.type === "text" && child.value.trim().length === 0
  );
}
function firstText(nodes) {
  return nodes.find((child) => child.type === "text");
}
function parseDirectiveOptionKey(value) {
  if (value === "alpha" || value === "hexbin" || value === "hulls" || value === "legend" || value === "points" || value === "heatmap") {
    return value;
  }
  return null;
}
function parseBooleanDirectiveOption(value) {
  const normalized = value.trim().toLowerCase();
  if (["on", "true", "1", "yes"].includes(normalized)) return true;
  if (["off", "false", "0", "no"].includes(normalized)) return false;
  return void 0;
}
function parseMapDirective(nodes) {
  const text = firstText(nodes);
  if (!text) return { matched: false };
  const match = text.value.match(directiveRegex);
  if (!match) return { matched: false };
  const options = { ...defaultMapDirectiveOptions };
  const optionText = (match[1] ?? "").trim();
  if (optionText) {
    const tokens = optionText.split(/\s+/);
    for (const token of tokens) {
      const eqIndex = token.indexOf("=");
      if (eqIndex <= 0 || eqIndex === token.length - 1) {
        return {
          matched: true,
          options,
          error: `Invalid map option '${token}'. Expected key=value (for example: hulls=off).`
        };
      }
      const keyText = token.slice(0, eqIndex).toLowerCase();
      const valueText = token.slice(eqIndex + 1);
      const key = parseDirectiveOptionKey(keyText);
      if (!key) {
        return {
          matched: true,
          options,
          error: `Unknown map option '${keyText}'. Supported options are: alpha, hexbin, hulls, legend, points, heatmap.`
        };
      }
      const parsedValue = parseBooleanDirectiveOption(valueText);
      if (typeof parsedValue !== "boolean") {
        return {
          matched: true,
          options,
          error: `Invalid value '${valueText}' for map option '${key}'. Use on/off (or true/false).`
        };
      }
      options[key] = parsedValue;
    }
  }
  text.value = text.value.replace(directiveRegex, "");
  return { matched: true, options };
}
function hasRenderableCaption(nodes) {
  return nodes.some((child) => {
    if (child.type === "element") return true;
    return child.value.trim().length > 0;
  });
}
function textContent(node) {
  if (node.type === "text") return node.value;
  return node.children.map(textContent).join("");
}
function extractUrlFromNodes(nodes) {
  let url;
  for (const child of nodes) {
    if (child.type === "text") {
      const value = child.value.trim();
      if (value.length === 0) continue;
      if (url) return void 0;
      if (/\s/.test(value)) return void 0;
      url = value;
      continue;
    }
    if (child.tagName !== "a") return void 0;
    if (url) return void 0;
    const href = child.properties?.href;
    if (typeof href !== "string" || href.trim().length === 0) return void 0;
    const label = textContent(child).trim();
    if (label.length > 0 && /\s/.test(label)) {
      return void 0;
    }
    url = href.trim();
  }
  return url;
}
function extractUrlFromParagraph(node) {
  if (!isParagraph(node)) return void 0;
  return extractUrlFromNodes(node.children);
}
function figureWrapper(figure) {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["figure-wrapper"] },
    children: [figure]
  };
}
function buildMapFigure(url, captionNodes, options) {
  return figureWrapper({
    type: "element",
    tagName: "figure",
    properties: { className: ["directive-map"] },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: {
          className: ["directive-map__viewport"],
          "data-map-geojson-url": url,
          "data-map-show-alpha": options.alpha ? "true" : "false",
          "data-map-show-hexbin": options.hexbin ? "true" : "false",
          "data-map-show-hulls": options.hulls ? "true" : "false",
          "data-map-show-legend": options.legend ? "true" : "false",
          "data-map-show-points": options.points ? "true" : "false",
          "data-map-show-heatmap": options.heatmap ? "true" : "false",
          "data-map-state": "loading",
          "aria-busy": "true",
          role: "region",
          "aria-label": "Embedded map"
        },
        children: [
          {
            type: "element",
            tagName: "button",
            properties: {
              type: "button",
              className: ["directive-map__expand"],
              title: "Expand map",
              "aria-label": "Expand map"
            },
            children: [{ type: "text", value: "Expand" }]
          },
          {
            type: "element",
            tagName: "div",
            properties: {
              className: ["directive-map__status"],
              "aria-live": "polite"
            },
            children: [{ type: "text", value: "Loading map..." }]
          }
        ]
      },
      {
        type: "element",
        tagName: "figcaption",
        properties: {},
        children: captionNodes
      }
    ]
  });
}
var OttonMap = (options) => {
  const cartoBasemapsApiKey = options?.cartoBasemapsApiKey?.trim();
  if (!cartoBasemapsApiKey) {
    throw new Error("[OttonMap] The cartoBasemapsApiKey option is required");
  }
  return {
    name: "OttonMap",
    htmlPlugins() {
      return [
        () => {
          return (tree, file) => {
            const source = file.data.relativePath ?? file.data.filePath ?? file.path ?? file.basename ?? "unknown file";
            const fail = (message) => {
              throw new Error(`[DirectiveMap] ${source}: ${message}`);
            };
            const requireUrlFromNodes = (nodes) => {
              const url = extractUrlFromNodes(nodes);
              if (url) return url;
              fail(
                "{{map}} URL line must contain exactly one URL (plain URL or autolinked URL) and no other content"
              );
              throw new Error("Unreachable");
            };
            const requireUrlFromParagraph = (paragraph) => {
              const url = extractUrlFromParagraph(paragraph);
              if (url) return url;
              fail(
                "{{map}} URL paragraph must contain exactly one URL (plain URL or autolinked URL) and no other content"
              );
              throw new Error("Unreachable");
            };
            visit(
              tree,
              "element",
              (node, index, parent) => {
                if (!parent || index === void 0) return;
                if (!isParagraph(node)) return;
                const paragraphNodes = node.children;
                const hasBreaks = paragraphNodes.some(
                  (child) => child.type === "element" && child.tagName === "br"
                );
                if (hasBreaks) {
                  const lines = splitLines(paragraphNodes);
                  const firstNonBlank = lines.findIndex(
                    (line) => !isBlankLine(line)
                  );
                  if (firstNonBlank === -1) return;
                  const directive2 = parseMapDirective(lines[firstNonBlank]);
                  if (!directive2.matched) return;
                  if (directive2.error) fail(directive2.error);
                  if (!hasRenderableCaption(lines[firstNonBlank])) {
                    fail("{{map}} requires caption text after the directive");
                  }
                  const nonBlankFollowingLines = lines.slice(firstNonBlank + 1).filter((line) => !isBlankLine(line));
                  if (nonBlankFollowingLines.length !== 1) {
                    fail(
                      `{{map}} expects exactly 1 URL line, found ${nonBlankFollowingLines.length}`
                    );
                  }
                  const url2 = requireUrlFromNodes(nonBlankFollowingLines[0]);
                  const replacement2 = buildMapFigure(
                    url2,
                    lines[firstNonBlank],
                    directive2.options
                  );
                  parent.children.splice(index, 1, replacement2);
                  return;
                }
                const directive = parseMapDirective(paragraphNodes);
                if (!directive.matched) return;
                if (directive.error) fail(directive.error);
                if (!hasRenderableCaption(paragraphNodes)) {
                  fail("{{map}} requires caption text after the directive");
                }
                const siblings = parent.children;
                const next = siblings[index + 1];
                if (!next || !isParagraph(next)) {
                  fail("{{map}} expects exactly 1 following URL paragraph");
                }
                const url = requireUrlFromParagraph(next);
                const replacement = buildMapFigure(
                  url,
                  paragraphNodes,
                  directive.options
                );
                siblings.splice(index, 2, replacement);
              }
            );
          };
        }
      ];
    },
    externalResources() {
      return {
        css: [{ content: mapStyles, inline: true }],
        js: [
          {
            loadTime: "afterDOMReady",
            contentType: "inline",
            script: `(() => { const cartoBasemapsApiKey = ${JSON.stringify(cartoBasemapsApiKey)}; ${map_inline_default} })()`
          }
        ]
      };
    }
  };
};
var DirectiveMap = OttonMap;
var index_default = OttonMap;
export {
  DirectiveMap,
  OttonMap,
  index_default as default
};
