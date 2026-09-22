# Filename Date Override

Fills missing note dates from `YYYY-MM-DD.md` filenames and Git author history.
Existing frontmatter dates take precedence.

To exclude a maintenance commit from Git-derived creation and modification dates,
add a trailer after a blank line at the end of its commit message:

```text
Convert explorer visibility settings

Content: false
```

This applies to every Markdown note touched by the commit, including Daily Notes.
Git parses the trailer block: mentioning `Content: false` in the subject or ordinary
body text does not exclude a commit. Trailer keys are case-insensitive; the value
must be `false`. If there are multiple `Content` trailers, any `false` value excludes
the commit.

The trailer survives rebases that preserve commit messages. Existing maintenance
commits need the trailer too; hash and commit-title exclusion lists are no longer
supported.
