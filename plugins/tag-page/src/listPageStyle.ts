export const listPageStyle = `
ul.section-ul {
  list-style: none;
  margin-top: 2em;
  padding-left: 0;
}

li.section-li {
  margin-bottom: 1em;
}

li.section-li > .section {
  display: grid;
  grid-template-columns: fit-content(8em) minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  align-items: start;
}

li.section-li > .section > .desc {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

li.section-li > .section > .desc > h3 {
  margin: 0;
}

li.section-li > .section > .desc > h3 > a {
  background-color: transparent;
}

li.section-li > .section > .meta {
  grid-column: 1;
  grid-row: 1;
  margin: 0 1em 0 0;
  opacity: 0.6;
}

li.section-li > .section > .description {
  grid-column: 2;
  grid-row: 2;
  margin: 0.35em 0 0;
  color: var(--gray);
  font-size: 0.95em;
  line-height: 1.4;
}

li.section-li > .section > .description + .tags {
  margin-top: 0.35em;
}

li.section-li > .section > .tags {
  grid-column: 2;
  grid-row: 3;
  margin: 0;
}

li.section-li > .section > .description p,
li.section-li > .section > .description li {
  line-height: inherit;
}

li.section-li > .section > .description > :first-child {
  margin-top: 0;
}

li.section-li > .section > .description > :last-child {
  margin-bottom: 0;
}

@media all and (max-width: 600px) {
  li.section-li > .section > .tags {
    display: none;
  }
}

.popover .section {
  grid-template-columns: fit-content(8em) 1fr !important;
}

.popover .section > .tags {
  display: none;
}
`;
