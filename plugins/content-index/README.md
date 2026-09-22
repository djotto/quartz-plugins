# Content Index

A Quartz v5 emitter that generates a sitemap, RSS feed, and `contentIndex.json`.

The JSON fields are explicitly configured from page data, frontmatter, or computed values. RSS can
be limited to a content folder, can emit full HTML with absolute URLs, and supports stable GUIDs
based on filenames. Encrypted pages never expose rich content in the JSON index.
