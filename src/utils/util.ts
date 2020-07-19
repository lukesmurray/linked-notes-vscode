import { exec } from "child_process";
import path from "path";
import * as vscode from "vscode";
import { getLogger } from "../core/logger/getLogger";
import { RootState } from "../reducers";
import { selectDefaultBibUri } from "../reducers/configuration";

export const DEFAULT_MARKDOWN_EXT = "md";

export const MarkDownDocumentSelector = {
  scheme: "file",
  language: "markdown",
};

export const MARKDOWN_FILE_EXT = ["md", "MD"] as const;

export const MARKDOWN_FILE_GLOB_PATTERN = `**/*.{${MARKDOWN_FILE_EXT.join(
  ","
)}}`;

export const BIB_FILE_EXT = ["json"] as const;

export const BIB_FILE_GLOB_PATTERN = `**/*.{${BIB_FILE_EXT.join(",")}}`;

export function isMarkdownFile(uri: vscode.Uri): boolean {
  return (
    uri.scheme === "file" &&
    MARKDOWN_FILE_EXT.some((ext) => uri.fsPath.endsWith(ext))
  );
}

export function isDefaultBibFile(uri: vscode.Uri, state: RootState): boolean {
  return (
    uri.scheme === "file" && uri.fsPath === selectDefaultBibUri(state)?.fsPath
  );
}

export async function findAllMarkdownFilesInWorkspace(): Promise<vscode.Uri[]> {
  return (await findNonIgnoredFiles(MARKDOWN_FILE_GLOB_PATTERN)).filter(
    (f) => f.scheme === "file"
  );
}

export async function delay(ms: number): Promise<void> {
  return await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// return true if t is not null or undefined
// very useful in filter functions
export function isNotNullOrUndefined<T>(t: T | undefined | null): t is T {
  return t !== undefined && t !== null;
}

// TODO: https://github.com/TomasHubelbauer/vscode-extension-findFilesWithExcludes
// TODO: https://github.com/Microsoft/vscode/issues/48674 for finding MarkDown files that VS Code considers not ignored
// TODO: https://github.com/Microsoft/vscode/issues/47645 for finding MarkDown files no matter the extension (VS Code language to extension)
// TODO: https://github.com/Microsoft/vscode/issues/11838 for maybe telling if file is MarkDown using an API
// TODO: https://github.com/Microsoft/vscode/blob/release/1.27/extensions/git/src/api/git.d.ts instead of Git shell if possible
async function findNonIgnoredFiles(
  pattern: string,
  checkGitIgnore = true
): Promise<vscode.Uri[]> {
  const exclude = [
    ...Object.keys(
      (await vscode.workspace
        .getConfiguration("search", null)
        .get("exclude")) ?? {}
    ),
    ...Object.keys(
      (await vscode.workspace.getConfiguration("files", null).get("exclude")) ??
        {}
    ),
  ].join(",");

  const uris = await vscode.workspace.findFiles(pattern, `{${exclude}}`);
  if (!checkGitIgnore) {
    return uris;
  }

  const workspaceRelativePaths = uris.map((uri) =>
    vscode.workspace.asRelativePath(uri, false)
  );
  for (const workspaceDirectory of vscode.workspace.workspaceFolders ?? []) {
    const workspaceDirectoryPath = workspaceDirectory.uri.fsPath;
    try {
      const { stdout, stderr } = await new Promise<{
        stdout: string | undefined;
        stderr: string | undefined;
      }>((resolve, reject) => {
        exec(
          `git check-ignore ${workspaceRelativePaths.join(" ")}`,
          { cwd: workspaceDirectoryPath },
          // https://git-scm.com/docs/git-check-ignore#_exit_status
          // @ts-expect-error
          (error: Error & { code?: 0 | 1 | 128 }, stdout, stderr) => {
            if (
              error !== undefined &&
              error !== null &&
              error.code !== 0 &&
              error.code !== 1
            ) {
              reject(error);
              return;
            }

            resolve({ stdout, stderr });
          }
        );
      });

      if ((stderr?.length ?? 0) !== 0) {
        throw new Error(stderr);
      }

      for (const relativePath of stdout?.split?.("\n") ?? []) {
        const uri = vscode.Uri.file(
          path.join(workspaceDirectoryPath, relativePath)
        );
        const index = uris.findIndex((u) => u.fsPath === uri.fsPath);
        if (index > -1) {
          uris.splice(index, 1);
        }
      }
    } catch (error) {
      void getLogger().error("find markdown files error");
    }
  }

  return uris;
}
