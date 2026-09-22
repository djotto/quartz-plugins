// src/index.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
function dateFromFilename(filePath) {
  const fileName = path.basename(filePath);
  const match = /^(\d{4})-(\d{2})-(\d{2})\.md$/.exec(fileName);
  if (!match) return void 0;
  const [, year, month, day] = match;
  const dateString = `${year}-${month}-${day}`;
  const candidate = /* @__PURE__ */ new Date(`${dateString}T00:00:00`);
  const isValidDate2 = !Number.isNaN(candidate.getTime()) && candidate.getFullYear().toString() === year && (candidate.getMonth() + 1).toString().padStart(2, "0") === month && candidate.getDate().toString().padStart(2, "0") === day;
  return isValidDate2 ? dateString : void 0;
}
function repositoryPath(filePath) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const relativePath = path.relative(process.cwd(), absolutePath) || path.basename(absolutePath);
  return relativePath.split(path.sep).join("/");
}
function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}
function isChangeStatus(value) {
  return /^[ACDMRTUXB]\d*$/.test(value);
}
function gitDate(value, id) {
  if (!isValidDate(value)) return void 0;
  return {
    value,
    milliseconds: new Date(value).getTime(),
    id
  };
}
function recordGitDates(dates, filePath, value, id) {
  const candidate = gitDate(value, id);
  if (!candidate) return;
  const previous = dates.get(filePath);
  if (!previous) {
    dates.set(filePath, { created: candidate, modified: candidate });
    return;
  }
  if (candidate.milliseconds < previous.created.milliseconds || candidate.milliseconds === previous.created.milliseconds && candidate.id.localeCompare(previous.created.id) < 0) {
    previous.created = candidate;
  }
}
function loadGitDates() {
  const dates = /* @__PURE__ */ new Map();
  const renamedTo = /* @__PURE__ */ new Map();
  const recordPathAndRenames = (filePath, value, id) => {
    const currentPaths = renamedTo.get(filePath);
    if (!currentPaths) {
      recordGitDates(dates, filePath, value, id);
      return;
    }
    for (const currentPath of currentPaths) {
      recordGitDates(dates, currentPath, value, id);
    }
  };
  const followRename = (oldPath, newPath) => {
    const currentPaths = renamedTo.get(oldPath) ?? /* @__PURE__ */ new Set();
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
        "HEAD"
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      }
    );
    const tokens = output.split("\0");
    let commitId;
    let commitDate;
    let ignoreCommit = false;
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index] ?? "";
      if (token.trim() === "commit") {
        commitId = tokens[index + 1];
        commitDate = tokens[index + 2];
        const contentTrailers = tokens[index + 3] ?? "";
        ignoreCommit = commitId === void 0 || contentTrailers.split("\n").some((value) => value.trim() === "false");
        index += 3;
        continue;
      }
      const status = token.trim();
      if (!commitId || !commitDate || !isChangeStatus(status)) continue;
      const oldPath = tokens[index + 1];
      if (oldPath === void 0) continue;
      index += 1;
      const isRenameOrCopy = status.startsWith("R") || status.startsWith("C");
      const changedPath = isRenameOrCopy ? tokens[index + 1] : oldPath;
      if (isRenameOrCopy) index += 1;
      if (changedPath === void 0) continue;
      if (!ignoreCommit)
        recordPathAndRenames(changedPath, commitDate, commitId);
      if (status.startsWith("R")) followRename(oldPath, changedPath);
    }
  } catch {
  }
  return dates;
}
function filesystemModifiedDate(filePath) {
  try {
    return fs.statSync(path.resolve(process.cwd(), filePath)).mtimeMs;
  } catch {
  }
  return void 0;
}
var FilenameDateOverride = () => {
  let datesByPath;
  return {
    name: "FilenameDateOverride",
    markdownPlugins() {
      return [
        () => {
          return (_tree, file) => {
            const filePath = file.data.filePath ?? file.path;
            if (typeof filePath !== "string") return;
            const filenameDate = dateFromFilename(filePath);
            const frontmatter = file.data.frontmatter ?? {};
            const nextFrontmatter = { ...frontmatter };
            let changed = false;
            if (filenameDate) {
              if (nextFrontmatter.created === void 0) {
                nextFrontmatter.created = filenameDate;
                changed = true;
              }
              if (nextFrontmatter.published === void 0) {
                nextFrontmatter.published = filenameDate;
                changed = true;
              }
            }
            datesByPath ??= loadGitDates();
            const historyDates = datesByPath.get(repositoryPath(filePath));
            if (!filenameDate && nextFrontmatter.created === void 0) {
              const created = historyDates?.created.value ?? filesystemModifiedDate(filePath);
              if (created !== void 0) {
                nextFrontmatter.created = created;
                changed = true;
              }
            }
            if (nextFrontmatter.modified === void 0 && historyDates) {
              nextFrontmatter.modified = historyDates.modified.value;
              changed = true;
            }
            if (changed) {
              file.data.frontmatter = nextFrontmatter;
            }
          };
        }
      ];
    }
  };
};
var index_default = FilenameDateOverride;
export {
  FilenameDateOverride,
  index_default as default
};
