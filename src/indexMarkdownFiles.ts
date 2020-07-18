import { performance } from "perf_hooks";
import * as vscode from "vscode";
import { getLogger } from "./core/logger/getLogger";
import { flagLinkedFileForUpdate } from "./reducers/linkedFiles";
import store from "./store";
import { findAllMarkdownFilesInWorkspace } from "./utils/util";
export async function indexMarkdownFiles(): Promise<void> {
  const parsingStart = performance.now();
  // initialize the workspace
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: false,
      title: "Linked Notes Loading Files",
    },
    async (progress) => {
      return await findAllMarkdownFilesInWorkspace().then(async (fileUris) => {
        const totalFileCount = fileUris.length;
        let parsedCount = 0;
        return await Promise.all(
          fileUris.map(
            async (uri) =>
              await Promise.resolve(
                vscode.workspace
                  .openTextDocument(uri)
                  .then((doc) => flagLinkedFileForUpdate(store, doc))
                  .then(() => {
                    progress.report({
                      message: `indexed ${parsedCount++}/${totalFileCount} files`,
                      increment: 1 / totalFileCount,
                    });
                  })
              )
          )
        );
      });
    }
  );

  const parsingEnd = performance.now();
  getLogger().info(
    `parsed all markdown files. ${(parsingEnd - parsingStart) / 1000} seconds`
  );
}
