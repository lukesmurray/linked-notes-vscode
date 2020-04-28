import * as vscode from "vscode";
import {
  MarkdownCompletionProvider,
  markdownCompletionTriggerChars,
  MarkdownDefinitionProvider,
} from "./completions";
import { MarkdownSnippetCompletionItemProvider } from "./snippets";
import store from "./store";
import { findAllMarkdownFilesInWorkspace } from "./util";
import {
  documentAdded,
  getDocumentIdFromUri,
  documentRenamed,
  documentDeleted as documentRemoved,
} from "./reducers/documents";

/* TODO(lukemurray): ideas
- codelens for actions on links (https://code.visualstudio.com/api/references/vscode-api#CodeLens)
- decorations for references inline (https://code.visualstudio.com/api/references/vscode-api#DecorationInstanceRenderOptions)
- codeAction for missing wiki style links (https://code.visualstudio.com/api/references/vscode-api#CodeActionProvider)
  - https://github.com/microsoft/vscode-extension-samples/tree/master/code-actions-sample
- rename provider for links, tags, people, etc
- document link provider for wiki links https://code.visualstudio.com/api/references/vscode-api#DocumentLink
*/

/* TODO(lukemurray): tasks
- refactor completions to be lazy
  - Events to be aware of
    - onDidChangeTextDocument to search for changes (i.e. only in range that got replaced)
    - onDidRenameFiles
    - onDidDeleteFiles
    - onDidCreateFiles
  - basic model will be
    - 1. on load get all the completions across the workspace
    - 2. on any of the changes refresh the completions as necessary
- make code DRY
- create output channel for error logs
  - https://github.com/vscode-restructuredtext/vscode-restructuredtext/commit/460f9f37cdf048e4c30d2705ff9b89ebd03f535b
*/

export async function activate(context: vscode.ExtensionContext) {
  const md = { scheme: "file", language: "markdown" };
  vscode.languages.setLanguageConfiguration("markdown", {
    wordPattern: /([\+\@\#\.\/\\\-\w]+)/,
  });

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      md,
      new MarkdownCompletionProvider(store),
      ...markdownCompletionTriggerChars
    )
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      md,
      new MarkdownDefinitionProvider(store)
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      md,
      new MarkdownSnippetCompletionItemProvider(store)
    )
  );

  await findAllMarkdownFilesInWorkspace().then((fileUris) => {
    fileUris.map((uri) =>
      vscode.workspace.openTextDocument(uri).then((textDoc) => {
        store.dispatch(documentAdded(textDoc));
      })
    );
  });

  // Add all of the event listeners

  vscode.workspace.onDidCreateFiles((e) => {
    for (let fileUri of e.files) {
      vscode.workspace.openTextDocument(fileUri).then((textDoc) => {
        store.dispatch(documentAdded(textDoc));
      });
    }
  });

  vscode.workspace.onDidChangeTextDocument((e) => {
    // TODO(lukemurray): handle changes in text documents
    console.log("TODO: handle changes text document");
  });

  vscode.workspace.onDidRenameFiles((e) => {
    for (let file of e.files) {
      store.dispatch(
        documentRenamed({
          id: getDocumentIdFromUri(file.oldUri),
          changes: { uri: file.newUri },
        })
      );
    }
  });

  vscode.workspace.onDidDeleteFiles((e) => {
    for (let fileUri of e.files) {
      store.dispatch(documentRemoved(getDocumentIdFromUri(fileUri)));
    }
  });
}
