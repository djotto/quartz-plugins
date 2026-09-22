// src/components/TableOfContents.tsx
import { h as h2 } from "preact";

// src/components/styles/toc.scss
var toc_default = ".toc {\n  display: flex;\n  flex-direction: column;\n  overflow-y: hidden;\n  min-height: 1.4rem;\n  flex: 0 0.5 auto;\n  max-width: 100%;\n}\n.toc:has(button.toc-header.collapsed) {\n  flex: 0 1 1.4rem;\n}\n\nbutton.toc-header {\n  background: transparent;\n  border: 0;\n  color: var(--dark);\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  min-height: 2rem;\n  padding: 0;\n  text-align: left;\n}\nbutton.toc-header:focus-visible {\n  outline: 2px solid var(--secondary);\n  outline-offset: 3px;\n}\nbutton.toc-header h3 {\n  font-size: 1rem;\n  display: inline-block;\n  margin: 0;\n}\nbutton.toc-header .fold {\n  margin-left: 0.5rem;\n  opacity: 0.8;\n  transition: transform 0.3s ease;\n}\nbutton.toc-header.collapsed .fold {\n  transform: rotateZ(-90deg);\n}\n\nul.toc-content {\n  list-style: none;\n  margin: 0.5rem 0;\n  max-width: 100%;\n  overflow-x: hidden;\n  overflow-y: auto;\n  overscroll-behavior: contain;\n  padding: 0;\n}\nul.toc-content.collapsed {\n  display: none;\n}\nul.toc-content > li > a {\n  color: var(--gray);\n  display: block;\n  opacity: 1;\n  overflow-wrap: anywhere;\n  transition: 0.5s ease opacity, 0.3s ease color;\n}\nul.toc-content > li > a.in-view {\n  color: var(--darkgray);\n}\nul.toc-content .depth-0 {\n  padding-left: calc(1rem * 0);\n}\nul.toc-content .depth-1 {\n  padding-left: calc(1rem * 1);\n}\nul.toc-content .depth-2 {\n  padding-left: calc(1rem * 2);\n}\nul.toc-content .depth-3 {\n  padding-left: calc(1rem * 3);\n}\nul.toc-content .depth-4 {\n  padding-left: calc(1rem * 4);\n}\nul.toc-content .depth-5 {\n  padding-left: calc(1rem * 5);\n}\nul.toc-content .depth-6 {\n  padding-left: calc(1rem * 6);\n}\n\n@media all and (max-width: 800px) {\n  .toc.desktop-only {\n    display: none;\n  }\n}";

// src/components/styles/legacyToc.scss
var legacyToc_default = "details.toc summary {\n  cursor: pointer;\n}\ndetails.toc summary::marker {\n  color: var(--dark);\n}\ndetails.toc summary > * {\n  display: inline-block;\n  margin: 0;\n  padding-left: 0.25rem;\n}\ndetails.toc ul {\n  list-style: none;\n  margin: 0.5rem 1.25rem;\n  padding: 0;\n}\ndetails.toc .depth-1 {\n  padding-left: calc(1rem * 1);\n}\ndetails.toc .depth-2 {\n  padding-left: calc(1rem * 2);\n}\ndetails.toc .depth-3 {\n  padding-left: calc(1rem * 3);\n}\ndetails.toc .depth-4 {\n  padding-left: calc(1rem * 4);\n}\ndetails.toc .depth-5 {\n  padding-left: calc(1rem * 5);\n}\ndetails.toc .depth-6 {\n  padding-left: calc(1rem * 6);\n}";

