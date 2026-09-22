export const figureStyles = String.raw`
.figure-wrapper {
  --figure-spacing: 1rem;
  margin-top: 0;
  margin-bottom: var(--figure-spacing);
  margin-left: 0.75rem;
  margin-right: 0.75rem;
  padding: var(--figure-spacing);
  width: calc(100% - 1.5rem);
  max-width: calc(100% - 1.5rem);
  box-sizing: border-box;
  background-color: var(--lightgray);
  border: 1px solid var(--gray);
  border-radius: 5px;
}

@media all and (max-width: 800px) {
  .figure-wrapper {
    margin-left: 0;
    margin-right: 0;
    width: 100%;
    max-width: 100%;
  }
}

figure {
  display: table;
  margin: 0;
}

figure img {
  margin: 0 auto;
  padding: 0;
  display: block;
  cursor: zoom-in;
  height: auto;
}

figcaption {
  display: table-caption;
  caption-side: bottom;
  text-align: center;
  position: relative;
  padding: var(--figure-spacing) var(--figure-spacing) calc(1.5 * var(--figure-spacing));
}

figcaption cite {
  font-variant: normal;
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 0.75rem;
  color: var(--gray);
}

.before-after {
  width: 100%;
}

.before-after__stage {
  --before-after-position: 50%;
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background: var(--light);
  isolation: isolate;
}

.before-after__image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.before-after__after {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  clip-path: inset(0 calc(100% - var(--before-after-position, 50%)) 0 0);
}

.before-after__after .before-after__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.before-after__range {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  pointer-events: none;
  z-index: 2;
}

.before-after__handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--before-after-position, 50%);
  width: 28px;
  height: 100%;
  transform: translateX(-50%);
  pointer-events: auto;
  touch-action: none;
  cursor: ew-resize;
  z-index: 3;
}

.before-after__handle::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: var(--secondary);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.before-after__handle::after {
  content: "⇔";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--secondary);
  background: var(--light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: var(--secondary);
  display: grid;
  place-items: center;
  font-size: 14px;
  line-height: 1;
  font-weight: 700;
}

.before-after__range:focus-visible ~ .before-after__handle::after {
  box-shadow: 0 0 0 4px var(--highlight), 0 2px 8px rgba(0, 0, 0, 0.2);
}

.before-after figcaption {
  margin-top: 0.5rem;
  display: block;
}

body.figcaption-carousel-open {
  overflow: hidden;
}

.figcaption-carousel {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.65);
}

.figcaption-carousel.is-open {
  display: flex;
}

.figcaption-carousel__stage {
  max-width: 96vw;
  max-height: 96vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.figcaption-carousel__image,
.figcaption-carousel__stage object {
  max-width: 96vw;
  max-height: 96vh;
  border-radius: 5px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.figcaption-carousel__nav,
.figcaption-carousel__close {
  position: absolute;
  z-index: 700;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  padding: 0.5rem 0.75rem;
  border-radius: 5px;
  line-height: 1.1;
  cursor: pointer;
}

.figcaption-carousel__nav:hover,
.figcaption-carousel__close:hover {
  background: rgba(0, 0, 0, 0.78);
}

.figcaption-carousel__nav:focus-visible,
.figcaption-carousel__close:focus-visible {
  outline: 2px solid var(--secondary);
  outline-offset: 2px;
}

.figcaption-carousel__close {
  top: 1rem;
  right: 1rem;
}

.figcaption-carousel__nav {
  top: 50%;
  transform: translateY(-50%);
}

.figcaption-carousel__prev {
  left: 1rem;
}

.figcaption-carousel__next {
  right: 1rem;
}

.figcaption-carousel__stage .before-after--carousel {
  width: auto;
  max-width: 96vw;
}

.figcaption-carousel__stage .before-after--carousel .before-after__stage {
  max-width: 96vw;
  max-height: 96vh;
}

.figcaption-carousel__stage .before-after--carousel .before-after__image {
  height: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .before-after,
  .before-after * {
    transition: none !important;
  }
}
`;
