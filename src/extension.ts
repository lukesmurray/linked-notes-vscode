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
  getLinkedNotesDocumentIdFromUri,
  documentUpdated,
  documentDeleted,
  convertTextDocumentToLinkedNotesDocument,
  getLinkedNotesDocumentIdFromTextDocument,
  getSyntaxTreeFromTextDocumentSync,
} from "./reducers/documents";

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

  // Add all of the event listeners

  vscode.workspace.onDidCreateFiles((e) => {
    for (let fileUri of e.files) {
      vscode.workspace
        .openTextDocument(fileUri)
        .then(convertTextDocumentToLinkedNotesDocument)
        .then((textDoc) => {
          store.dispatch(documentAdded(textDoc));
        });
    }
  });

  vscode.workspace.onDidChangeTextDocument((e) => {
    store.dispatch(
      documentUpdated({
        id: getLinkedNotesDocumentIdFromTextDocument(e.document),
        changes: { syntaxTree: getSyntaxTreeFromTextDocumentSync(e.document) },
      })
    );
  });

  vscode.workspace.onDidRenameFiles((e) => {
    for (let file of e.files) {
      store.dispatch(
        documentUpdated({
          id: getLinkedNotesDocumentIdFromUri(file.oldUri),
          changes: {
            id: getLinkedNotesDocumentIdFromUri(file.newUri),
          },
        })
      );
    }
  });

  vscode.workspace.onDidDeleteFiles((e) => {
    for (let fileUri of e.files) {
      store.dispatch(documentDeleted(getLinkedNotesDocumentIdFromUri(fileUri)));
    }
  });

  findAllMarkdownFilesInWorkspace().then((fileUris) => {
    fileUris.map((uri) =>
      vscode.workspace
        .openTextDocument(uri)
        .then(convertTextDocumentToLinkedNotesDocument)
        .then((textDoc) => {
          store.dispatch(documentAdded(textDoc));
        })
    );
  });
}
