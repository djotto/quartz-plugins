import { h, type JSX } from "preact";

const OverflowList = ({
  children,
  ...props
}: JSX.HTMLAttributes<HTMLUListElement>) => (
  <ul {...props} class={[props.class, "overflow"].filter(Boolean).join(" ")}>
    {children}
    <li class="overflow-end" aria-hidden="true" />
  </ul>
);

let listNumber = 0;
export default () => {
  const id = `toc-list-${listNumber++}`;
  return {
    id,
    OverflowList: (props: JSX.HTMLAttributes<HTMLUListElement>) => (
      <OverflowList {...props} id={id} />
    ),
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
`,
  };
};
