import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import type { QuartzTransformerPlugin } from "@quartz-community/types";

type Frontmatter = Record<string, unknown>;

function dateFromFilename(filePath: string): string | undefined {
  const fileName = path.basename(filePath);
  const match = /^(\d{4})-(\d{2})-(\d{2})\.md$/.exec(fileName);
  if (!match) return undefined;

  const [, year, month, day] = match;
  const dateString = `${year}-${month}-${day}`;
  const candidate = new Date(`${dateString}T00:00:00`);
  const isValidDate =
    !Number.isNaN(candidate.getTime()) &&
    candidate.getFullYear().toString() === year &&
    (candidate.getMonth() + 1).toString().padStart(2, "0") === month &&
    candidate.getDate().toString().padStart(2, "0") === day;

  return isValidDate ? dateString : undefined;
}

function repositoryPath(filePath: string): string {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const relativePath =
    path.relative(process.cwd(), absolutePath) || path.basename(absolutePath);
  return relativePath.split(path.sep).join("/");
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

type GitDate = {
  value: string;
  milliseconds: number;
  id: string;
};

type GitDates = {
  created: GitDate;
  modified: GitDate;
};

function isChangeStatus(value: string): boolean {
  return /^[ACDMRTUXB]\d*$/.test(value);
}

function gitDate(value: string, id: string): GitDate | undefined {
  if (!isValidDate(value)) return undefined;

  return {
    value,
    milliseconds: new Date(value).getTime(),
    id,
  };
}

function recordGitDates(
  dates: Map<string, GitDates>,
  filePath: string,
  value: string,
  id: string,
): void {
  const candidate = gitDate(value, id);
  if (!candidate) return;

  const previous = dates.get(filePath);
  if (!previous) {
    dates.set(filePath, { created: candidate, modified: candidate });
    return;
  }

  if (
    candidate.milliseconds < previous.created.milliseconds ||
    (candidate.milliseconds === previous.created.milliseconds &&
      candidate.id.localeCompare(previous.created.id) < 0)
  ) {
    previous.created = candidate;
  }
}

// Use author dates because rebases preserve them while assigning new committer dates.
function loadGitDates(): Map<string, GitDates> {
  const dates = new Map<string, GitDates>();
  // `git log --name-status` is newest-first. When a rename is encountered,
  // associate the old path with the new path so older changes are also
  // recorded against the name that exists at HEAD.
  const renamedTo = new Map<string, Set<string>>();

  const recordPathAndRenames = (
    filePath: string,
    value: string,
    id: string,
  ): void => {
    const currentPaths = renamedTo.get(filePath);
    if (!currentPaths) {
      recordGitDates(dates, filePath, value, id);
      return;
    }
    for (const currentPath of currentPaths) {
      recordGitDates(dates, currentPath, value, id);
    }
  };

  const followRename = (oldPath: string, newPath: string): void => {
    const currentPaths = renamedTo.get(oldPath) ?? new Set<string>();
    currentPaths.add(newPath);
    for (const currentPath of renamedTo.get(newPath) ?? [])
      currentPaths.add(currentPath);
    renamedTo.set(oldPath, currentPaths);
  };

  try {
    const output = execFileSync(
      "git",
      [
        "log",
        "--format=commit%x00%H%x00%aI%x00%(trailers:key=Content,valueonly,unfold)",
        "--name-status",
        "--find-renames",
        "-z",
        "--diff-merges=first-parent",
        "HEAD",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );

    const tokens = output.split("\0");
    let commitId: string | undefined;
    let commitDate: string | undefined;
    let ignoreCommit = false;

    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index] ?? "";
      if (token.trim() === "commit") {
        commitId = tokens[index + 1];
        commitDate = tokens[index + 2];
        // Let Git identify trailers, so mentions in the subject or body do not count.
        const contentTrailers = tokens[index + 3] ?? "";
        ignoreCommit =
          commitId === undefined ||
          contentTrailers.split("\n").some((value) => value.trim() === "false");
        index += 3;
        continue;
      }

      const status = token.trim();
      if (!commitId || !commitDate || !isChangeStatus(status)) continue;

      const oldPath = tokens[index + 1];
      if (oldPath === undefined) continue;
      index += 1;

      const isRenameOrCopy = status.startsWith("R") || status.startsWith("C");
      const changedPath = isRenameOrCopy ? tokens[index + 1] : oldPath;
      if (isRenameOrCopy) index += 1;
      if (changedPath === undefined) continue;

      if (!ignoreCommit)
        recordPathAndRenames(changedPath, commitDate, commitId);
      // An excluded maintenance rename still connects the current path to its
      // earlier content history, even though the rename date itself is ignored.
      if (status.startsWith("R")) followRename(oldPath, changedPath);
    }
  } catch {}

  return dates;
}

function filesystemModifiedDate(filePath: string): number | undefined {
  try {
    return fs.statSync(path.resolve(process.cwd(), filePath)).mtimeMs;
  } catch {}

  return undefined;
}

export const FilenameDateOverride: QuartzTransformerPlugin = () => {
  let datesByPath: Map<string, GitDates> | undefined;

  return {
    name: "FilenameDateOverride",
    markdownPlugins() {
      return [
        () => {
          return (_tree, file) => {
            const filePath = file.data.filePath ?? file.path;
            if (typeof filePath !== "string") return;

            const filenameDate = dateFromFilename(filePath);
            const frontmatter = (file.data.frontmatter ?? {}) as Frontmatter;
            const nextFrontmatter = { ...frontmatter };
            let changed = false;

            if (filenameDate) {
              if (nextFrontmatter.created === undefined) {
                nextFrontmatter.created = filenameDate;
                changed = true;
              }

              if (nextFrontmatter.published === undefined) {
                nextFrontmatter.published = filenameDate;
                changed = true;
              }
            }

            datesByPath ??= loadGitDates();
            const historyDates = datesByPath.get(repositoryPath(filePath));

            if (!filenameDate && nextFrontmatter.created === undefined) {
              const created =
                historyDates?.created.value ?? filesystemModifiedDate(filePath);
              if (created !== undefined) {
                nextFrontmatter.created = created;
                changed = true;
              }
            }

            if (nextFrontmatter.modified === undefined && historyDates) {
              nextFrontmatter.modified = historyDates.modified.value;
              changed = true;
            }

            if (changed) {
              file.data.frontmatter =
                nextFrontmatter as typeof file.data.frontmatter;
            }
          };
        },
      ];
    },
  };
};

export default FilenameDateOverride;