// src/components/scripts/toc.inline.ts
var toc_inline_default = 'function A(e,t,r=80){if(e.length===0||t.length===0)return null;let l=new Set(t.map(n=>n.dataset.for??n.getAttribute("data-for"))),i;for(let n of e)if(!(!n.id||!l.has(n.id)))if(n.getBoundingClientRect().top-r<=0)i=n;else break;return i?.id??e.find(n=>l.has(n.id))?.id??null}function T(e,t){for(let r of e)r.classList.toggle("in-view",!!(t&&(r.dataset.for??r.getAttribute("data-for"))===t))}function H(e,t){let r=!e.classList.contains("collapsed");e.classList.toggle("collapsed",r),e.setAttribute("aria-expanded",String(!r)),t.classList.toggle("collapsed",r),t.setAttribute("aria-hidden",String(r)),t.hidden=r}function h(e=document,t=window){let r=[],l=[],i=null,n,f=!1,c=new Map,v=()=>{t.removeEventListener("scroll",u),t.removeEventListener("resize",u),n!==void 0&&(typeof t.cancelAnimationFrame=="function"&&t.cancelAnimationFrame(n),n=void 0)},m=()=>{if(n=void 0,f)return;let o=A(r,l);o!==i&&(i=o,T(l,o))};function u(){n===void 0&&(typeof t.requestAnimationFrame=="function"?n=t.requestAnimationFrame(m):m())}let L=()=>{v();for(let[s,d]of c)s.removeEventListener("click",d);c.clear();let o=Array.from(e.querySelectorAll(".toc"));for(let s of o){let d=s.querySelector(".toc-header"),p=s.querySelector(".toc-content");if(!d||!p)continue;let g=()=>H(d,p);d.addEventListener("click",g),c.set(d,g)}r=Array.from(e.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")),l=Array.from(e.querySelectorAll(".toc a[data-for]")),i=null,m(),t.addEventListener("scroll",u,{passive:!0}),t.addEventListener("resize",u,{passive:!0})},a=()=>L();e.addEventListener("nav",a),e.addEventListener("render",a),e.readyState==="loading"?e.addEventListener("DOMContentLoaded",a,{once:!0}):L();let E=()=>{if(!f){f=!0,v(),e.removeEventListener("nav",a),e.removeEventListener("render",a),e.removeEventListener("DOMContentLoaded",a);for(let[o,s]of c)o.removeEventListener("click",s);c.clear()}};return t.addCleanup?.(E),E}h();\n';

// src/components/OverflowList.tsx
import "preact";
import { jsx, jsxs } from "preact/jsx-runtime";
var OverflowList = ({
  children,
  ...props
}) => /* @__PURE__ */ jsxs("ul", { ...props, class: [props.class, "overflow"].filter(Boolean).join(" "), children: [
  children,
  /* @__PURE__ */ jsx("li", { class: "overflow-end", "aria-hidden": "true" })
] });
var listNumber = 0;
var OverflowList_default = () => {
  const id = `toc-list-${listNumber++}`;
  return {
    id,
    OverflowList: (props) => /* @__PURE__ */ jsx(OverflowList, { ...props, id }),
    overflowListAfterDOMLoaded: `
document.addEventListener("nav", () => {
  const list = document.getElementById("${id}")
  const end = list?.querySelector(".overflow-end")
  if (!list || !end || typeof IntersectionObserver === "undefined") return
  const observer = new IntersectionObserver(([entry]) => {
    list.classList.toggle("gradient-active", !entry?.isIntersecting)
  })
  observer.observe(end)
  if (typeof window.addCleanup === "function") window.addCleanup(() => observer.disconnect())
})
`
  };
};

// src/components/TableOfContents.tsx
var defaultOptions = { layout: "modern" };
var titleFor = (locale) => locale === "en-GB" || locale === "en-US" ? "Table of Contents" : "Table of Contents";
var TableOfContents_default = ((userOptions) => {
  const layout = userOptions?.layout ?? defaultOptions.layout;
  const {
    id: tocId,
    OverflowList: OverflowList2,
    overflowListAfterDOMLoaded
  } = OverflowList_default();
  const TableOfContents = (props) => {
    const fileData = props.fileData;
    if (!Array.isArray(fileData.toc) || fileData.toc.length === 0) return null;
    const entries = fileData.toc;
    const collapsed = fileData.collapseToc === true;
    return h2(
      "div",
      { class: [props.displayClass, "toc"].filter(Boolean).join(" ") },
      h2(
        "button",
        {
          type: "button",
          class: collapsed ? "collapsed toc-header" : "toc-header",
          "aria-controls": tocId,
          "aria-expanded": !collapsed
        },
        h2("h3", null, titleFor(props.cfg.locale)),
        h2(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            width: 24,
            height: 24,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": 2,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            class: "fold",
            "aria-hidden": "true"
          },
          h2("polyline", { points: "6 9 12 15 18 9" })
        )
      ),
      h2(
        OverflowList2,
        {
          id: tocId,
          class: collapsed ? "collapsed toc-content" : "toc-content",
          "aria-hidden": collapsed,
          hidden: collapsed
        },
        entries.map((entry) => {
          const slug = String(entry.slug);
          return h2(
            "li",
            { key: slug, class: `depth-${String(entry.depth)}` },
            h2("a", { href: `#${slug}`, "data-for": slug }, String(entry.text))
          );
        })
      )
    );
  };
  TableOfContents.css = layout === "modern" ? toc_default : legacyToc_default;
  TableOfContents.afterDOMLoaded = [
    toc_inline_default,
    overflowListAfterDOMLoaded
  ];
  return TableOfContents;
});

export {
  TableOfContents_default
};
//# sourceMappingURL=chunk-26HGWVFD.js.map