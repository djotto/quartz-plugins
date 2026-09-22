export const calloutStyles = String.raw`
.callout {
  margin-left: 0.75rem;
  margin-right: 0.75rem;

  --callout-icon-book: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 16 64 64"><g><path fill="currentColor" d="M22.5,28.3v33.6c15.6,0,18.5,1.9,24,4.7V32.9C43.7,30.1,39.6,28.3,22.5,28.3z M73.5,28.3 c-17.1,0-21.3,1.9-24,4.7v33.6c5.5-2.8,8.4-4.7,24-4.7V28.3z M15.5,31.8v36H44c-4.6-2.2-7.9-3.5-21.5-3.5h-2.3v-2.3V31.8H15.5z M75.9,31.8v30.1v2.3h-2.3c-13.6,0-16.9,1.3-21.5,3.5h28.5v-36H75.9z"></path></g></svg>');
  --callout-icon-newspaper: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g><g><path fill="currentColor" d="M28,7V3H0v22c0,0,0,4,4,4h25c0,0,3-0.062,3-4V7H28z M4,27c-2,0-2-2-2-2V5h24v20 c0,0.921,0.284,1.559,0.676,2H4z"/><rect x="4" y="9" fill="currentColor" width="20" height="2"/><rect x="15" y="21" fill="currentColor" width="7" height="2"/><rect x="15" y="17" fill="currentColor" width="9" height="2"/><rect x="15" y="13" fill="currentColor" width="9" height="2"/><rect x="4" y="13" fill="currentColor" width="9" height="10"/></g></g></svg>');
  --callout-icon-tangent: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g><path fill="currentColor" d="M10.127,9H23c1.105,0,2-0.895,2-2V4c0-1.105-0.895-2-2-2h-5V1c0-0.552-0.448-1-1-1h-2 c-0.552,0-1,0.448-1,1v1h-3.873C9.401,2,8.699,2.264,8.152,2.742L5.86,4.747c-0.455,0.398-0.455,1.107,0,1.505l2.292,2.005 C8.699,8.736,9.401,9,10.127,9z M12.5,5h7C19.776,5,20,5.224,20,5.5S19.776,6,19.5,6h-7C12.224,6,12,5.776,12,5.5S12.224,5,12.5,5z M26.14,12.747l-2.292-2.005C23.301,10.264,22.599,10,21.873,10H9c-1.105,0-2,0.895-2,2v3c0,1.105,0.895,2,2,2h5v14 c0,0.552,0.448,1,1,1h2c0.552,0,1-0.448,1-1V17h3.873c0.727,0,1.429-0.264,1.976-0.742l2.292-2.005 C26.595,13.854,26.595,13.146,26.14,12.747z M19.5,14h-7c-0.276,0-0.5-0.224-0.5-0.5s0.224-0.5,0.5-0.5h7c0.276,0,0.5,0.224,0.5,0.5 S19.776,14,19.5,14z"/></g></svg>');
}

.callout[data-callout="quote"][data-callout-source="book"] {
  --callout-icon: var(--callout-icon-book);
}

.callout[data-callout="quote"][data-callout-source="newspaper"] {
  --callout-icon: var(--callout-icon-newspaper);
}

.callout[data-callout="note"][data-callout-variants~="tangent"] {
  --color: #7a43b5;
  --border: #7a43b544;
  --bg: #7a43b510;
  --callout-icon: var(--callout-icon-tangent);

  .callout-icon {
    --callout-icon: var(--callout-icon-tangent);
  }
}

@media all and (max-width: 800px) {
  .callout {
    margin-left: 0;
    margin-right: 0;
  }
}
`;
