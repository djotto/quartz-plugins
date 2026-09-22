import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { VFile } from "vfile";
import { FilenameDateOverride } from "./index.js";

function runFilenameDateOverride(
  filePath: string,
  frontmatter?: Record<string, unknown>,
) {
  const plugin = FilenameDateOverride();
  const plugins = plugin.markdownPlugins?.({} as never) ?? [];
  const attacher = plugins[0] as unknown as () => (
    tree: unknown,
    file: VFile,
  ) => void;
  const transformer = attacher();
  const file = new VFile({ path: filePath });
  file.data.filePath = filePath as never;
  if (frontmatter) {
    file.data.frontmatter = frontmatter as never;
  }

  transformer({}, file);
  return file;
}

describe("FilenameDateOverride", () => {
  test("sets created and published from YYYY-MM-DD.md filenames", () => {
    const file = runFilenameDateOverride(
      "content/Test notes/2025/2025-08-29.md",
    );

    const frontmatter = file.data.frontmatter as Record<string, unknown>;
    assert.equal(frontmatter.created, "2025-08-29");
    assert.equal(frontmatter.published, "2025-08-29");
    assert.equal(frontmatter.modified, undefined);
  });

  test("does not overwrite existing created or published frontmatter", () => {
    const file = runFilenameDateOverride(
      "content/Test notes/2025/2025-08-29.md",
      {
        created: "2001-01-01",
        published: "2002-02-02",
      },
    );

    const frontmatter = file.data.frontmatter as Record<string, unknown>;
    assert.equal(frontmatter.created, "2001-01-01");
    assert.equal(frontmatter.published, "2002-02-02");
  });

  test("fills only missing date fields", () => {
    const file = runFilenameDateOverride(
      "content/Test notes/2025/2025-08-29.md",
      {
        created: "2001-01-01",
      },
    );

    const frontmatter = file.data.frontmatter as Record<string, unknown>;
    assert.equal(frontmatter.created, "2001-01-01");
    assert.equal(frontmatter.published, "2025-08-29");
  });

  test("does not overwrite existing modified frontmatter", () => {
    const file = runFilenameDateOverride(
      "content/Test notes/2025/2025-08-29.md",
      {
        modified: "2003-03-03",
      },
    );

    const frontmatter = file.data.frontmatter as Record<string, unknown>;
    assert.equal(frontmatter.modified, "2003-03-03");
  });

  test("ignores invalid date filenames", () => {
    const file = runFilenameDateOverride(
      "content/Test notes/2025/2025-02-30.md",
    );

    assert.equal(file.data.frontmatter, undefined);
  });

  test("ignores non-date filenames", () => {
    const file = runFilenameDateOverride("content/Test notes/index.md");

    assert.equal(file.data.frontmatter, undefined);
  });

  test("uses the first Git-changing commit for non-date filenames", () => {
    const repository = mkdtempSync(
      path.join(tmpdir(), "filename-date-override-git-"),
    );
    const originalCwd = process.cwd();

    try {
      process.chdir(repository);
      mkdirSync("notes", { recursive: true });
      writeFileSync("notes/old-note.md", "first\n");
      writeFileSync("notes/another-note.md", "first\n");
      execFileSync("git", ["init", "-q"]);
      execFileSync("git", ["config", "user.email", "test@example.com"]);
      execFileSync("git", ["config", "user.name", "Test User"]);
      execFileSync("git", [
        "add",
        "notes/old-note.md",
        "notes/another-note.md",
      ]);
      execFileSync(
        "git",
        ["-c", "commit.gpgSign=false", "commit", "-q", "-m", "first"],
        {
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: "2020-01-02T03:04:05Z",
            GIT_COMMITTER_DATE: "2020-01-02T03:04:05Z",
          },
        },
      );
      writeFileSync("notes/old-note.md", "second\n");
      execFileSync("git", ["add", "notes/old-note.md"]);
      execFileSync(
        "git",
        ["-c", "commit.gpgSign=false", "commit", "-q", "-m", "second"],
        {
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: "2021-02-03T04:05:06Z",
            GIT_COMMITTER_DATE: "2021-02-03T04:05:06Z",
          },
        },
      );

      const plugin = FilenameDateOverride();
      const plugins = plugin.markdownPlugins?.({} as never) ?? [];
      const attacher = plugins[0] as unknown as () => (
        tree: unknown,
        file: VFile,
      ) => void;
      const transformer = attacher();
      const transform = (filePath: string) => {
        const file = new VFile({ path: filePath });
        file.data.filePath = filePath as never;
        transformer({}, file);
        return file;
      };

      const file = transform("notes/old-note.md");
      const frontmatter = file.data.frontmatter as Record<string, unknown>;
      assert.equal(frontmatter.created, "2020-01-02T03:04:05Z");
      assert.equal(frontmatter.modified, "2021-02-03T04:05:06Z");
      assert.equal(frontmatter.published, undefined);

      // The history map is cached by the plugin instance. Removing Git after
      // the first lookup proves the second note does not rescan history.
      rmSync(path.join(repository, ".git"), { recursive: true, force: true });
      const anotherFile = transform("notes/another-note.md");
      const anotherFrontmatter = anotherFile.data.frontmatter as Record<
        string,
        unknown
      >;
      assert.equal(anotherFrontmatter.created, "2020-01-02T03:04:05Z");
      assert.equal(anotherFrontmatter.modified, "2020-01-02T03:04:05Z");
    } finally {
      process.chdir(originalCwd);
      rmSync(repository, { recursive: true, force: true });
    }
  });

  test("falls back to filesystem mtime when Git history is unavailable", () => {
    const repository = mkdtempSync(
      path.join(tmpdir(), "filename-date-override-fs-"),
    );
    const originalCwd = process.cwd();

    try {
      process.chdir(repository);
      writeFileSync("old-note.md", "new\n");

      const file = runFilenameDateOverride("old-note.md");
      const frontmatter = file.data.frontmatter as Record<string, unknown>;
      assert.equal(typeof frontmatter.created, "number");
      assert.ok((frontmatter.created as number) > 0);
    } finally {
      process.chdir(originalCwd);
      rmSync(repository, { recursive: true, force: true });
    }
  });

  test("follows rename chains, including renames excluded from content history", () => {
    const repository = mkdtempSync(
      path.join(tmpdir(), "filename-date-override-renames-"),
    );
    const originalCwd = process.cwd();

    const commit = (message: string, authorDate: string) => {
      execFileSync("git", ["add", "content"]);
      execFileSync(
        "git",
        ["-c", "commit.gpgSign=false", "commit", "-q", "-m", message],
        {
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: authorDate,
            GIT_COMMITTER_DATE: authorDate,
          },
        },
      );
    };

    try {
      process.chdir(repository);
      mkdirSync("content", { recursive: true });
      execFileSync("git", ["init", "-q"]);
      execFileSync("git", ["config", "user.email", "test@example.com"]);
      execFileSync("git", ["config", "user.name", "Test User"]);

      writeFileSync("content/original-note.md", "first\n");
      commit("Create note", "2020-01-02T03:04:05Z");
      writeFileSync("content/original-note.md", "second\n");
      commit("Edit note", "2021-02-03T04:05:06Z");
      execFileSync("git", [
        "mv",
        "content/original-note.md",
        "content/intermediate-note.md",
      ]);
      commit("Rename note", "2022-03-04T05:06:07Z");
      writeFileSync(
        "content/original-note.md",
        "a different note using the old name\n",
      );
      commit("Reuse old note name", "2022-06-07T08:09:10Z");
      execFileSync("git", [
        "mv",
        "content/intermediate-note.md",
        "content/current-note.md",
      ]);
      commit("Reorganize notes\n\nContent: false", "2023-04-05T06:07:08Z");

      const frontmatter = runFilenameDateOverride("content/current-note.md")
        .data.frontmatter as Record<string, unknown>;
      assert.equal(frontmatter.created, "2020-01-02T03:04:05Z");
      assert.equal(frontmatter.modified, "2022-03-04T05:06:07Z");

      const reusedFrontmatter = runFilenameDateOverride(
        "content/original-note.md",
      ).data.frontmatter as Record<string, unknown>;
      assert.equal(reusedFrontmatter.created, "2022-06-07T08:09:10Z");
      assert.equal(reusedFrontmatter.modified, "2022-06-07T08:09:10Z");
    } finally {
      process.chdir(originalCwd);
      rmSync(repository, { recursive: true, force: true });
    }
  });

  test("falls back to VFile path when filePath metadata is missing", () => {
    const plugin = FilenameDateOverride();
    const plugins = plugin.markdownPlugins?.({} as never) ?? [];
    const attacher = plugins[0] as unknown as () => (
      tree: unknown,
      file: VFile,
    ) => void;
    const transformer = attacher();
    const file = new VFile({ path: "content/Daily notes/2026/2026-01-18.md" });

    transformer({}, file);

    const frontmatter = file.data.frontmatter as Record<string, unknown>;
    assert.equal(frontmatter.created, "2026-01-18");
    assert.equal(frontmatter.published, "2026-01-18");
  });

  test("uses author history while ignoring commits with Content: false trailers", () => {
    const repository = mkdtempSync(
      path.join(tmpdir(), "filename-date-override-migration-"),
    );
    const originalCwd = process.cwd();

    const commit = (
      message: string,
      authorDate: string,
      committerDate: string,
    ) => {
      writeFileSync("content/2020-01-02.md", message);
      writeFileSync("content/ordinary-note.md", message);
      execFileSync("git", ["add", "content"]);
      execFileSync(
        "git",
        ["-c", "commit.gpgSign=false", "commit", "-q", "-m", message],
        {
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: authorDate,
            GIT_COMMITTER_DATE: committerDate,
          },
        },
      );
    };

    const assertDates = (modified: string) => {
      const daily = runFilenameDateOverride("content/2020-01-02.md").data
        .frontmatter;
      assert.equal(daily?.created, "2020-01-02");
      assert.equal(daily?.published, "2020-01-02");
      assert.equal(daily?.modified, modified);

      const ordinary = runFilenameDateOverride("content/ordinary-note.md").data
        .frontmatter;
      assert.equal(ordinary?.created, "2020-02-03T04:05:06Z");
      assert.equal(ordinary?.published, undefined);
      assert.equal(ordinary?.modified, modified);
    };

    try {
      process.chdir(repository);
      mkdirSync("content", { recursive: true });
      execFileSync("git", ["init", "-q"]);
      execFileSync("git", ["config", "user.email", "test@example.com"]);
      execFileSync("git", ["config", "user.name", "Test User"]);
      // An ignored introduction must not supply the ordinary note's creation date.
      commit(
        "Import scaffolding\n\nContent: false",
        "2019-01-01T00:00:00Z",
        "2026-09-01T00:00:00Z",
      );
      commit("Author edit", "2020-02-03T04:05:06Z", "2026-09-01T01:00:00Z");
      commit(
        "Mechanical migration\n\nContent: false\nSigned-off-by: Test User <test@example.com>",
        "2026-09-02T02:00:00Z",
        "2026-09-02T02:00:00Z",
      );
      assertDates("2020-02-03T04:05:06Z");

      // Rewriting a commit's title, hash and committer date preserves the exclusion.
      const oldId = execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim();
      execFileSync(
        "git",
        [
          "-c",
          "commit.gpgSign=false",
          "commit",
          "--amend",
          "-q",
          "-m",
          "Renamed maintenance\n\nContent: false",
        ],
        { env: { ...process.env, GIT_COMMITTER_DATE: "2026-09-03T00:00:00Z" } },
      );
      assert.notEqual(
        execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
        oldId,
      );
      assertDates("2020-02-03T04:05:06Z");

      const includedMessages = [
        "Later author edit",
        "Content: false", // A subject alone is not a trailer.
        "Explain trailers\n\nContent: false\n\nThis is body text, not a trailer block.",
        "Explicit content edit\n\nContent: true",
        "Different key\n\nOther-Content: false",
        "Different value\n\nContent: falsehood",
        "Content, bulk convert menu: false to new discover.explorer: false semantics",
      ];
      for (const [index, message] of includedMessages.entries()) {
        const authorDate = `2026-09-${String(index + 4).padStart(2, "0")}T03:00:00Z`;
        commit(message, authorDate, "2026-09-11T04:00:00Z");
        assertDates(authorDate);
      }

      // Git matches trailer keys without case sensitivity and permits whitespace.
      commit(
        "More maintenance\n\ncOnTeNt:   false",
        "2026-09-12T00:00:00Z",
        "2026-09-12T00:00:00Z",
      );
      assertDates("2026-09-10T03:00:00Z");
      commit(
        "Multiple trailers\n\nContent: true\nContent: false",
        "2026-09-13T00:00:00Z",
        "2026-09-13T00:00:00Z",
      );
      assertDates("2026-09-10T03:00:00Z");
    } finally {
      process.chdir(originalCwd);
      rmSync(repository, { recursive: true, force: true });
    }
  });
});
