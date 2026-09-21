// src/components/index.tsx
var explorerOverrideScript = `
function ensureExplorerScrollTop() {
  if (sessionStorage.getItem("explorerScrollTop") === null) {
    sessionStorage.setItem("explorerScrollTop", "0")
  }
}

function closeExplorerOnMobile(event) {
  if (!event.matches) return

  for (const explorer of document.querySelectorAll(".explorer")) {
    explorer.classList.add("collapsed")
    explorer.setAttribute("aria-expanded", "false")
  }

  document.documentElement.classList.remove("mobile-no-scroll")
  document.querySelector("#quartz-body")?.classList.remove("lock-scroll")
}

const explorerMobileQuery = window.matchMedia("(max-width: 800px)")
const previousExplorerMobileCleanup = window.__ottonExplorerMobileCleanup
if (typeof previousExplorerMobileCleanup === "function") {
  previousExplorerMobileCleanup()
}

const handleExplorerMobileChange = (event) => closeExplorerOnMobile(event)
explorerMobileQuery.addEventListener("change", handleExplorerMobileChange)
window.__ottonExplorerMobileCleanup = () => {
  explorerMobileQuery.removeEventListener("change", handleExplorerMobileChange)
}

closeExplorerOnMobile(explorerMobileQuery)

ensureExplorerScrollTop()
document.addEventListener("nav", ensureExplorerScrollTop, true)
document.addEventListener("render", ensureExplorerScrollTop, true)
`;
var ExplorerOverride = () => {
  function Component() {
    return null;
  }
  Component.afterDOMLoaded = explorerOverrideScript;
  return Component;
};
var index_default = ExplorerOverride;
export {
  ExplorerOverride,
  index_default as default,
  explorerOverrideScript
};
